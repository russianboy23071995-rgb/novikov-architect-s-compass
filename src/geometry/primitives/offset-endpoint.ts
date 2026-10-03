import type { Point2 } from "./point.ts";

/** Recover a positive-length segment endpoint from its signed left-offset target.
 * target - fixed = length * unit + offset * leftNormal(unit).
 * The positive root retains the selected side without introducing a second solution.
 */
export function endpointAtOffsetTarget(fixed: Point2, target: Point2, offset: number): Point2 {
  const x = target.x - fixed.x;
  const y = target.y - fixed.y;
  const radius = Math.hypot(x, y);
  if (!Number.isFinite(radius) || !Number.isFinite(offset) || radius <= Math.abs(offset))
    throw new Error("Ziel liegt zu nahe am festen Endpunkt für den seitlichen Abstand.");
  const ratio = offset / radius;
  const cosine = Math.sqrt((1 - Math.abs(ratio)) * (1 + Math.abs(ratio)));
  const length = radius * cosine;
  return {
    x: fixed.x + length * (cosine * (x / radius) + ratio * (y / radius)),
    y: fixed.y + length * (cosine * (y / radius) - ratio * (x / radius)),
  };
}
