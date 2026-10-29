import { createBoxIndex } from "../../geometry/spatial/box-index.ts";
import type { DisplaySurfaces } from "./layer-display.ts";
import { faceTriangles } from "../../geometry/solids/face-triangles.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import { triangleDepth } from "../../geometry/projections/triangle-depth.ts";

/** Shared nearest wall surface for picking and anchor visibility. Smaller NDC z is nearer. */
export function nearestWallSurface(
  solid: Pick<DisplaySurfaces, "faces">,
  project: (point: Vector3) => Vector3,
  x: number,
  y: number,
): { wallId: string; depth: number; slab?: true; roof?: true } | null {
  if (![x, y].every(Number.isFinite) || Math.abs(x) > 1 || Math.abs(y) > 1) return null;
  let nearest: { wallId: string; depth: number; slab?: true; roof?: true } | null = null;
  for (const face of solid.faces) {
    const points = face.vertices.map(project);
    for (const [a, b, c] of faceTriangles(points.length)) {
      const depth = triangleDepth(points[a!]!, points[b!]!, points[c!]!, x, y);
      if (depth !== null && (!nearest || depth < nearest.depth))
        nearest = {
          wallId: face.wallId,
          depth,
          ...(face.slab ? { slab: true as const } : {}),
          ...(face.roof ? { roof: true as const } : {}),
        };
    }
  }
  return nearest;
}

/** Disposable depth query for one geometry/projection context. Exact narrow phase is unchanged. */
export function prepareNearestWallSurface(
  solid: Pick<DisplaySurfaces, "faces">,
  project: (point: Vector3) => Vector3,
) {
  const faces = solid.faces.map((face) => ({
    wallId: face.wallId,
    slab: face.slab,
    roof: face.roof,
    points: face.vertices.map((point) => [...project(point)] as Vector3),
  }));
  const fallback: number[] = [];
  const entries = faces.flatMap((face, order) => {
    if (!face.points.length || !face.points.every((p) => p.every(Number.isFinite))) {
      fallback.push(order);
      return [];
    }
    const xs = face.points.map((p) => p[0]),
      ys = face.points.map((p) => p[1]);
    const minX = Math.min(...xs),
      maxX = Math.max(...xs),
      minY = Math.min(...ys),
      maxY = Math.max(...ys);
    const magnitude = Math.max(1, Math.abs(minX), Math.abs(maxX), Math.abs(minY), Math.abs(maxY));
    // Conservative margin includes the existing barycentric boundary tolerance.
    // Extreme projections use the exact scan rather than risk numeric bounds loss.
    if (magnitude > 1e6) {
      fallback.push(order);
      return [];
    }
    const pad = magnitude * 1e-7;
    return [
      {
        box: { minX: minX - pad, maxX: maxX + pad, minY: minY - pad, maxY: maxY + pad },
        value: order,
      },
    ];
  });
  const index = createBoxIndex(entries);
  return (x: number, y: number): ReturnType<typeof nearestWallSurface> => {
    if (![x, y].every(Number.isFinite) || Math.abs(x) > 1 || Math.abs(y) > 1) return null;
    let nearest: ReturnType<typeof nearestWallSurface> = null;
    for (const i of [...index.query({ minX: x, maxX: x, minY: y, maxY: y }), ...fallback].sort(
      (a, b) => a - b,
    )) {
      const face = faces[i]!;
      for (const [a, b, c] of faceTriangles(face.points.length)) {
        const depth = triangleDepth(face.points[a!]!, face.points[b!]!, face.points[c!]!, x, y);
        if (depth !== null && (!nearest || depth < nearest.depth))
          nearest = {
            wallId: face.wallId,
            depth,
            ...(face.slab ? { slab: true as const } : {}),
            ...(face.roof ? { roof: true as const } : {}),
          };
      }
    }
    return nearest;
  };
}
