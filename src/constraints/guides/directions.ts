import type { Point2 } from "../../geometry/primitives/point.ts";
import { angle45Direction, projectDirection } from "../../geometry/projections/direction.ts";
import type { SnapReference } from "../snapping/engine.ts";
import { sameReference } from "../inference/hover-reference.ts";

/** Interaction margin, not a geometry tolerance or an enlarged snap radius. */
export const GUIDE_DIRECTION_HYSTERESIS_DEGREES = 5;
export type GuideDirection = { source: SnapReference; degrees: number; direction: Point2 };

/** Pure transition: source identity includes its position; no global or per-tool cache. */
export function cursorGuide(
  cursor: Point2,
  source: SnapReference,
  previous: readonly GuideDirection[] = [],
) {
  const old = previous.find((g) => sameReference(g.source, source));
  const angle = (Math.atan2(cursor.y - source.point.y, cursor.x - source.point.x) * 180) / Math.PI;
  const delta = old ? Math.abs(((angle - old.degrees + 540) % 360) - 180) : Infinity;
  const retain =
    old &&
    (delta <= 22.5 + GUIDE_DIRECTION_HYSTERESIS_DEGREES ||
      (cursor.x === source.point.x && cursor.y === source.point.y));
  const { direction, degrees } = retain ? old : angle45Direction(cursor, source.point);
  const point = projectDirection(cursor, source.point, direction)!;
  return { source, origin: source.point, direction, degrees, point };
}

/** Only active sources survive; empty input resets direction memory. */
export function advanceGuideDirections(
  cursor: Point2,
  sources: readonly SnapReference[],
  previous: readonly GuideDirection[] = [],
): GuideDirection[] {
  return sources.map((source) => {
    const { direction, degrees } = cursorGuide(cursor, source, previous);
    return { source, direction, degrees };
  });
}
