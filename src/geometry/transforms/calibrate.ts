import type { Point2 } from "../primitives/point.ts";
export function calibrationTransform(
  origin: Point2,
  first: Point2,
  second: Point2,
  metres: number,
) {
  if (
    ![origin.x, origin.y, first.x, first.y, second.x, second.y, metres].every(Number.isFinite) ||
    metres <= 0
  )
    throw new Error("Ungültige Kalibriermaße.");
  const distance = Math.hypot(second.x - first.x, second.y - first.y);
  if (!Number.isFinite(distance) || distance <= 1e-9)
    throw new Error("Zwei verschiedene Messpunkte wählen.");
  const factor = metres / distance;
  const next = {
    x: first.x + factor * (origin.x - first.x),
    y: first.y + factor * (origin.y - first.y),
  };
  if (
    !Number.isFinite(factor) ||
    factor <= 0 ||
    !Number.isFinite(next.x) ||
    !Number.isFinite(next.y)
  )
    throw new Error("Kalibriermaß nicht darstellbar.");
  return { factor, origin: next };
}
