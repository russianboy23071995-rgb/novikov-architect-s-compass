import type { Point2 } from "../../geometry/primitives/point.ts";
import { angle45Direction, projectDirection } from "../../geometry/projections/direction.ts";
import type { SnapReference } from "../snapping/engine.ts";
import { sameReference } from "../inference/hover-reference.ts";

/** Interaction margin, never a larger geometric snap radius. */
export const GUIDE_DIRECTION_HYSTERESIS_DEGREES = 5;
type GuideKind = "extension" | "perpendicular" | "horizontal" | "vertical" | "angle";
export type GuideDirection = {
  source: SnapReference;
  degrees: number;
  direction: Point2;
  kind: GuideKind;
};
const difference = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
const order: Record<GuideKind, number> = {
  extension: 0,
  perpendicular: 1,
  horizontal: 2,
  vertical: 3,
  angle: 4,
};

/** One mouse-relevant direction per source, shared by overlay, acquisition and snapping. */
export function cursorGuide(
  cursor: Point2,
  source: SnapReference,
  previous: readonly GuideDirection[] = [],
) {
  const choices: GuideDirection[] = [];
  const offer = (direction: Point2, kind: GuideKind) => {
    const length = Math.hypot(direction.x, direction.y);
    if (!length || !Number.isFinite(length)) return;
    const degrees = ((Math.atan2(direction.y, direction.x) * 180) / Math.PI + 360) % 360;
    choices.push({ source, direction, degrees, kind });
  };
  for (const d of source.directions ?? [])
    for (const sign of [1, -1]) {
      offer({ x: d.x * sign, y: d.y * sign }, "extension");
      offer({ x: -d.y * sign, y: d.x * sign }, "perpendicular");
    }
  for (let i = 0; i < 8; i++) {
    const { direction } = angle45Direction(
      { x: Math.cos((i * Math.PI) / 4), y: Math.sin((i * Math.PI) / 4) },
      { x: 0, y: 0 },
    );
    offer(direction, i % 4 === 0 ? "horizontal" : i % 4 === 2 ? "vertical" : "angle");
  }
  const angle =
    ((Math.atan2(cursor.y - source.point.y, cursor.x - source.point.x) * 180) / Math.PI + 360) %
    360;
  choices.sort(
    (a, b) =>
      difference(angle, a.degrees) - difference(angle, b.degrees) ||
      order[a.kind] - order[b.kind] ||
      a.degrees - b.degrees,
  );
  const best = choices[0]!;
  const remembered = previous.find((g) => sameReference(g.source, source));
  // Only retain a direction still supplied by the current source geometry.
  const old =
    remembered &&
    choices.find((g) => g.degrees === remembered.degrees && g.kind === remembered.kind);
  const retain =
    old &&
    (difference(angle, old.degrees) <=
      difference(angle, best.degrees) +
        Math.min(
          2 * GUIDE_DIRECTION_HYSTERESIS_DEGREES,
          difference(old.degrees, best.degrees) * 0.4,
        ) ||
      (cursor.x === source.point.x && cursor.y === source.point.y));
  const chosen = retain ? old : best;
  const point = projectDirection(cursor, source.point, chosen.direction)!;
  return { ...chosen, origin: source.point, point };
}

export function advanceGuideDirections(
  cursor: Point2,
  sources: readonly SnapReference[],
  previous: readonly GuideDirection[] = [],
): GuideDirection[] {
  return sources.map((source) => {
    const { direction, degrees, kind } = cursorGuide(cursor, source, previous);
    return { source, direction, degrees, kind };
  });
}
