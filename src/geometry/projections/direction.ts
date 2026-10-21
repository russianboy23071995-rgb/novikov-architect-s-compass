import type { Point2 } from "../primitives/point.ts";

/** Signed translation on an infinite axis. Keep the full edit operation order;
 * reconstructing an absolute point and subtracting its origin loses exact bits. */
export function directionOffset(cursor: Point2, origin: Point2, direction: Point2): Point2 | null {
  const length = Math.hypot(direction.x, direction.y);
  const dx = cursor.x - origin.x,
    dy = cursor.y - origin.y;
  if (!Number.isFinite(length) || length === 0 || !Number.isFinite(dx) || !Number.isFinite(dy))
    return null;
  const distance = (dx * direction.x + dy * direction.y) / length;
  const offset = { x: (direction.x / length) * distance, y: (direction.y / length) * distance };
  return Number.isFinite(offset.x) && Number.isFinite(offset.y) ? offset : null;
}

/** Orthogonal projection onto an infinite direction line, in metres. */
export function projectDirection(cursor: Point2, origin: Point2, direction: Point2): Point2 | null {
  const length = Math.hypot(direction.x, direction.y);
  if (!Number.isFinite(length) || length === 0) return null;
  const x = direction.x / length;
  const y = direction.y / length;
  const distance = (cursor.x - origin.x) * x + (cursor.y - origin.y) * y;
  return { x: origin.x + distance * x, y: origin.y + distance * y };
}

export function angle45Direction(
  cursor: Point2,
  origin: Point2,
): { direction: Point2; degrees: number } {
  const step = Math.round(Math.atan2(cursor.y - origin.y, cursor.x - origin.x) / (Math.PI / 4));
  const directions = [
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: -1, y: 1 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: -1 },
    { x: 1, y: -1 },
  ];
  const index = (step + 8) % 8;
  return { direction: directions[index]!, degrees: index * 45 };
}
