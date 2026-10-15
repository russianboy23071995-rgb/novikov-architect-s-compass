import { createBoxIndex } from "../../geometry/spatial/box-index.ts";
import { viewportModel, type PreparedViewportModel } from "./prepared-model.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { Vector3 } from "../../geometry/projections/orthographic.ts";
import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import { selectionEdges } from "./selection-outline.ts";
import { classifyAnchorVisibility } from "./anchor-visibility.ts";
import type { ProjectionState } from "./projection-state.ts";
import { visibleSurfaces } from "./layer-display.ts";

export type MovementCorner = { id: string; point: Vector3 };
const cache = new WeakMap<ReturnType<typeof buildBuildingSolid>, readonly MovementCorner[]>();
/** Shared derived boundary corners, including upper edges and every storey. */
export function movementCorners(
  project: Project,
  prepared?: PreparedViewportModel,
): readonly MovementCorner[] {
  const solid = buildBuildingSolid(viewportModel(project, prepared));
  const cached = cache.get(solid);
  if (cached) return cached;
  const grouped = new Map<string, ReturnType<typeof buildBuildingSolid>["faces"]>();
  for (const f of solid.faces) {
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
  for (const corner of corners) Object.freeze(corner);
  Object.freeze(corners);
  cache.set(solid, corners);
  return corners;
}
/** Screen-distance acquisition uses the same displayed solid/depth policy as selection. */
export function createMovementOriginQuery(
  project: Project,
  projection: ProjectionState,
  allows: (id: string) => boolean,
  prepared?: PreparedViewportModel,
) {
  const model = viewportModel(project, prepared);
  const solid = visibleSurfaces(buildBuildingSolid(model), allows);
  const projected = movementCorners(model)
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
  const index = createBoxIndex(
    projected.flatMap((c, order) =>
      Number.isFinite(c.screen.x) && Number.isFinite(c.screen.y)
        ? [
            {
              box: { minX: c.screen.x, maxX: c.screen.x, minY: c.screen.y, maxY: c.screen.y },
              value: order,
            },
          ]
        : [],
    ),
  );
  const finiteBound = (n: number) => Math.max(-Number.MAX_VALUE, Math.min(Number.MAX_VALUE, n));
  return (client: Point, radius = 10, height?: number) => {
    if (![client.x, client.y, radius].every(Number.isFinite) || radius < 0) return null;
    return (
      index
        .query({
          minX: finiteBound(client.x - radius),
          maxX: finiteBound(client.x + radius),
          minY: finiteBound(client.y - radius),
          maxY: finiteBound(client.y + radius),
        })
        // Tree traversal order is not the original stable tie-break order.
        .sort((a, b) => a - b)
        .map((i) => projected[i]!)
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
