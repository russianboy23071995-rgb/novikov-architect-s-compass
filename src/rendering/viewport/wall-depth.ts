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
): { wallId: string; depth: number } | null {
  if (![x, y].every(Number.isFinite) || Math.abs(x) > 1 || Math.abs(y) > 1) return null;
  let nearest: { wallId: string; depth: number } | null = null;
  for (const face of solid.faces) {
    const points = face.vertices.map(project);
    for (const [a, b, c] of faceTriangles(points.length)) {
      const depth = triangleDepth(points[a!]!, points[b!]!, points[c!]!, x, y);
      if (depth !== null && (!nearest || depth < nearest.depth))
        nearest = { wallId: face.wallId, depth };
    }
  }
  return nearest;
}
