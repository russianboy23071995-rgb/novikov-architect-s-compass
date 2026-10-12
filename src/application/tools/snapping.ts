import { segmentKey } from "../snapping/reference-selection.ts";
import { completeLocalQuery } from "../snapping/local-sources.ts";
import { DENSE_SEGMENT_LIMIT } from "../snapping/density.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import type { SnapContext, SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { LocalSnapSources } from "../snapping/local-sources.ts";
import type { SnapSourceQuery } from "../../constraints/snapping/engine.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";
import type { ScreenMetric } from "../../geometry/projections/screen-metric.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { LayerVisibilityContext, createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { getLocalSnapSources } from "../snapping/local-sources.ts";

type SourceEligibility = {
  isCurrent: () => boolean;
  allowsEntity: (id: string) => boolean;
};

/** Bind one immutable model/filter pair; rebuild when either changes, not on zoom.
 * Reuses the model-only spatial index for independent BIM and drawing contexts.
 */
export function createVisibleToolSourceQuery(
  project: Project,
  visibility: ReturnType<typeof createLayerVisibilityPolicy>,
  context: LayerVisibilityContext,
  policy: ToolSnapPolicy | null,
  intersectionLimit = DENSE_SEGMENT_LIMIT,
) {
  return createToolSourceQuery(getLocalSnapSources(project), policy, intersectionLimit, {
    isCurrent: () => visibility.isCurrent(project, context),
    allowsEntity: (id) => visibility.evaluate(project, context, id).eligible,
  });
}

/** Bound to model and policy, never to camera or the changing local result array. */
export function createToolSourceQuery(
  model: LocalSnapSources,
  policy: ToolSnapPolicy | null,
  intersectionLimit = DENSE_SEGMENT_LIMIT,
  eligibility?: SourceEligibility,
) {
  const current = () => !eligibility || eligibility.isCurrent();
  const pinned = new Map(toolPinnedReferences(policy).map((r) => [referenceKey(r), r]));
  const isPinned = (r: SnapReference) => pinned.has(referenceKey(r));
  const visible = (r: SnapReference): boolean =>
    !eligibility || isPinned(r) || eligibility.allowsEntity(r.entityId);
  const allowed = (r: SnapReference) =>
    current() &&
    (!policy || policy.sources([r]).length > 0) &&
    (r.dependencies?.length
      ? r.dependencies.every((d) => !d.dependencies && visible(d))
      : visible(r));
  const leaf = (r: SnapReference) => {
    const draft = pinned.get(referenceKey(r));
    if (draft) return draft;
    const source = model.lookup(referenceKey(r));
    return source && allowed(source) ? source : undefined;
  };
  const inspect = (
    cursor: Point2,
    scale: number | ScreenMetric,
    radius: number,
    selected?: ReadonlySet<string> | null,
  ) => {
    const local = model.queryPrimitives(cursor, scale, radius, allowed);
    const segments = selected
      ? local.segments.filter((s) => selected.has(segmentKey(s.source)))
      : local.segments;
    return {
      ...local,
      segments,
      segmentPairs: (segments.length * Math.max(0, segments.length - 1)) / 2,
    };
  };
  const query: SnapSourceQuery = (
    cursor,
    scale,
    radius,
    active,
    paused = false,
    selected = null,
    metric,
  ) => {
    if (!current()) return [];
    const primitives = inspect(cursor, metric ?? scale, radius, selected);
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
    for (const r of pinned.values()) refs.set(referenceKey(r), r);
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
  return Object.assign(query, {
    inspect,
    accepts: (r: SnapReference) =>
      allowed(r) && (r.dependencies?.length ? r.dependencies : [r]).every((d) => !!leaf(d)),
  });
}
export type ToolSnapPolicy = {
  origin: SnapReference | null;
  /** Fixed transient references supplied by the current interaction, never model entities. */
  pinnedReferences?: readonly SnapReference[];
  sources: (references: readonly SnapReference[]) => SnapReference[];
  resolve: typeof querySnap;
};
export function toolPinnedReferences(policy: ToolSnapPolicy | null): readonly SnapReference[] {
  return policy ? (policy.pinnedReferences ?? (policy.origin ? [policy.origin] : [])) : [];
}
/** Stable policy identity keeps model-space references alive during view navigation. */
export function prepareToolReferences(
  policy: ToolSnapPolicy | null,
  sources: readonly SnapReference[],
) {
  return policy ? [...policy.sources(sources), ...toolPinnedReferences(policy)] : [...sources];
}
export function resolveToolSnap(
  policy: ToolSnapPolicy | null,
  cursor: Point2,
  context: Omit<SnapContext, "orthoOrigin" | "angleOrigin">,
  options: { ortho: boolean; shift: boolean; featureSnap: boolean },
) {
  const active = context.activeReferences?.at(-1) ?? context.activeReference;
  const origin = policy?.origin?.point ?? null;
  const request: SnapContext = {
    ...context,
    sourceQuery: options.featureSnap ? context.sourceQuery : undefined,
    references: options.featureSnap ? context.references : [],
    activeReferences: options.featureSnap ? (context.activeReferences ?? []) : [],
    activeReference: options.featureSnap ? (active ?? null) : null,
    orthoOrigin: options.ortho ? origin : null,
    angleOrigin:
      options.shift && options.featureSnap
        ? (context.angleLockOrigin ?? origin ?? active?.point ?? null)
        : null,
  };
  return (policy?.resolve ?? querySnap)(cursor, request);
}
export type AnchoredSnapPolicy = ToolSnapPolicy & { origin: SnapReference };
export function drawingSnapPolicy(origin: Point2, path?: readonly Point2[]): AnchoredSnapPolicy {
  const key = path ?? origin;
  let policy = drawingPolicies.get(key);
  if (!policy) {
    policy = {
      origin: { entityId: "@drawing-origin", feature: "start", point: origin },
      sources: (refs) => [...refs],
      resolve: querySnap,
    };
    if (path && path.length >= 2) {
      const first = path[0]!,
        second = path[1]!,
        previous = path.at(-2)!;
      const incoming = { x: origin.x - previous.x, y: origin.y - previous.y };
      const outgoing = { x: second.x - first.x, y: second.y - first.y };
      policy.origin = {
        ...policy.origin!,
        directions: [incoming],
        feature: JSON.stringify(["current", incoming.x, incoming.y]),
      };
      policy.pinnedReferences = [
        {
          entityId: "@drawing-start",
          feature: JSON.stringify(["first", outgoing.x, outgoing.y]),
          point: { ...first },
          directions: [outgoing],
        },
        policy.origin!,
      ];
    }
    drawingPolicies.set(key, policy);
  }
  return policy;
}
// Draft points are immutable interaction identities, just like pinned edit sessions.
const drawingPolicies = new WeakMap<object, AnchoredSnapPolicy>();
