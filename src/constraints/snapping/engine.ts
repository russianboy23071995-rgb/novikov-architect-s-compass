import type { Point2 } from "../../geometry/primitives/point.ts";
import { projectDirection, angle45Direction } from "../../geometry/projections/direction.ts";
import { coordinatesCompatible, pointsCompatible } from "../../geometry/tolerances/model.ts";

export type SnapReference = {
  point: Point2;
  entityId: string;
  feature: string;
  directions?: readonly Point2[];
};
export type SnapCandidate = {
  kind:
    | "endpoint"
    | "grid"
    | "horizontal"
    | "vertical"
    | "extension"
    | "perpendicular"
    | "angle"
    | "intersection";
  secondaryGuideOrigin?: Point2;
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
  activeReferences?: readonly SnapReference[];
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
    // Allow numerical roundoff only; retain the exact endpoint, never its Ortho projection.
    if (origin && !coordinatesCompatible(horizontal ? p.y : p.x, horizontal ? origin.y : origin.x))
      continue;
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
  if (context.activeReferences?.length) {
    const active = context.activeReferences.filter((a) =>
      context.references.some(
        (r) =>
          r.entityId === a.entityId &&
          r.feature === a.feature &&
          r.point.x === a.point.x &&
          r.point.y === a.point.y,
      ),
    );
    const guides: SnapCandidate[] = [];
    for (const reference of active) {
      const result = querySnap(cursor, {
        ...context,
        activeReferences: [],
        activeReference: reference,
      });
      if (result.candidate?.guideOrigin) guides.push(result.candidate);
    }
    // Horizontal from A and vertical from B, without persisting construction geometry.
    for (const a of active)
      for (const b of active) {
        if (a === b) continue;
        const point = { x: b.point.x, y: a.point.y };
        const constrained = constrain(point);
        const distance =
          Math.hypot(point.x - cursor.x, point.y - cursor.y) * context.pixelsPerMetre;
        if (distance <= context.endpointRadiusPx && pointsCompatible(point, constrained))
          guides.push({
            kind: "intersection",
            worldPoint: point,
            guideOrigin: a.point,
            secondaryGuideOrigin: b.point,
            distanceOnScreen: distance,
            priority: 0.5,
            sourceEntityId: a.entityId,
            sourceFeature: `${a.feature}/${b.entityId}/${b.feature}`,
          });
      }
    guides.sort(
      (a, b) =>
        a.priority - b.priority ||
        a.distanceOnScreen - b.distanceOnScreen ||
        a.sourceFeature.localeCompare(b.sourceFeature),
    );
    if (guides[0]) return { point: guides[0].worldPoint, candidate: guides[0] };
  }
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
        if (distance <= context.endpointRadiusPx && pointsCompatible(point, constrained))
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
    const constrained = constrain(grid);
    const compatible = pointsCompatible(grid, constrained);
    // A grid marker must report the actual grid point, not a slightly projected copy.
    const point = compatible ? grid : constrained;
    return {
      point,
      candidate: compatible
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
