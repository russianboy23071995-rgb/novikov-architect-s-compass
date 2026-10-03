import type { Point2 } from "../../geometry/primitives/point.ts";
import { intersectSegments } from "../../geometry/intersections/segments.ts";
import { referenceKey } from "../inference/construction-reference.ts";
import type { SnapReference } from "./engine.ts";

export type SnapSegment = { start: Point2; end: Point2; source: SnapReference };

/** Derived once per model snapshot, not per pointer move. Both leaf sources remain traceable. */
export function segmentIntersectionReferences(segments: readonly SnapSegment[]): SnapReference[] {
  const ordered = [...segments].sort((a, b) =>
    referenceKey(a.source) < referenceKey(b.source)
      ? -1
      : referenceKey(a.source) > referenceKey(b.source)
        ? 1
        : 0,
  );
  const result: SnapReference[] = [];
  for (let i = 0; i < ordered.length; i++)
    for (let j = i + 1; j < ordered.length; j++) {
      const a = ordered[i]!,
        b = ordered[j]!;
      const point = intersectSegments(a.start, a.end, b.start, b.end);
      if (!point) continue;
      result.push({
        point,
        kind: "segment-intersection",
        entityId: "@segment-intersection",
        feature: JSON.stringify([referenceKey(a.source), referenceKey(b.source)]),
        dependencies: [a.source, b.source],
        directions: [
          { x: a.end.x - a.start.x, y: a.end.y - a.start.y },
          { x: b.end.x - b.start.x, y: b.end.y - b.start.y },
        ],
      });
    }
  return result;
}
