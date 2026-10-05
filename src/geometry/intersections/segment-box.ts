import type { Point2 } from "../primitives/point.ts";
import type { Box2 } from "../spatial/box-index.ts";

/** Conservative separating-axis test. Original segment extents are never clipped.
 * Uncertain arithmetic retains the candidate; this filter never creates snap targets.
 */
export function segmentMayMeetBox(start: Point2, end: Point2, box: Box2): boolean {
  if (
    Math.max(start.x, end.x) < box.minX ||
    Math.min(start.x, end.x) > box.maxX ||
    Math.max(start.y, end.y) < box.minY ||
    Math.min(start.y, end.y) > box.maxY
  )
    return false;
  const dx = end.x - start.x,
    dy = end.y - start.y,
    length = Math.hypot(dx, dy);
  if (!length || !Number.isFinite(length)) return true;
  const ux = dx / length,
    uy = dy / length;
  const cx = box.minX / 2 + box.maxX / 2,
    cy = box.minY / 2 + box.maxY / 2,
    hx = box.maxX / 2 - box.minX / 2,
    hy = box.maxY / 2 - box.minY / 2;
  const distance = Math.abs(ux * (cy - start.y) - uy * (cx - start.x));
  const extent = Math.abs(ux) * hy + Math.abs(uy) * hx;
  // Roundoff protection is separate from the caller's model-tolerance padding.
  // Scale by coordinates too: subtracting large world offsets loses precision.
  const roundoff =
    64 *
    Number.EPSILON *
    Math.max(
      1,
      Math.abs(start.x),
      Math.abs(start.y),
      Math.abs(end.x),
      Math.abs(end.y),
      Math.abs(box.minX),
      Math.abs(box.minY),
      Math.abs(box.maxX),
      Math.abs(box.maxY),
    );
  return !Number.isFinite(distance + extent) || distance <= extent + roundoff;
}
