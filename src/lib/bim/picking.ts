import {
  createProjectionFrame,
  projectOrthographic,
} from "../../geometry/projections/orthographic.ts";
import type { Camera, Solid, Vec3 } from "./geometry.ts";
import type { ProjectionFrame } from "../../geometry/projections/orthographic.ts";

/** Match the rendered triangles and depth test; holes contain no pickable faces. */
export function pickWall(
  solid: Solid,
  camera: Camera,
  aspect: number,
  x: number,
  y: number,
): string | null {
  return pickWallInProjection(solid, createProjectionFrame(solid), camera, aspect, x, y);
}

export function pickWallInProjection(
  solid: Solid,
  frame: ProjectionFrame,
  camera: Camera,
  aspect: number,
  x: number,
  y: number,
): string | null {
  if (![aspect, x, y].every(Number.isFinite) || aspect <= 0 || Math.abs(x) > 1 || Math.abs(y) > 1)
    return null;
  let depth = Infinity;
  let selected: string | null = null;
  for (const face of solid.faces) {
    const points = face.vertices.map((point) => projectOrthographic(point, frame, camera, aspect));
    for (const indices of [
      [0, 1, 2],
      [0, 2, 3],
    ]) {
      const [a, b, c] = indices.map((index) => points[index]!) as [Vec3, Vec3, Vec3];
      const denominator = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(denominator) < 1e-12) continue;
      const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / denominator;
      const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / denominator;
      const w = 1 - u - v;
      if (Math.min(u, v, w) < -1e-9) continue;
      const z = u * a[2] + v * b[2] + w * c[2];
      if (z >= -1 && z <= 1 && z < depth) {
        depth = z;
        selected = face.wallId;
      }
    }
  }
  return selected;
}

export function isSelectionClick(startX: number, startY: number, x: number, y: number): boolean {
  return Math.hypot(x - startX, y - startY) <= 4;
}
