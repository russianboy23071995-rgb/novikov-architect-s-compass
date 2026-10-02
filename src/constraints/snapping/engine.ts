import type { Point2 } from "../../geometry/primitives/point.ts";

export type SnapReference = { point: Point2; entityId: string; feature: string };
export type SnapCandidate = {
  kind: "endpoint" | "grid";
  worldPoint: Point2;
  distanceOnScreen: number;
  sourceEntityId: string | null;
  sourceFeature: string;
  priority: number;
};
export type SnapContext = {
  references: readonly SnapReference[];
  pixelsPerMetre: number;
  enabled: boolean;
  endpointRadiusPx: number;
  gridSpacing: number | null;
  orthoOrigin: Point2 | null;
};

/** Plan coordinates in metres, screen distances in CSS pixels. No model mutations. */
export function querySnap(
  cursor: Point2,
  context: SnapContext,
): {
  point: Point2;
  candidate: SnapCandidate | null;
} {
  if (
    ![cursor.x, cursor.y, context.pixelsPerMetre, context.endpointRadiusPx].every(
      Number.isFinite,
    ) ||
    context.pixelsPerMetre <= 0 ||
    context.endpointRadiusPx < 0 ||
    (context.orthoOrigin !== null &&
      ![context.orthoOrigin.x, context.orthoOrigin.y].every(Number.isFinite)) ||
    (context.gridSpacing !== null &&
      (!Number.isFinite(context.gridSpacing) || context.gridSpacing <= 0))
  )
    throw new Error("Invalid snap context");
  const origin = context.orthoOrigin;
  const horizontal = origin
    ? Math.abs(cursor.x - origin.x) >= Math.abs(cursor.y - origin.y)
    : false;
  const constrain = (p: Point2): Point2 =>
    origin ? (horizontal ? { x: p.x, y: origin.y } : { x: origin.x, y: p.y }) : { ...p };
  if (!context.enabled) return { point: constrain(cursor), candidate: null };
  const candidates: SnapCandidate[] = [];
  for (const reference of context.references) {
    const p = reference.point;
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) continue;
    // An endpoint must satisfy Ortho exactly; never label a projected point as an endpoint.
    if (origin && (horizontal ? p.y !== origin.y : p.x !== origin.x)) continue;
    const distance = Math.hypot(p.x - cursor.x, p.y - cursor.y) * context.pixelsPerMetre;
    if (distance <= context.endpointRadiusPx)
      candidates.push({
        kind: "endpoint",
        worldPoint: { ...p },
        distanceOnScreen: distance,
        sourceEntityId: reference.entityId,
        sourceFeature: reference.feature,
        priority: 0,
      });
  }
  candidates.sort(
    (a, b) =>
      a.priority - b.priority ||
      a.distanceOnScreen - b.distanceOnScreen ||
      (a.sourceEntityId! < b.sourceEntityId!
        ? -1
        : a.sourceEntityId! > b.sourceEntityId!
          ? 1
          : a.sourceFeature < b.sourceFeature
            ? -1
            : a.sourceFeature > b.sourceFeature
              ? 1
              : 0),
  );
  const endpoint = candidates[0];
  if (endpoint) return { point: endpoint.worldPoint, candidate: endpoint };
  if (context.gridSpacing !== null) {
    const spacing = context.gridSpacing;
    const grid = {
      x: Math.round(cursor.x / spacing) * spacing,
      y: Math.round(cursor.y / spacing) * spacing,
    };
    const point = constrain(grid);
    return {
      point,
      candidate:
        point.x === grid.x && point.y === grid.y
          ? {
              kind: "grid",
              worldPoint: point,
              distanceOnScreen:
                Math.hypot(point.x - cursor.x, point.y - cursor.y) * context.pixelsPerMetre,
              sourceEntityId: null,
              sourceFeature: "grid",
              priority: 1,
            }
          : null,
    };
  }
  return { point: constrain(cursor), candidate: null };
}
