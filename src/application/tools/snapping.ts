import { segmentKey } from "../snapping/reference-selection.ts";
import { completeLocalQuery } from "../snapping/local-sources.ts";
import { DENSE_SEGMENT_LIMIT } from "../snapping/density.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import type { SnapContext, SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { LocalSnapSources } from "../snapping/local-sources.ts";
import type { SnapSourceQuery } from "../../constraints/snapping/engine.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";

/** Bound to model and policy, never to camera or the changing local result array. */
export function createToolSourceQuery(
  model: LocalSnapSources,
  policy: ToolSnapPolicy | null,
  intersectionLimit = DENSE_SEGMENT_LIMIT,
) {
  const allowed = (r: SnapReference) => !policy || policy.sources([r]).length > 0;
  const leaf = (r: SnapReference) => {
    if (policy && referenceKey(r) === referenceKey(policy.origin)) return policy.origin;
    const source = model.lookup(referenceKey(r));
    return source && allowed(source) ? source : undefined;
  };
  const inspect = (
    cursor: Point2,
    scale: number,
    radius: number,
    selected?: ReadonlySet<string> | null,
  ) => {
    const local = model.queryPrimitives(cursor, scale, radius, allowed);
    const segments = selected
      ? local.segments.filter((s) => selected.has(segmentKey(s.source)))
      : local.segments;
    return { ...local, segments, segmentPairs: (segments.length * Math.max(0, segments.length - 1)) / 2 };
  };
  const query: SnapSourceQuery = (
    cursor,
    scale,
    radius,
    active,
    paused = false,
    selected = null,
  ) => {
    const primitives = inspect(cursor, scale, radius, selected);
    const local = completeLocalQuery(
      primitives,
      paused || primitives.segments.length > intersectionLimit,
    );
    const refs = new Map(
      [...local.references, ...local.segments.map((s) => s.source)].map((r) => [
        referenceKey(r),
        r,
      ]),
    );
    if (policy) refs.set(referenceKey(policy.origin), policy.origin);
    for (const r of active) {
      if (!allowed(r)) continue;
      const leaves = r.dependencies?.length ? r.dependencies : [r];
      const resolved = leaves.map(leaf);
      if (resolved.some((s) => !s)) continue;
      for (const source of resolved) refs.set(referenceKey(source!), source!);
      const source = r.dependencies?.length ? r : resolved[0]!;
      refs.set(
        referenceKey(r),
        r.parallelDirections ? { ...source, parallelDirections: r.parallelDirections } : source,
      );
    }
    return [...refs.values()];
  };
  return Object.assign(query, { inspect });
}
export type ToolSnapPolicy = {
  origin: SnapReference;
  sources: (references: readonly SnapReference[]) => SnapReference[];
  resolve: typeof querySnap;
};
/** Stable policy identity keeps model-space references alive during view navigation. */
export function prepareToolReferences(
  policy: ToolSnapPolicy | null,
  sources: readonly SnapReference[],
) {
  return policy ? [...policy.sources(sources), policy.origin] : [...sources];
}
export function resolveToolSnap(
  policy: ToolSnapPolicy | null,
  cursor: Point2,
  context: Omit<SnapContext, "orthoOrigin" | "angleOrigin">,
  options: { ortho: boolean; shift: boolean; featureSnap: boolean },
) {
  const active = context.activeReferences?.at(-1) ?? context.activeReference;
  const origin = policy?.origin.point ?? null;
  const request: SnapContext = {
    ...context,
    sourceQuery: options.featureSnap ? context.sourceQuery : undefined,
    references: options.featureSnap ? context.references : [],
    activeReferences: options.featureSnap ? (context.activeReferences ?? []) : [],
    activeReference: options.featureSnap ? (active ?? null) : null,
    orthoOrigin: options.ortho ? origin : null,
    angleOrigin: options.shift && options.featureSnap ? (origin ?? active?.point ?? null) : null,
  };
  return (policy?.resolve ?? querySnap)(cursor, request);
}
export function drawingSnapPolicy(origin: Point2): ToolSnapPolicy {
  let policy = drawingPolicies.get(origin);
  if (!policy) {
    policy = {
      origin: { entityId: "@drawing-origin", feature: "start", point: origin },
      sources: (refs) => [...refs],
      resolve: querySnap,
    };
    drawingPolicies.set(origin, policy);
  }
  return policy;
}
// Draft points are immutable interaction identities, just like pinned edit sessions.
const drawingPolicies = new WeakMap<Point2, ToolSnapPolicy>();
