import type { SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapSegment } from "../../constraints/snapping/segment-references.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";
import { createIsotropicScreenMetric } from "../../geometry/projections/screen-metric.ts";
import type { ScreenMetric } from "../../geometry/projections/screen-metric.ts";

/** Pick a closed contour boundary with a zoom-independent CSS-pixel tolerance. */
export function pickContourEdge(
  ring: readonly Point2[],
  point: Point2,
  pixelsPerMetre: number,
  radius = 6,
) {
  const metric = createIsotropicScreenMetric(pixelsPerMetre);
  return (
    ring
      .map((start, index) => {
        const hit = metric.projectSegment(point, start, ring[(index + 1) % ring.length]!);
        return hit ? { ...hit, index } : null;
      })
      .filter(
        (hit): hit is NonNullable<typeof hit> =>
          hit !== null && Number.isFinite(hit.distance) && hit.distance <= radius,
      )
      .sort((a, b) => a.distance - b.distance || a.index - b.index)[0] ?? null
  );
}
/** Hit original segment extents, never SVG DOM order or nearest midpoint alone. */
export function pickReferenceSegments(
  segments: readonly SnapSegment[],
  point: Point2,
  scale: number | ScreenMetric,
  radius = 10,
) {
  const metric = typeof scale === "number" ? createIsotropicScreenMetric(scale) : scale;
  return segments
    .map((s) => {
      const hit = metric.projectSegment(point, s.start, s.end);
      const degenerate = s.start.x === s.end.x && s.start.y === s.end.y;
      return {
        source: s.source,
        distance: hit?.distance ?? (degenerate ? metric.distance(point, s.start) : Infinity),
      };
    })
    .filter((s) => Number.isFinite(s.distance) && s.distance >= 0 && s.distance <= radius)
    .sort(
      (a, b) =>
        a.distance - b.distance || referenceKey(a.source).localeCompare(referenceKey(b.source)),
    )
    .map((s) => s.source);
}

/** Point picking stays local and does not calculate segment intersections. */
export function pickReferencePoints(
  references: readonly SnapReference[],
  point: Point2,
  scale: number | ScreenMetric,
  radius = 10,
) {
  const metric = typeof scale === "number" ? createIsotropicScreenMetric(scale) : scale;
  return references
    .filter((r) => r.kind !== "segment-intersection")
    .map((source) => ({
      source,
      distance: metric.distance(source.point, point),
    }))
    .filter((hit) => Number.isFinite(hit.distance) && hit.distance >= 0 && hit.distance <= radius)
    .sort(
      (a, b) =>
        a.distance - b.distance || referenceKey(a.source).localeCompare(referenceKey(b.source)),
    )
    .map((hit) => hit.source);
}
