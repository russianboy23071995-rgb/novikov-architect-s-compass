import type { SnapSegment } from "../../constraints/snapping/segment-references.ts";
type LocalPrimitives = {
  references: SnapReference[];
  segments: SnapSegment[];
  segmentPairs: number;
  near: (r: SnapReference) => boolean;
};
import type { Project } from "../../lib/bim/model.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapReference } from "../../constraints/snapping/engine.ts";
import { createBoxIndex } from "../../geometry/spatial/box-index.ts";
import { segmentMayMeetBox } from "../../geometry/intersections/segment-box.ts";
import { createIsotropicScreenMetric } from "../../geometry/projections/screen-metric.ts";
import type { ScreenMetric } from "../../geometry/projections/screen-metric.ts";
import { MAX_MODEL_TOLERANCE_METRES } from "../../geometry/tolerances/model.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";
import { segmentIntersectionReferences } from "../../constraints/snapping/segment-references.ts";
import { projectSnapPrimitives } from "./project-references.ts";

function freezeData(value: object): void {
  for (const nested of Object.values(value))
    if (nested && typeof nested === "object") freezeData(nested);
  Object.freeze(value);
}

/** Cold build contains primitive sources only, never all model intersections. */
export function createLocalSnapSources(project: Project) {
  const { references, segments } = projectSnapPrimitives(project);
  freezeData(references);
  freezeData(segments);
  const lookup = new Map(references.map((r) => [referenceKey(r), r]));
  const points = createBoxIndex(
    references.map((r, value) => ({
      value,
      box: { minX: r.point.x, maxX: r.point.x, minY: r.point.y, maxY: r.point.y },
    })),
  );
  const lines = createBoxIndex(
    segments.map((s, value) => ({
      value,
      box: {
        minX: Math.min(s.start.x, s.end.x),
        maxX: Math.max(s.start.x, s.end.x),
        minY: Math.min(s.start.y, s.end.y),
        maxY: Math.max(s.start.y, s.end.y),
      },
    })),
  );
  return Object.freeze({
    query(
      cursor: Point2,
      scale: number | ScreenMetric,
      radius: number,
      allowed: (source: SnapReference) => boolean = () => true,
    ) {
      return completeLocalQuery(this.queryPrimitives(cursor, scale, radius, allowed));
    },
    allSegments: segments as readonly SnapSegment[],
    sourceCount: references.length,
    segmentCount: segments.length,
    lookup: (key: string) => lookup.get(key),
    queryPrimitives(
      cursor: Point2,
      pixelsPerMetre: number | ScreenMetric,
      radiusPx: number,
      allowed: (source: SnapReference) => boolean = () => true,
    ) {
      if (![cursor.x, cursor.y, radiusPx].every(Number.isFinite) || radiusPx < 0)
        throw new Error("Invalid local snap query");
      const metric =
        typeof pixelsPerMetre === "number"
          ? createIsotropicScreenMetric(pixelsPerMetre)
          : pixelsPerMetre;
      // Conservative padding covers every tolerance accepted by intersectSegments.
      const box = metric.queryBounds(cursor, radiusPx, MAX_MODEL_TOLERANCE_METRES);
      const near = (r: SnapReference) => metric.distance(r.point, cursor) <= radiusPx;
      const localPoints = points
        .query(box)
        .sort((a, b) => a - b)
        .map((i) => references[i]!)
        .filter((r) => allowed(r) && near(r));
      // Refine overlapping bounds against the actual segment before pairing.
      // CSS refinement includes model-tolerance and roundoff padding.
      // Keep full extents for exact intersection and hover/source identities.
      const localSegments = lines
        .query(box)
        .sort((a, b) => a - b)
        .map((i) => segments[i]!)
        .filter(
          (s) =>
            allowed(s.source) &&
            segmentMayMeetBox(s.start, s.end, box) &&
            metric.segmentNear(cursor, s.start, s.end, radiusPx, MAX_MODEL_TOLERANCE_METRES),
        );

      return {
        references: localPoints,
        near,
        segments: localSegments,
        segmentPairs: (localSegments.length * Math.max(0, localSegments.length - 1)) / 2,
      };
    },
  });
}
export type LocalSnapSources = ReturnType<typeof createLocalSnapSources>;
const cache = new WeakMap<Project, LocalSnapSources>();
export function getLocalSnapSources(project: Project): LocalSnapSources {
  let sources = cache.get(project);
  if (!sources) {
    sources = createLocalSnapSources(project);
    cache.set(project, sources);
  }
  return sources;
}

export function completeLocalQuery(local: LocalPrimitives, paused = false) {
  return {
    references: [
      ...local.references,
      ...(paused ? [] : segmentIntersectionReferences(local.segments).filter(local.near)),
    ],
    segments: local.segments,
    segmentPairs: paused ? 0 : local.segmentPairs,
    intersectionsPaused: paused,
  };
}
