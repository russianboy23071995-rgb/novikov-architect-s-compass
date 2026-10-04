import type { Solid } from "../../lib/bim/geometry.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import { triangleDepth } from "../../geometry/projections/triangle-depth.ts";

/** Shared nearest wall surface for picking and anchor visibility. Smaller NDC z is nearer. */
export function nearestWallSurface(
  solid: Solid,
  project: (point: Vector3) => Vector3,
  x: number,
  y: number,
): { wallId: string; depth: number } | null {
  if (![x, y].every(Number.isFinite) || Math.abs(x) > 1 || Math.abs(y) > 1) return null;
  let nearest: { wallId: string; depth: number } | null = null;
  for (const face of solid.faces) {
    const points = face.vertices.map(project);
    for (const [a, b, c] of [
      [0, 1, 2],
      [0, 2, 3],
    ]) {
      const depth = triangleDepth(points[a!]!, points[b!]!, points[c!]!, x, y);
      if (depth !== null && (!nearest || depth < nearest.depth))
        nearest = { wallId: face.wallId, depth };
    }
  }
  return nearest;
}
