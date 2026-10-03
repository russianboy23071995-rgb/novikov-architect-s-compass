import type { Point2 } from "../../geometry/primitives/point.ts";
import { angle45Direction, projectDirection } from "../../geometry/projections/direction.ts";
import type { SnapReference } from "../snapping/engine.ts";

/** Exactly one nearest 45-degree line per reference, shared by intersection and overlay. */
export function cursorGuide(cursor: Point2, source: SnapReference) {
  const { direction, degrees } = angle45Direction(cursor, source.point);
  const point = projectDirection(cursor, source.point, direction)!;
  return { source, origin: source.point, direction, degrees, point };
}
