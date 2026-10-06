import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapReference } from "../snapping/engine.ts";
import { createIsotropicScreenMetric } from "../../geometry/projections/screen-metric.ts";
import type { ScreenMetric } from "../../geometry/projections/screen-metric.ts";

/** Stable segment identity across small pointer motion; distance is in screen pixels. */
export function hoveredSegment(
  cursor: Point2,
  sources: readonly SnapReference[],
  pixelsPerMetre: number | ScreenMetric,
  radiusPx = 10,
): SnapReference | null {
  const metric =
    typeof pixelsPerMetre === "number"
      ? createIsotropicScreenMetric(pixelsPerMetre)
      : pixelsPerMetre;
  let best: SnapReference | null = null,
    distance = radiusPx;
  for (const ref of sources) {
    if (!ref.segment) continue;
    const { start, end } = ref.segment;
    const projected = metric.projectSegment(cursor, start, end);
    if (!projected || projected.t < 0 || projected.t > 1) continue;
    const d = projected.distance;
    if (Number.isFinite(d) && d >= 0 && d <= distance) {
      best = ref;
      distance = d;
    }
  }
  return best;
}
/** Tracked segment directions are available through every active construction origin. */
export function withParallelDirections(references: readonly SnapReference[]): SnapReference[] {
  const directions = references.filter((r) => r.segment).flatMap((r) => r.directions ?? []);
  return references.map((r) => ({ ...r, parallelDirections: directions }));
}
