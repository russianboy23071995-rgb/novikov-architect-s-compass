import type { SnapCandidate } from "./engine.ts";

export type RankedSnap = {
  candidate: SnapCandidate;
  // Newest first; intersections compare both source activations.
  activations: readonly number[];
  // Ordered source tuples preserve intersection roles without delimiter ambiguity.
  sources: readonly (readonly [string, string])[];
};

const kindOrder: Record<SnapCandidate["kind"], number> = {
  endpoint: 0,
  midpoint: 0.5,
  "segment-intersection": 0.75,
  intersection: 1,
  "axis-intersection": 1.5,
  parallel: 5,
  extension: 2,
  perpendicular: 3,
  horizontal: 4,
  vertical: 5,
  angle: 6,
  grid: 7,
};
const compareText = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Total deterministic rank, independent of locale or model traversal order.
 * Kind order and projected x/y break direction ties within the same source.
 */
export function compareSnapCandidates(a: RankedSnap, b: RankedSnap): number {
  const x = a.candidate,
    y = b.candidate;
  const first = x.priority - y.priority || x.distanceOnScreen - y.distanceOnScreen;
  if (first) return first;
  for (let i = 0; i < Math.max(a.activations.length, b.activations.length); i++) {
    const order = (b.activations[i] ?? -1) - (a.activations[i] ?? -1);
    if (order) return order;
  }
  for (let i = 0; i < Math.max(a.sources.length, b.sources.length); i++) {
    const left = a.sources[i],
      right = b.sources[i];
    if (!left || !right) return left ? 1 : right ? -1 : 0;
    const order = compareText(left[0], right[0]) || compareText(left[1], right[1]);
    if (order) return order;
  }
  return (
    kindOrder[x.kind] - kindOrder[y.kind] ||
    x.worldPoint.x - y.worldPoint.x ||
    x.worldPoint.y - y.worldPoint.y ||
    (x.angleDegrees ?? 0) - (y.angleDegrees ?? 0)
  );
}
