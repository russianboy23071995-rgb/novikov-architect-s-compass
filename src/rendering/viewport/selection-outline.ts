import type { ProjectionState } from "./projection-state.ts";

type Vertex = readonly [number, number, number];
export type OutlineEdge = readonly [Vertex, Vertex];
type Surface = { vertices: readonly Vertex[]; normal: Vertex };

/** Boundary/crease edges of a conforming polygon mesh. Adapters supply only the
 * selected entity's displayed faces. No domain identity or selection is owned here.
 * Shared vertices must use identical coordinates (as buildSolid does). Nonconforming
 * meshes with T-junctions need subdivision in their adapter before using this path.
 */
export function selectionEdges(faces: readonly Surface[]): OutlineEdge[] {
  const edges = new Map<string, { edge: OutlineEdge; normals: Vertex[] }>();
  for (const face of faces) {
    if (![...face.vertices.flat(), ...face.normal].every(Number.isFinite)) continue;
    for (let i = 0; i < face.vertices.length; i++) {
      const a = face.vertices[i]!,
        b = face.vertices[(i + 1) % face.vertices.length]!;
      const ka = a.join(","),
        kb = b.join(",");
      if (ka === kb) continue;
      const key = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
      const previous = edges.get(key);
      if (previous) previous.normals.push(face.normal);
      else edges.set(key, { edge: [a, b], normals: [face.normal] });
    }
  }
  return [...edges.values()]
    .filter(({ normals }) => {
      if (normals.length !== 2) return true;
      // Unit normals from the renderer; omit coplanar cell seams/triangle diagonals.
      return normals[0]!.some((v, i) => Math.abs(v - normals[1]![i]!) > 1e-10);
    })
    .map(({ edge }) => edge);
}

/** Screen-width ribbons use the exact displayed projection and GPU depth test.
 * Tiny NDC bias avoids coincident-surface flicker; this is not an X-ray overlay.
 * Width is CSS pixels, independent of zoom and backbuffer/DPR.
 */
export function outlineTriangles(
  edges: readonly OutlineEdge[],
  projection: ProjectionState,
  width = 1.5,
): number[] {
  if (!Number.isFinite(width) || width <= 0) return [];
  const data: number[] = [];
  const { width: w, height: h } = projection.viewport;
  const tint = [0.68, 0.76, 0.8];
  for (const edge of edges) {
    const a = projection.project([...edge[0]]),
      b = projection.project([...edge[1]]);
    if (![...a, ...b].every(Number.isFinite)) continue;
    const dx = ((b[0] - a[0]) * w) / 2,
      dy = ((b[1] - a[1]) * h) / 2;
    const length = Math.hypot(dx, dy);
    if (length < 1e-9) continue;
    const ox = ((-dy / length) * width) / w,
      oy = ((dx / length) * width) / h;
    const corners = [
      [a[0] + ox, a[1] + oy, a[2] - 1e-6],
      [a[0] - ox, a[1] - oy, a[2] - 1e-6],
      [b[0] - ox, b[1] - oy, b[2] - 1e-6],
      [b[0] + ox, b[1] + oy, b[2] - 1e-6],
    ];
    for (const i of [0, 1, 2, 0, 2, 3]) data.push(...corners[i]!, ...tint);
  }
  return data;
}
