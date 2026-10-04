import type { Vector3 } from "./orthographic.ts";

/** Orthographic NDC depth at a triangle hit, including its boundary.
 * Preserves the existing picker tolerances; not a GPU pixel coverage test. */
export function triangleDepth(
  a: Vector3,
  b: Vector3,
  c: Vector3,
  x: number,
  y: number,
): number | null {
  if (![...a, ...b, ...c, x, y].every(Number.isFinite)) return null;
  const denominator = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (!Number.isFinite(denominator) || Math.abs(denominator) < 1e-12) return null;
  const u = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / denominator;
  const v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / denominator;
  const w = 1 - u - v;
  if (Math.min(u, v, w) < -1e-9) return null;
  const depth = u * a[2] + v * b[2] + w * c[2];
  return Number.isFinite(depth) && depth >= -1 && depth <= 1 ? depth : null;
}
