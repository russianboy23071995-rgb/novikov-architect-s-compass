import type { Project } from "../../lib/bim/model.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { getLocalSnapSources } from "../../application/snapping/local-sources.ts";
import { collectSnapCandidates } from "../../constraints/snapping/candidates.ts";
import { compareSnapCandidates } from "../../constraints/snapping/ranking.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { ProjectionState } from "./projection-state.ts";
import { classifyAnchorVisibility } from "./anchor-visibility.ts";

/** Read-only adapter for existing wall axis/corner/midpoint sources on z=0.
 * Project snapshots must be immutable, as in the shared application source cache.
 * Recreate after model/projection changes; no hidden-target selection policy here. */
export function createWallPointCandidates(project: Project, projection: ProjectionState) {
  const solid = buildSolid(project);
  const sources = getLocalSnapSources(project);
  const walls = new Set(project.storey.walls.map((wall) => wall.id));
  const plane = projection.workplane(0);
  return Object.freeze({
    query(
      currentProject: Project,
      currentProjection: ProjectionState,
      client: Point2,
      radiusPx: number,
    ) {
      if (currentProject !== project || currentProjection !== projection)
        return { status: "paused" as const, reason: "stale-snapshot" };
      if (![client.x, client.y, radiusPx].every(Number.isFinite) || radiusPx < 0)
        return { status: "paused" as const, reason: "invalid-input" };
      if (plane.status !== "ok") return { status: "paused" as const, reason: plane.status };
      const inverse = plane.value.toPlane(client);
      if (inverse.status !== "ok") return { status: "paused" as const, reason: inverse.status };
      const cursor = inverse.value.point;
      const references = sources.queryPrimitives(cursor, plane.value.metric, radiusPx, (source) =>
        walls.has(source.entityId),
      ).references;
      const ranked = collectSnapCandidates(
        cursor,
        {
          references,
          metric: plane.value.metric,
          pixelsPerMetre: 1,
          endpointRadiusPx: radiusPx,
          enabled: true,
          gridSpacing: null,
          orthoOrigin: null,
        },
        (point) => point,
      ).sort(compareSnapCandidates);
      return {
        status: "ok" as const,
        candidates: ranked.map(({ candidate }) => ({
          ...candidate,
          reference: references.find(
            (r) => r.entityId === candidate.sourceEntityId && r.feature === candidate.sourceFeature,
          )!,
          sourceId: JSON.stringify([candidate.sourceEntityId, candidate.sourceFeature]),
          modelPoint: [candidate.worldPoint.x, candidate.worldPoint.y, 0] as const,
          visibility: classifyAnchorVisibility(solid, projection, [
            candidate.worldPoint.x,
            candidate.worldPoint.y,
            0,
          ]),
        })),
      };
    },
  });
}
