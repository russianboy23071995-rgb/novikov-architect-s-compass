import type { Point2 } from "../../geometry/primitives/point.ts";
import { projectDirection, angle45Direction } from "../../geometry/projections/direction.ts";

export type SnapReference = {
  point: Point2;
  entityId: string;
  feature: string;
  directions?: readonly Point2[];
};
export type SnapCandidate = {
  kind: "endpoint" | "grid" | "horizontal" | "vertical" | "extension" | "perpendicular" | "angle";
  guideOrigin?: Point2;
  angleDegrees?: number;
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
  activeReference?: SnapReference | null;
  angleOrigin?: Point2 | null;
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
  // Explicit Shift constraint takes precedence over automatic snapping and Ortho.
  if (context.angleOrigin) {
    if (![context.angleOrigin.x, context.angleOrigin.y].every(Number.isFinite))
      throw new Error("Invalid angle origin");
    const angle = angle45Direction(cursor, context.angleOrigin);
    const point = projectDirection(cursor, context.angleOrigin, angle.direction)!;
    return {
      point,
      candidate: {
        kind: "angle",
        worldPoint: point,
        guideOrigin: context.angleOrigin,
        angleDegrees: angle.degrees,
        distanceOnScreen:
          Math.hypot(point.x - cursor.x, point.y - cursor.y) * context.pixelsPerMetre,
        sourceEntityId: null,
        sourceFeature: "shift-45",
        priority: -1,
      },
    };
  }
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
  const reference = context.activeReference;
  // Reject stale references; model changes must never leave a guide at an old position.
  if (
    reference &&
    context.references.some(
      (r) =>
        r.entityId === reference.entityId &&
        r.feature === reference.feature &&
        r.point.x === reference.point.x &&
        r.point.y === reference.point.y,
    )
  ) {
    const p = reference.point;
    const source = context.references.find(
      (r) => r.entityId === reference.entityId && r.feature === reference.feature,
    )!;
    const directions: { kind: SnapCandidate["kind"]; vector: Point2 }[] = [
      ...(source.directions ?? []).flatMap((vector) => [
        { kind: "extension" as const, vector },
        { kind: "perpendicular" as const, vector: { x: -vector.y, y: vector.x } },
      ]),
      { kind: "horizontal", vector: { x: 1, y: 0 } },
      { kind: "vertical", vector: { x: 0, y: 1 } },
      { kind: "angle", vector: { x: 1, y: 1 } },
      { kind: "angle", vector: { x: 1, y: -1 } },
    ];
    const guides: SnapCandidate[] = [];
    if (
      Math.hypot(cursor.x - p.x, cursor.y - p.y) * context.pixelsPerMetre >
      context.endpointRadiusPx
    )
      for (const { kind, vector } of directions) {
        const point = projectDirection(cursor, p, vector);
        if (!point) continue;
        const constrained = constrain(point);
        const distance =
          Math.hypot(point.x - cursor.x, point.y - cursor.y) * context.pixelsPerMetre;
        if (
          distance <= context.endpointRadiusPx &&
          point.x === constrained.x &&
          point.y === constrained.y
        )
          guides.push({
            kind,
            worldPoint: point,
            guideOrigin: p,
            distanceOnScreen: distance,
            sourceEntityId: source.entityId,
            sourceFeature: source.feature,
            priority: 1,
            ...(kind === "angle" ? { angleDegrees: angle45Direction(point, p).degrees } : {}),
          });
      }
    guides.sort((a, b) => a.distanceOnScreen - b.distanceOnScreen);
    const guide = guides[0];
    if (guide) return { point: guide.worldPoint, candidate: guide };
  }

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
              priority: 2,
            }
          : null,
    };
  }
  return { point: constrain(cursor), candidate: null };
}
