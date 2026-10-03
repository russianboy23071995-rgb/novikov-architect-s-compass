import { querySnap } from "../../constraints/snapping/engine.ts";
import type { SnapContext, SnapReference } from "../../constraints/snapping/engine.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
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
