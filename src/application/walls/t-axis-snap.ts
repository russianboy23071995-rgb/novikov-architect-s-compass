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

export function tAxisEndpoint(session: EditSession) {
  if (
    session.target.kind !== "wall" ||
    !["point", "stretch"].includes(session.action) ||
    (session.index !== 0 && session.index !== 1)
  )
    return null;
  const wall = session.base.storey.walls.find((w) => w.id === session.target.id);
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
  if (!incoming || !context.enabled || !context.includeInteractionTargets) return null;
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
  const fixed = incoming.endpoint === 0 ? incoming.wall.end : incoming.wall.start;
  const targets = new Map<string, SnapReference>();
  for (const source of sources) {
    if (
      !source.feature.startsWith("axis-midpoint:") ||
      !source.segment ||
      source.entityId === incoming.wall.id ||
      (context.selectedSegments && !context.selectedSegments.has(segmentKey(source)))
    )
      continue;
    const { start, end } = source.segment;
    const point = projectDirection(fixed, start, { x: end.x - start.x, y: end.y - start.y });
    if (!point || metric.distance(cursor, point) > context.endpointRadiusPx) continue;
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
  const moved = proposed.storey.walls.find((w) => w.id === incoming.wall.id)!;
  if (!pointsCompatible(incoming.endpoint === 0 ? moved.start : moved.end, point))
    throw new Error("T-Fangziel passt nicht zur Wandachse.");
  const relation = {
    hostWallId: candidate.sourceEntityId,
    incoming: { wallId: incoming.wall.id, endpoint: incoming.endpoint as 0 | 1 },
  };
  if (
    proposed.storey.wallTJunctions.some(
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
