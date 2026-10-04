import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapSegment } from "../../constraints/snapping/segment-references.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";
/** Hit original segment extents, never SVG DOM order or nearest midpoint alone. */
export function pickReferenceSegments(
  segments: readonly SnapSegment[],
  point: Point2,
  scale: number,
  radius = 10,
) {
  return segments
    .map((s) => {
      const dx = s.end.x - s.start.x,
        dy = s.end.y - s.start.y;
      const length = dx * dx + dy * dy;
      const t = length
        ? Math.max(
            0,
            Math.min(1, ((point.x - s.start.x) * dx + (point.y - s.start.y) * dy) / length),
          )
        : 0;
      return {
        source: s.source,
        distance: Math.hypot(point.x - s.start.x - t * dx, point.y - s.start.y - t * dy) * scale,
      };
    })
    .filter((s) => s.distance <= radius)
    .sort(
      (a, b) =>
        a.distance - b.distance || referenceKey(a.source).localeCompare(referenceKey(b.source)),
    )
    .map((s) => s.source);
}
