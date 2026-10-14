import type { Project, Point } from "../../domain/project/schema.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import { selectionEdges } from "./selection-outline.ts";
import { classifyAnchorVisibility } from "./anchor-visibility.ts";
import type { ProjectionState } from "./projection-state.ts";
import { visibleSurfaces } from "./layer-display.ts";

export type MovementCorner = { id: string; point: Vector3 };
const cache = new WeakMap<Project, readonly MovementCorner[]>();
/** Shared derived boundary corners, including upper edges and every storey. */
export function movementCorners(project: Project): readonly MovementCorner[] {
  const cached = cache.get(project);
  if (cached) return cached;
  const grouped = new Map<string, ReturnType<typeof buildBuildingSolid>["faces"]>();
  for (const f of buildBuildingSolid(project).faces) {
    const faces = grouped.get(f.wallId) ?? [];
    faces.push(f);
    grouped.set(f.wallId, faces);
  }
  const corners: MovementCorner[] = [];
  for (const [id, faces] of grouped) {
    const points = new Map<string, Vector3>();
    for (const edge of selectionEdges(faces))
      for (const point of edge) points.set(JSON.stringify(point), point);
    for (const point of points.values()) corners.push({ id, point });
  }
  cache.set(project, corners);
  return corners;
}
/** Screen-distance acquisition uses the same displayed solid/depth policy as selection. */
export function createMovementOriginQuery(
  project: Project,
  projection: ProjectionState,
  allows: (id: string) => boolean,
) {
  const solid = visibleSurfaces(buildBuildingSolid(project), allows);
  const projected = movementCorners(project)
    .filter((c) => allows(c.id))
    .map((c) => {
      const p = projection.project(c.point);
      return {
        ...c,
        screen: {
          x: projection.viewport.left + ((p[0] + 1) * projection.viewport.width) / 2,
          y: projection.viewport.top + ((1 - p[1]) * projection.viewport.height) / 2,
        },
      };
    });
  return (client: Point, radius = 10, height?: number) => {
    if (![client.x, client.y, radius].every(Number.isFinite) || radius < 0) return null;
    return (
      projected
        .map((c) => ({ ...c, distance: Math.hypot(c.screen.x - client.x, c.screen.y - client.y) }))
        .filter(
          (c) =>
            c.distance <= radius && (height === undefined || Math.abs(c.point[2] - height) < 1e-8),
        )
        .sort((a, b) => a.distance - b.distance)
        .find((c) => classifyAnchorVisibility(solid, projection, c.point) === "visible") ?? null
    );
  };
}
