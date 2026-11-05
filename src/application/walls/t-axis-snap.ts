import { storeyOf } from "../../domain/storeys/access.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import type { EditSession } from "../direct-edit/session.ts";
import type { Point, Project, Wall } from "../../domain/project/schema.ts";
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

/** The new wall (fixed end to foot) is not parallel to the host axis; any other angle is a T. */
function notParallel(fixed: Point, foot: Point, axis: Point) {
  const wall = { x: foot.x - fixed.x, y: foot.y - fixed.y };
  const lengths = Math.hypot(wall.x, wall.y) * Math.hypot(axis.x, axis.y);
  return lengths > 0 && Math.abs(wall.x * axis.y - wall.y * axis.x) / lengths > 1e-9;
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
    // the axis gives an oblique T at any non-parallel angle (26.10.2026).
    const square = projectDirection(fixed, start, axis);
    const foot = projectDirection(cursor, start, axis);
    const point =
      square && metric.distance(cursor, square) <= context.endpointRadiusPx
        ? square
        : foot &&
            metric.distance(cursor, foot) <= context.endpointRadiusPx &&
            notParallel(fixed, foot, axis)
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

/** The only wall whose axis interior holds `point` exactly (model tolerance), not parallel to the
 * moved wall. None or several (a crossing) give null. Pure geometry, cheap enough per preview.
 */
export function automaticTHost(
  walls: readonly Wall[],
  wallId: string,
  point: Point,
  far: Point,
): string | null {
  let found: string | null = null;
  for (const wall of walls) {
    if (wall.id === wallId) continue;
    const axis = { x: wall.end.x - wall.start.x, y: wall.end.y - wall.start.y };
    const lengthSquared = axis.x ** 2 + axis.y ** 2;
    if (!(lengthSquared > 0)) continue;
    const t =
      ((point.x - wall.start.x) * axis.x + (point.y - wall.start.y) * axis.y) / lengthSquared;
    if (!(t > 0 && t < 1)) continue;
    const foot = { x: wall.start.x + t * axis.x, y: wall.start.y + t * axis.y };
    if (
      !pointsCompatible(foot, point) ||
      pointsCompatible(point, wall.start) ||
      pointsCompatible(point, wall.end) ||
      !notParallel(far, point, axis)
    )
      continue;
    if (found) return null;
    found = wall.id;
  }
  return found;
}

/** Like corners, a wall end that lies exactly on another wall's axis interior becomes a T when it
 * is drawn or edited there, however the point was found (user decision 26.10.2026,
 * docs/OBLIQUE_T_JUNCTIONS.md). An end that is already joined, a crossing of two axes or a T the
 * project rules reject leave the proposal unchanged (no T), as before.
 */
export function connectAutomaticT(
  proposed: Project,
  wallId: string,
  endpoint: 0 | 1,
  point: Point,
): Project {
  const s = storeyOf(proposed);
  const moved = s.walls.find((w) => w.id === wallId);
  if (!moved || !pointsCompatible(endpoint === 0 ? moved.start : moved.end, point)) return proposed;
  if (
    s.wallJoins.some((j) =>
      [j.first, j.second].some((e) => e.wallId === wallId && e.endpoint === endpoint),
    ) ||
    s.wallTJunctions.some((r) => r.incoming.wallId === wallId && r.incoming.endpoint === endpoint)
  )
    return proposed;
  const host = automaticTHost(s.walls, wallId, point, endpoint === 0 ? moved.end : moved.start);
  if (!host) return proposed;
  try {
    return previewTConnection(proposed, proposed, {
      projectId: proposed.id,
      kind: "connect",
      relation: { hostWallId: host, incoming: { wallId, endpoint } },
    });
  } catch {
    return proposed;
  }
}

/** Validate the same snapped relation on preview and commit; without a T snap, only an exact
 * axis contact may connect automatically (connectAutomaticT). */
export function connectSnappedT(
  session: EditSession,
  proposed: Project,
  point: Point,
  candidate?: SnapCandidate | null,
) {
  if (candidate?.sourceFeature !== "t-axis") {
    const incoming = tAxisEndpoint(session);
    return incoming
      ? connectAutomaticT(proposed, incoming.wall.id, incoming.endpoint as 0 | 1, point)
      : proposed;
  }
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
  if (candidate?.sourceFeature !== "t-axis")
    return connectAutomaticT(proposed, wallId, endpoint, point);
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
