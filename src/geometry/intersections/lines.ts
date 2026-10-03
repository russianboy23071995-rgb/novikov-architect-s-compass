import type { Point2 } from "../primitives/point.ts";
import { PARALLEL_DIRECTION_TOLERANCE } from "../tolerances/direction.ts";
/** Unique intersection of infinite lines. Parallel/coincident/degenerate lines have no unique point. */
export function intersectLines(a: Point2, da: Point2, b: Point2, db: Point2): Point2 | null {
  if (![a.x, a.y, b.x, b.y, da.x, da.y, db.x, db.y].every(Number.isFinite)) return null;
  const la = Math.hypot(da.x, da.y),
    lb = Math.hypot(db.x, db.y);
  if (!la || !lb || !Number.isFinite(la) || !Number.isFinite(lb)) return null;
  const u = { x: da.x / la, y: da.y / la },
    v = { x: db.x / lb, y: db.y / lb };
  const cross = u.x * v.y - u.y * v.x;
  if (Math.abs(cross) <= PARALLEL_DIRECTION_TOLERANCE) return null;
  const t = ((b.x - a.x) * v.y - (b.y - a.y) * v.x) / cross;
  const point = { x: a.x + t * u.x, y: a.y + t * u.y };
  return Number.isFinite(point.x) && Number.isFinite(point.y) ? point : null;
}
