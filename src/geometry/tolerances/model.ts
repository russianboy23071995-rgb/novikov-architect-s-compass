import type { Point2 } from "../primitives/point.ts";

/** Numerical compatibility only, in metres; never a screen snap radius or identity test.
 * Floor: 1 nm. Eight floating-point roundoff units accommodate large coordinate offsets.
 * Cap: 1 micrometre, so enormous offsets cannot silently erase meaningful geometry.
 * Beyond that cap, use local coordinates instead of widening the tolerance.
 */
export const MODEL_TOLERANCE_METRES = 1e-9;
export const MAX_MODEL_TOLERANCE_METRES = 1e-6;

export function coordinatesCompatible(a: number, b: number): boolean {
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  const tolerance = Math.min(
    MAX_MODEL_TOLERANCE_METRES,
    Math.max(MODEL_TOLERANCE_METRES, 8 * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))),
  );
  return Math.abs(a - b) <= tolerance;
}

/** Coordinate-wise compatibility, not equality of model entities or cached references. */
export function pointsCompatible(a: Point2, b: Point2): boolean {
  return coordinatesCompatible(a.x, b.x) && coordinatesCompatible(a.y, b.y);
}
