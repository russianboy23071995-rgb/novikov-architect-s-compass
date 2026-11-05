import { faceTriangles } from "../../geometry/solids/face-triangles.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
import { surfaceGroups, surfacePatch } from "./surface-patch.ts";
type Face = DisplaySurfaces["faces"][number];
type Chunk = { faces: Face[]; selected: boolean; offset: number; data: Float32Array };
const sameFaces = (a: Face[], b: Face[]) =>
  a.length === b.length &&
  a.every((face, i) => {
    const other = b[i]!;
    return (
      face === other ||
      (face.normal.every((v, k) => v === other.normal[k]) &&
        face.vertices.length === other.vertices.length &&
        face.vertices.every((p, j) => p.every((v, k) => v === other.vertices[j]![k])))
    );
  });
/** Floats per vertex: XYZ, RGB, the display priority below and the opacity. */
export const SOLID_VERTEX_FLOATS = 8;
/** Opacity of window glass (docs/FENSTER_TUEREN.md, G1); everything else is opaque. */
export const GLASS_OPACITY = 0.35;
/**
 * Display priority on coincident faces (docs/SLAB_ELEMENT.md, C3 Variante A): with equal
 * construction priority a ceiling slab is drawn over a wall face lying in the same plane,
 * so the shared surfaces never flicker. Later a material priority (0–100) decides cutting.
 */
export const SLAB_DISPLAY_PRIORITY = 1;
export function packSolidFaces(faces: readonly Face[], origin: Vector3, selected: boolean) {
  // Convex fan: n-2 triangles, three vertices, XYZ + RGB + priority + opacity. Round to Float32
  // only at the final write, exactly as the previous array conversion did.
  let length = 0;
  for (const face of faces)
    length += Math.max(0, face.vertices.length - 2) * 3 * SOLID_VERTEX_FLOATS;
  const data = new Float32Array(length);
  let offset = 0;
  for (const face of faces) {
    const light =
      0.5 + 0.5 * Math.max(0, face.normal[0] * 0.3 - face.normal[1] * 0.4 + face.normal[2] * 0.866);
    // Ceiling slabs a little lighter than walls (user decision 28.10.2026).
    // Roofs a warm grey, so they read apart from walls and slabs (docs/ROOF_ELEMENT.md, D2).
    // Window and door elements (FT2): white frames, a bluish pane, a light wooden door leaf.
    const [r, g, b] = (
      selected
        ? [0.38, 0.65, 0.78]
        : face.glass
          ? [0.6, 0.76, 0.88]
          : face.opening === "window"
            ? [0.95, 0.95, 0.95]
            : face.opening === "door"
              ? [0.88, 0.82, 0.72]
              : face.slab
                ? [0.84, 0.85, 0.87]
                : face.roof
                  ? [0.8, 0.72, 0.68]
                  : [0.72, 0.75, 0.79]
    ).map((c) => c * light) as [number, number, number];
    const priority = face.slab || face.roof ? SLAB_DISPLAY_PRIORITY : 0;
    const opacity = face.glass && !selected ? GLASS_OPACITY : 1;
    for (const triangle of faceTriangles(face.vertices.length))
      for (const index of triangle) {
        const point = face.vertices[index]!;
        data[offset++] = point[0] - origin[0];
        data[offset++] = point[1] - origin[1];
        data[offset++] = point[2] - origin[2];
        data[offset++] = r;
        data[offset++] = g;
        data[offset++] = b;
        data[offset++] = priority;
        data[offset++] = opacity;
      }
  }
  return data;
}
/** Disposable render cache. One combined GPU buffer, stable wall ranges, no model ownership.
 * A topology/visibility change rebuilds the layout; fixed-layout edits upload only changed ranges.
 */
export function createSolidBufferCache() {
  let chunks = new Map<string, Chunk>(),
    origin: Vector3 | null = null;
  let previous: DisplaySurfaces | null = null;
  let previousSelected = new Set<string>();
  let vertexCount = 0;
  return {
    update(solid: DisplaySurfaces, nextOrigin: Vector3, selected: ReadonlySet<string>) {
      const rebase = !origin || !origin.every((v, i) => v === nextOrigin[i]);
      if (previous === solid && !rebase) {
        const patches: { offset: number; data: Float32Array }[] = [];
        const changed = new Set([...previousSelected, ...selected]);
        for (const id of changed) {
          const chunk = chunks.get(id),
            active = selected.has(id);
          if (!chunk || chunk.selected === active) continue;
          chunk.data = packSolidFaces(chunk.faces, nextOrigin, active);
          chunk.selected = active;
          patches.push({ offset: chunk.offset * 4, data: chunk.data });
        }
        previousSelected = new Set(selected);
        return { full: null, patches, vertexCount };
      }
      const patch = surfacePatch(solid);
      const priorPatch = previous && surfacePatch(previous);
      const base = patch?.base ?? solid;
      // Both frames must share the exact immutable base, including visibility.
      // Include previous replacements to restore walls when the closure changes.
      if (!rebase && previous && (priorPatch?.base ?? previous) === base) {
        const ids = new Set([
          ...(patch?.replaced ?? []),
          ...(priorPatch?.replaced ?? []),
          ...previousSelected,
          ...selected,
        ]);
        const baseGroups = surfaceGroups(base);
        const updates: { id: string; chunk: Chunk }[] = [];
        let compatible = true;
        for (const id of ids) {
          const faces = patch?.replaced.has(id) ? patch.groups.get(id) : baseGroups.get(id);
          const old = chunks.get(id);
          if (!faces && !old) continue;
          if (!faces || !old) {
            compatible = false;
            break;
          }
          const active = selected.has(id);
          if (old.selected === active && sameFaces(old.faces, faces)) continue;
          const data = packSolidFaces(faces, nextOrigin, active);
          if (data.length !== old.data.length) {
            compatible = false;
            break;
          }
          updates.push({ id, chunk: { faces, selected: active, offset: old.offset, data } });
        }
        if (compatible) {
          for (const update of updates) chunks.set(update.id, update.chunk);
          previous = solid;
          previousSelected = new Set(selected);
          return {
            full: null,
            patches: updates.map(({ chunk }) => ({ offset: chunk.offset * 4, data: chunk.data })),
            vertexCount,
          };
        }
      }
      const groups = surfaceGroups(solid);
      let rebuild = rebase || chunks.size !== groups.size;
      const next = new Map<string, Chunk>();
      // Preserve range order even when preview composition puts changed walls at the end.
      const order = [...chunks.keys()].filter((id) => groups.has(id));
      for (const id of groups.keys()) if (!chunks.has(id)) order.push(id);
      const patches: { offset: number; data: Float32Array }[] = [];
      let length = 0;
      for (const id of order) {
        const faces = groups.get(id)!,
          old = chunks.get(id),
          active = selected.has(id);
        const unchanged = !rebase && old && old.selected === active && sameFaces(old.faces, faces);
        const data = unchanged ? old.data : packSolidFaces(faces, nextOrigin, active);
        if (!old || old.offset !== length || old.data.length !== data.length) rebuild = true;
        const chunk = { faces, selected: active, offset: length, data };
        next.set(id, chunk);
        if (!unchanged) patches.push({ offset: length * 4, data });
        length += data.length;
      }
      let full: Float32Array | null = null;
      if (rebuild) {
        full = new Float32Array(length);
        for (const chunk of next.values()) full.set(chunk.data, chunk.offset);
      }
      chunks = next;
      origin = [...nextOrigin];
      previous = solid;
      previousSelected = new Set(selected);
      vertexCount = length / SOLID_VERTEX_FLOATS;
      return { full, patches: full ? [] : patches, vertexCount };
    },
  };
}
