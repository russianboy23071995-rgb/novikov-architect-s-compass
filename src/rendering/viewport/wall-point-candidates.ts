import { viewportModel, type PreparedViewportModel } from "./prepared-model.ts";
import { wallBase } from "../../domain/elements/wall/heights.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { visibleSurfaces } from "./layer-display.ts";
import { isLayerVisible } from "../../application/layers/visibility.ts";
import type { LayerVisibilityPolicy } from "../../application/layers/visibility.ts";
import type { Project } from "../../lib/bim/model.ts";
import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import { getLocalSnapSources } from "../../application/snapping/local-sources.ts";
import { collectSnapCandidates } from "../../constraints/snapping/candidates.ts";
import { compareSnapCandidates } from "../../constraints/snapping/ranking.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import type { ProjectionState } from "./projection-state.ts";
import { classifyAnchorVisibility } from "./anchor-visibility.ts";
import { wallEndpointIndex } from "../../application/snapping/project-references.ts";

/** Read-only adapter for existing wall axis/corner/midpoint sources on the active storey plane.
 * Project snapshots must be immutable, as in the shared application source cache.
 * Recreate after model/projection changes; no hidden-target selection policy here. */
export function createWallPointCandidates(
  project: Project,
  projection: ProjectionState,
  movingWallId?: string,
  visibility?: LayerVisibilityPolicy,
  prepared?: PreparedViewportModel,
) {
  const model = viewportModel(project, prepared);
  const complete = buildBuildingSolid(model);
  const baseSolid = visibleSurfaces(complete, (id) => isLayerVisible(project, visibility, id));
  // A moving preview is neither a target nor an occluder of its stationary sources.
  const solid = movingWallId
    ? { ...baseSolid, faces: baseSolid.faces.filter((f) => f.wallId !== movingWallId) }
    : baseSolid;
  const sources = getLocalSnapSources(model);
  const walls = new Set(
    storeyOf(model)
      .walls.filter(
        (w) =>
          wallBase(w) === 0 && w.id !== movingWallId && isLayerVisible(project, visibility, w.id),
      )
      .map((wall) => wall.id),
  );
  const elevation = workingStoreyElevation(model);
  const plane = projection.workplane(elevation);
  return Object.freeze({
    visibilityAt: (point: Point2) =>
      classifyAnchorVisibility(solid, projection, [point.x, point.y, elevation]),
    query(
      currentProject: Project,
      currentProjection: ProjectionState,
      client: Point2,
      radiusPx: number,
    ) {
      if (
        currentProject !== project ||
        currentProjection !== projection ||
        (visibility && !visibility.isCurrent(project, visibility.context))
      )
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
          pointIndex: wallEndpointIndex(candidate.sourceFeature ?? ""),
          modelPoint: [candidate.worldPoint.x, candidate.worldPoint.y, elevation] as const,
          visibility: classifyAnchorVisibility(solid, projection, [
            candidate.worldPoint.x,
            candidate.worldPoint.y,
            elevation,
          ]),
        })),
      };
    },
  });
}
