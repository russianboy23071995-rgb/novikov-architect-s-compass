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
export function packSolidFaces(faces: readonly Face[], origin: Vector3, selected: boolean) {
  // Convex fan: n-2 triangles, three vertices, XYZ + RGB. Round to Float32
  // only at the final write, exactly as the previous array conversion did.
  let length = 0;
  for (const face of faces) length += Math.max(0, face.vertices.length - 2) * 18;
  const data = new Float32Array(length);
  let offset = 0;
  for (const face of faces) {
    const light =
      0.5 + 0.5 * Math.max(0, face.normal[0] * 0.3 - face.normal[1] * 0.4 + face.normal[2] * 0.866);
    const r = (selected ? 0.38 : 0.72) * light;
    const g = (selected ? 0.65 : 0.75) * light;
    const b = (selected ? 0.78 : 0.79) * light;
    for (const triangle of faceTriangles(face.vertices.length))
      for (const index of triangle) {
        const point = face.vertices[index]!;
        data[offset++] = point[0] - origin[0];
        data[offset++] = point[1] - origin[1];
        data[offset++] = point[2] - origin[2];
        data[offset++] = r;
        data[offset++] = g;
        data[offset++] = b;
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
      vertexCount = length / 6;
      return { full, patches: full ? [] : patches, vertexCount: length / 6 };
    },
  };
}
