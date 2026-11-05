import type { SnapSegment } from "./segment-references.ts";
type LocalPrimitives = {
  references: SnapReference[];
  segments: SnapSegment[];
  segmentPairs: number;
  near: (r: SnapReference) => boolean;
};

import type { Point2 } from "../../geometry/primitives/point.ts";
import type { SnapReference } from "./engine.ts";
import { createBoxIndex, type Box2 } from "../../geometry/spatial/box-index.ts";
import { segmentMayMeetBox } from "../../geometry/intersections/segment-box.ts";
import { createIsotropicScreenMetric } from "../../geometry/projections/screen-metric.ts";
import type { ScreenMetric } from "../../geometry/projections/screen-metric.ts";
import { MAX_MODEL_TOLERANCE_METRES } from "../../geometry/tolerances/model.ts";
import { referenceKey } from "../inference/construction-reference.ts";
import { segmentIntersectionReferences } from "./segment-references.ts";

// Objects this module froze deeply before; reused snap parts need no second walk.
const deeplyFrozen = new WeakSet<object>();
function freezeData(value: object): void {
  if (deeplyFrozen.has(value)) return;
  for (const nested of Object.values(value))
    if (nested && typeof nested === "object") freezeData(nested);
  Object.freeze(value);
  deeplyFrozen.add(value);
}

/** Cold build contains primitive sources only, never all model intersections. */
export function createPrimitiveSourceIndex(
  {
    references,
    segments,
  }: {
    references: SnapReference[];
    segments: SnapSegment[];
  },
  measure: <T>(phase: string, run: () => T) => T = (_phase, run) => run(),
) {
  measure("freeze-references", () => freezeData(references));
  measure("freeze-segments", () => freezeData(segments));
  const lookup = measure("lookup", () => new Map(references.map((r) => [referenceKey(r), r])));
  const points = measure("point-index", () =>
    createBoxIndex(
      references.map((r, value) => ({
        value,
        box: { minX: r.point.x, maxX: r.point.x, minY: r.point.y, maxY: r.point.y },
      })),
    ),
  );
  const lines = measure("segment-index", () =>
    createBoxIndex(
      segments.map((s, value) => ({
        value,
        box: {
          minX: Math.min(s.start.x, s.end.x),
          maxX: Math.max(s.start.x, s.end.x),
          minY: Math.min(s.start.y, s.end.y),
          maxY: Math.max(s.start.y, s.end.y),
        },
      })),
    ),
  );
  // Extent of every point and segment, so a combined index can skip this part entirely.
  const bounds = measure("bounds", () => {
    const box = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
    const add = (p: Point2) => {
      box.minX = Math.min(box.minX, p.x);
      box.maxX = Math.max(box.maxX, p.x);
      box.minY = Math.min(box.minY, p.y);
      box.maxY = Math.max(box.maxY, p.y);
    };
    for (const r of references) add(r.point);
    for (const s of segments) {
      add(s.start);
      add(s.end);
    }
    return references.length || segments.length ? Object.freeze(box) : null;
  });
  return Object.freeze({
    bounds: bounds as Readonly<Box2> | null,
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
type SourceIndex = ReturnType<typeof createPrimitiveSourceIndex>;
const overlaps = (a: Readonly<Box2>, b: Readonly<Box2>) =>
  a.minX <= b.maxX && b.minX <= a.maxX && a.minY <= b.maxY && b.minY <= a.maxY;

/** One index over consecutive parts, each indexed on its own (docs/performance/EDIT_CYCLE.md,
 * Teil B). An edit rebuilds only the parts it changed; queries return the same references and
 * segments in the same order as one index over the concatenated input, and a lookup of a key
 * present more than once returns its last occurrence, as one Map would.
 */
export function combineSourceIndexes(parts: readonly SourceIndex[]) {
  const allSegments = Object.freeze(parts.flatMap((p) => p.allSegments));
  // Union of the part extents, so a combined index can itself be combined (trace, S4).
  const boxes = parts.flatMap((p) => (p.bounds ? [p.bounds] : []));
  const bounds: Readonly<Box2> | null = boxes.length
    ? Object.freeze({
        minX: Math.min(...boxes.map((b) => b.minX)),
        maxX: Math.max(...boxes.map((b) => b.maxX)),
        minY: Math.min(...boxes.map((b) => b.minY)),
        maxY: Math.max(...boxes.map((b) => b.maxY)),
      })
    : null;
  return Object.freeze({
    bounds,
    query(
      cursor: Point2,
      scale: number | ScreenMetric,
      radius: number,
      allowed: (source: SnapReference) => boolean = () => true,
    ) {
      return completeLocalQuery(this.queryPrimitives(cursor, scale, radius, allowed));
    },
    allSegments,
    sourceCount: parts.reduce((n, p) => n + p.sourceCount, 0),
    segmentCount: allSegments.length,
    lookup(key: string) {
      for (let i = parts.length - 1; i >= 0; i--) {
        const found = parts[i]!.lookup(key);
        if (found) return found;
      }
      return undefined;
    },
    queryPrimitives(
      cursor: Point2,
      pixelsPerMetre: number | ScreenMetric,
      radiusPx: number,
      allowed: (source: SnapReference) => boolean = () => true,
    ): LocalPrimitives {
      if (![cursor.x, cursor.y, radiusPx].every(Number.isFinite) || radiusPx < 0)
        throw new Error("Invalid local snap query");
      const metric =
        typeof pixelsPerMetre === "number"
          ? createIsotropicScreenMetric(pixelsPerMetre)
          : pixelsPerMetre;
      const box = metric.queryBounds(cursor, radiusPx, MAX_MODEL_TOLERANCE_METRES);
      const references: SnapReference[] = [],
        segments: SnapSegment[] = [];
      for (const part of parts) {
        if (!part.bounds || !overlaps(part.bounds, box)) continue;
        const local = part.queryPrimitives(cursor, metric, radiusPx, allowed);
        references.push(...local.references);
        segments.push(...local.segments);
      }
      return {
        references,
        near: (r: SnapReference) => metric.distance(r.point, cursor) <= radiusPx,
        segments,
        segmentPairs: (segments.length * Math.max(0, segments.length - 1)) / 2,
      };
    },
  });
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
