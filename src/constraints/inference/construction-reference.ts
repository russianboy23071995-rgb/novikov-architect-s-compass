import type { SnapCandidate, SnapReference } from "../snapping/engine.ts";

export const referenceKey = (r: SnapReference) =>
  JSON.stringify([r.entityId, r.feature, r.point.x, r.point.y]);

/** Construction references remain transient. Flattened original sources permit exact invalidation. */
export function withConstructionReferences(
  base: readonly SnapReference[],
  active: readonly SnapReference[],
): SnapReference[] {
  const originals = new Set(base.filter((r) => !r.dependencies).map(referenceKey));
  const valid = active.filter(
    (r) =>
      r.dependencies?.length &&
      Number.isFinite(r.point.x) &&
      Number.isFinite(r.point.y) &&
      r.dependencies.every((d) => !d.dependencies && originals.has(referenceKey(d))),
  );
  return [...base, ...valid.filter((r) => !base.some((b) => referenceKey(b) === referenceKey(r)))];
}

export function acquisitionReference(
  candidate: SnapCandidate | null,
  sources: readonly SnapReference[],
): SnapReference | null {
  if (!candidate) return null;
  if (
    candidate.kind === "endpoint" ||
    candidate.kind === "midpoint" ||
    candidate.kind === "segment-intersection"
  )
    return (
      sources.find(
        (r) =>
          r.entityId === candidate.sourceEntityId &&
          r.feature === candidate.sourceFeature &&
          r.point.x === candidate.worldPoint.x &&
          r.point.y === candidate.worldPoint.y,
      ) ?? null
    );
  if (candidate.kind !== "intersection" || !candidate.sourceReferences?.length) return null;
  const leaves = candidate.sourceReferences.flatMap((r) => r.dependencies ?? [r]);
  const dependencies = [...new Map(leaves.map((r) => [referenceKey(r), r])).values()].sort(
    (a, b) => (referenceKey(a) < referenceKey(b) ? -1 : referenceKey(a) > referenceKey(b) ? 1 : 0),
  );
  const point = { ...candidate.worldPoint };
  return {
    entityId: "@construction",
    feature: JSON.stringify([point.x, point.y, dependencies.map(referenceKey)]),
    point,
    dependencies,
  };
}
