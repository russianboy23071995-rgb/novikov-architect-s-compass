import type { Point2 } from "../primitives/point.ts";
import { coordinatesCompatible, pointsCompatible } from "../tolerances/model.ts";
import { projectDirection } from "../projections/direction.ts";
import { intersectLines } from "./lines.ts";

const within = (n: number, a: number, b: number) =>
  (n >= Math.min(a, b) || coordinatesCompatible(n, Math.min(a, b))) &&
  (n <= Math.max(a, b) || coordinatesCompatible(n, Math.max(a, b)));

/** Unique finite segment intersection. Overlap and degenerate segments have no single target. */
export function intersectSegments(a: Point2, b: Point2, c: Point2, d: Point2): Point2 | null {
  if (![a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y].every(Number.isFinite)) return null;
  const u = { x: b.x - a.x, y: b.y - a.y },
    v = { x: d.x - c.x, y: d.y - c.y };
  if (!Math.hypot(u.x, u.y) || !Math.hypot(v.x, v.y)) return null;
  const point = intersectLines(a, u, c, v);
  if (point)
    return within(point.x, a.x, b.x) &&
      within(point.y, a.y, b.y) &&
      within(point.x, c.x, d.x) &&
      within(point.y, c.y, d.y)
      ? point
      : null;
  // Parallel/collinear contact is accepted only when the intervals meet at exactly one endpoint.
  const projection = projectDirection(c, a, u),
    endProjection = projectDirection(d, a, u);
  if (
    !projection ||
    !endProjection ||
    !pointsCompatible(c, projection) ||
    !pointsCompatible(d, endProjection)
  )
    return null;
  const axis = Math.abs(u.x) >= Math.abs(u.y) ? "x" : "y";
  const low = Math.max(Math.min(a[axis], b[axis]), Math.min(c[axis], d[axis]));
  const high = Math.min(Math.max(a[axis], b[axis]), Math.max(c[axis], d[axis]));
  return low === high ? { ...[a, b, c, d].find((p) => p[axis] === low)! } : null;
}
