import { storeyOf } from "../../domain/storeys/access.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
import type {
  SnapCandidate,
  SnapContext,
  SnapReference,
} from "../../constraints/snapping/engine.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import { createIsotropicScreenMetric } from "../../geometry/projections/screen-metric.ts";
import { segmentKey } from "../snapping/reference-selection.ts";
import { previewTConnection } from "./t-connections.ts";
import { MIN_T_ANGLE_DEGREES } from "../../domain/elements/wall/t-junction.ts";

export function tAxisEndpoint(session: EditSession) {
  if (
    session.target.kind !== "wall" ||
    !["point", "stretch"].includes(session.action) ||
    (session.index !== 0 && session.index !== 1)
  )
    return null;
  const wall = storeyOf(session.base).walls.find((w) => w.id === session.target.id);
  const point = session.index === 0 ? wall?.start : wall?.end;
  // A body-corner drag has a different target than its axis endpoint.
  return wall && point && pointsCompatible(point, session.anchor)
    ? { wall, endpoint: session.index }
    : null;
}

/** Local visible axis sources only. Multiple eligible hosts require reference selection. */
export function tAxisReference(
  session: EditSession,
  cursor: Point,
  context: SnapContext,
): SnapReference | null {
  const incoming = tAxisEndpoint(session);
  if (!incoming) return null;
  return findTAxisReference(
    incoming.endpoint === 0 ? incoming.wall.end : incoming.wall.start,
    incoming.wall.id,
    cursor,
    context,
  );
}

/** At least the T minimum angle between the new wall (fixed end to foot) and the host axis. */
function obliqueEnough(fixed: Point, foot: Point, axis: Point) {
  const wall = { x: foot.x - fixed.x, y: foot.y - fixed.y };
  const lengths = Math.hypot(wall.x, wall.y) * Math.hypot(axis.x, axis.y);
  return (
    lengths > 0 &&
    Math.abs(wall.x * axis.x + wall.y * axis.y) / lengths <=
      Math.cos((MIN_T_ANGLE_DEGREES * Math.PI) / 180)
  );
}

export function findTAxisReference(
  fixed: Point,
  excludedId: string | null,
  cursor: Point,
  context: SnapContext,
): SnapReference | null {
  if (!context.enabled || !context.includeInteractionTargets) return null;
  const sources = context.sourceQuery
    ? context.sourceQuery(
        cursor,
        context.pixelsPerMetre,
        context.endpointRadiusPx,
        [],
        context.intersectionsPaused,
        context.selectedSegments,
        context.metric,
      )
    : context.references;
  const metric = context.metric ?? createIsotropicScreenMetric(context.pixelsPerMetre);
  const targets = new Map<string, SnapReference>();
  for (const source of sources) {
    if (
      !source.feature.startsWith("axis-midpoint:") ||
      !source.segment ||
      source.entityId === excludedId ||
      (context.selectedSegments && !context.selectedSegments.has(segmentKey(source)))
    )
      continue;
    const { start, end } = source.segment;
    const axis = { x: end.x - start.x, y: end.y - start.y };
    // The perpendicular foot of the fixed end wins near the cursor; otherwise the cursor foot on
    // the axis gives an oblique T, if the angle is not flatter than the T minimum (26.10.2026).
    const square = projectDirection(fixed, start, axis);
    const foot = projectDirection(cursor, start, axis);
    const point =
      square && metric.distance(cursor, square) <= context.endpointRadiusPx
        ? square
        : foot &&
            metric.distance(cursor, foot) <= context.endpointRadiusPx &&
            obliqueEnough(fixed, foot, axis)
          ? foot
          : null;
    if (!point) continue;
    const t =
      ((point.x - start.x) * (end.x - start.x) + (point.y - start.y) * (end.y - start.y)) /
      ((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
    if (t <= 0 || t >= 1) continue;
    if (
      context.acceptCandidate &&
      !context.acceptCandidate({
        kind: "endpoint",
        worldPoint: point,
        sourceEntityId: source.entityId,
        sourceFeature: "t-axis",
        distanceOnScreen: metric.distance(cursor, point),
        priority: 0,
      })
    )
      continue;
    targets.set(source.entityId, { entityId: source.entityId, feature: "t-axis", point });
  }
  return targets.size === 1 ? [...targets.values()][0]! : null;
}

/** Validate the same snapped relation on preview and commit; never discover from coordinates alone. */
export function connectSnappedT(
  session: EditSession,
  proposed: Project,
  point: Point,
  candidate?: SnapCandidate | null,
) {
  if (candidate?.sourceFeature !== "t-axis") return proposed;
  const incoming = tAxisEndpoint(session);
  if (!incoming || !candidate.sourceEntityId || !pointsCompatible(candidate.worldPoint, point))
    throw new Error("T-Fangziel ist nicht mehr gültig.");
  return connectWallAtTAxis(
    proposed,
    incoming.wall.id,
    incoming.endpoint as 0 | 1,
    point,
    candidate,
  );
}

export function connectWallAtTAxis(
  proposed: Project,
  wallId: string,
  endpoint: 0 | 1,
  point: Point,
  candidate?: SnapCandidate | null,
) {
  if (candidate?.sourceFeature !== "t-axis") return proposed;
  if (!candidate.sourceEntityId || !pointsCompatible(candidate.worldPoint, point))
    throw new Error("T-Fangziel ist nicht mehr g\u00fcltig.");
  const moved = storeyOf(proposed).walls.find((w) => w.id === wallId);
  if (!moved) throw new Error("Wand nicht gefunden.");
  if (!pointsCompatible(endpoint === 0 ? moved.start : moved.end, point))
    throw new Error("T-Fangziel passt nicht zur Wandachse.");
  const relation = {
    hostWallId: candidate.sourceEntityId,
    incoming: { wallId, endpoint },
  };
  if (
    storeyOf(proposed).wallTJunctions.some(
      (r) =>
        r.hostWallId === relation.hostWallId &&
        r.incoming.wallId === relation.incoming.wallId &&
        r.incoming.endpoint === relation.incoming.endpoint,
    )
  )
    return proposed;
  return previewTConnection(proposed, proposed, {
    projectId: proposed.id,
    kind: "connect",
    relation,
  });
}

/** Shared candidate transport for drawing and direct editing. */
export function queryTAxisSnap(
  cursor: Point,
  context: SnapContext,
  reference: SnapReference | null,
) {
  const sourceQuery = context.sourceQuery;
  const result = querySnap(cursor, {
    ...context,
    references: reference ? [...context.references, reference] : context.references,
    sourceQuery:
      sourceQuery && reference ? (...args) => [...sourceQuery(...args), reference] : sourceQuery,
  });
  if (reference && pointsCompatible(result.point, reference.point))
    result.candidate = {
      kind: "endpoint",
      worldPoint: reference.point,
      sourceEntityId: reference.entityId,
      sourceFeature: "t-axis",
      sourceReferences: [reference],
      distanceOnScreen: 0,
      priority: 0,
    };
  return result;
}
