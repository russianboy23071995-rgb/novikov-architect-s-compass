import type { Point2 } from "../../geometry/primitives/point.ts";
import { projectDirection, angle45Direction } from "../../geometry/projections/direction.ts";
import { collectSnapCandidates, gridSnap } from "./candidates.ts";
import { compareSnapCandidates } from "./ranking.ts";
import type { GuideDirection } from "../guides/directions.ts";

export type SnapReference = {
  point: Point2;
  entityId: string;
  feature: string;
  directions?: readonly Point2[];
  dependencies?: readonly SnapReference[];
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
  sourceReferences?: readonly SnapReference[];
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
  guideDirections?: readonly GuideDirection[];
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
  const candidates = collectSnapCandidates(cursor, context, constrain);
  candidates.sort(compareSnapCandidates);
  const candidate = candidates[0]?.candidate;
  return candidate
    ? { point: candidate.worldPoint, candidate }
    : gridSnap(cursor, context, constrain);
}
