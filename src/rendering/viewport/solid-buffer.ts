import { faceTriangles } from "../../geometry/solids/face-triangles.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
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
  const data: number[] = [];
  for (const face of faces) {
    const light =
      0.5 + 0.5 * Math.max(0, face.normal[0] * 0.3 - face.normal[1] * 0.4 + face.normal[2] * 0.866);
    const tint = selected ? [0.38, 0.65, 0.78] : [0.72, 0.75, 0.79];
    for (const triangle of faceTriangles(face.vertices.length))
      for (const index of triangle)
        data.push(
          ...face.vertices[index]!.map((v, i) => v - origin[i]!),
          ...tint.map((v) => v * light),
        );
  }
  return new Float32Array(data);
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
      const groups = new Map<string, Face[]>();
      for (const face of solid.faces) {
        const group = groups.get(face.wallId);
        if (group) group.push(face);
        else groups.set(face.wallId, [face]);
      }
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
