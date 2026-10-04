import type { Point2 } from "../../geometry/primitives/point.ts";
import { projectDirection, angle45Direction } from "../../geometry/projections/direction.ts";
import { collectSnapCandidates, gridSnap } from "./candidates.ts";
import { compareSnapCandidates } from "./ranking.ts";
import type { GuideDirection } from "../guides/directions.ts";
import type { ScreenMetric } from "../../geometry/projections/screen-metric.ts";
import { createIsotropicScreenMetric } from "../../geometry/projections/screen-metric.ts";

export type SnapReference = {
  segment?: { start: Point2; end: Point2 };
  parallelDirections?: readonly Point2[];
  kind?: "midpoint" | "segment-intersection";
  point: Point2;
  entityId: string;
  feature: string;
  directions?: readonly Point2[];
  dependencies?: readonly SnapReference[];
};
export type SnapCandidate = {
  kind:
    | "endpoint"
    | "midpoint"
    | "segment-intersection"
    | "grid"
    | "horizontal"
    | "vertical"
    | "parallel"
    | "extension"
    | "perpendicular"
    | "angle"
    | "intersection"
    | "axis-intersection";
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
export type SnapSourceQuery = (
  cursor: Point2,
  pixelsPerMetre: number,
  radiusPx: number,
  active: readonly SnapReference[],
  intersectionsPaused?: boolean,
  selectedSegments?: ReadonlySet<string> | null,
  metric?: ScreenMetric,
) => readonly SnapReference[];
export type SnapContext = {
  /** Point ranking/local query only; guide projection and hover migration remain pending. */
  metric?: ScreenMetric;
  intersectionsPaused?: boolean;
  selectedSegments?: ReadonlySet<string> | null;
  sourceQuery?: SnapSourceQuery | undefined;
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
  fixedAxis?: { origin: Point2; direction: Point2 } | null;
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
  context = {
    ...context,
    metric: context.metric ?? createIsotropicScreenMetric(context.pixelsPerMetre),
  };
  const axis = context.fixedAxis;
  if (
    axis &&
    (![axis.origin.x, axis.origin.y].every(Number.isFinite) ||
      !projectDirection(cursor, axis.origin, axis.direction))
  )
    throw new Error("Invalid fixed snap axis");
  const origin = context.orthoOrigin;
  // Explicit Shift constraint takes precedence over automatic snapping and Ortho.
  if (context.angleOrigin && !axis) {
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
    axis
      ? projectDirection(p, axis.origin, axis.direction)!
      : origin
        ? horizontal
          ? { x: p.x, y: origin.y }
          : { x: origin.x, y: p.y }
        : { ...p };
  if (!context.enabled) return { point: constrain(cursor), candidate: null };
  if (context.sourceQuery)
    context = {
      ...context,
      references: context.sourceQuery(
        cursor,
        context.pixelsPerMetre,
        context.endpointRadiusPx,
        context.activeReferences ?? (context.activeReference ? [context.activeReference] : []),
        context.intersectionsPaused,
        context.selectedSegments,
        context.metric,
      ),
    };
  const candidates = collectSnapCandidates(cursor, context, constrain);
  candidates.sort(compareSnapCandidates);
  const candidate = candidates[0]?.candidate;
  return candidate
    ? { point: candidate.worldPoint, candidate }
    : gridSnap(cursor, context, constrain);
}
