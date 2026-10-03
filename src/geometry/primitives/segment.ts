import type { Point2 } from "./point.ts";

/** Midpoint of a finite, nonzero segment in model units. No screen-size cutoff. */
export function segmentMidpoint(a: Point2, b: Point2): Point2 | null {
  if (![a.x, a.y, b.x, b.y].every(Number.isFinite) || (a.x === b.x && a.y === b.y)) return null;
  return { x: a.x / 2 + b.x / 2, y: a.y / 2 + b.y / 2 };
}
