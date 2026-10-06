import type { Point2 } from "../primitives/point.ts";
import { coordinatesCompatible, pointsCompatible } from "../tolerances/model.ts";

/** Minimum signed metre distance to a directed line (left is inside).
 * Vertices suffice for a convex footprint against this half-plane. The caller
 * owns polygon topology; this neither clips nor applies a user clearance margin.
 */
export function measureHalfPlane(points: readonly Point2[], start: Point2, end: Point2) {
  if (
    !points.length ||
    ![start, end, ...points].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) ||
    pointsCompatible(start, end)
  )
    throw new Error("Ungültige Halbraum-Geometrie.");
  const dx = end.x - start.x,
    dy = end.y - start.y,
    length = Math.hypot(dx, dy);
  if (!Number.isFinite(length)) throw new Error("Halbraum-Richtung nicht darstellbar.");
  const distances = points.map(
    (p) => (dx / length) * (p.y - start.y) - (dy / length) * (p.x - start.x),
  );
  if (!distances.every(Number.isFinite)) throw new Error("Halbraum-Abstand nicht darstellbar.");
  const clearance = Math.min(...distances);
  const relation: "inside" | "touching" | "outside" = coordinatesCompatible(clearance, 0)
    ? "touching"
    : clearance < 0
      ? "outside"
      : "inside";
  return { relation, clearance };
}
