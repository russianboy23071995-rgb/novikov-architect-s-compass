import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../../application/selection/target.ts";
import type { ProjectionState } from "./projection-state.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import type { Wall } from "../../domain/project/schema.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import { createAffineScreenMetric } from "../../geometry/projections/screen-metric.ts";

export { CAD_TURQUOISE as WALL_AXIS_COLOR } from "./highlight.ts";
const planMetric = createAffineScreenMetric(1, 0, 0, 1);
export function wallAxisAnchor(wall: Wall, point: { x: number; y: number }) {
  return planMetric.projectSegment(point, wall.start, wall.end)?.point ?? wall.start;
}

/** Axis endpoints take precedence over coincident physical corner grips. */
export function wallPlanHandles(wall: Wall, connected = false) {
  const ends = [wall.start, wall.end];
  const handles = ends.map((point, index) => ({
    point,
    index,
    label: `Wandachse ${index === 0 ? "Anfang" : "Ende"}`,
    axis: true,
  }));
  if (connected) return handles;
  const body = wallBody(wall);
  ends.forEach((_point, index) =>
    [-1, 1].forEach((side) => {
      const point = body.corner(index, side);
      if (!ends.some((end) => pointsCompatible(point, end)))
        handles.push({
          point,
          index,
          label: `Wandecke ${index === 0 ? "Anfang" : "Ende"} ${side === 1 ? "links" : "rechts"}`,
          axis: false,
        });
    }),
  );
  return handles;
}

/** Selection-only construction overlay in CSS pixels, intentionally visible through
 * the body. Uses the displayed model snapshot; never contributes to picking/snapping.
 * The current single-storey model has its wall feet at z=0.
 */
export function selectedWallAxis(
  displayed: Project,
  selection: ElementTarget | null,
  allows: (id: string) => boolean,
  projection: ProjectionState,
) {
  if (selection?.kind !== "wall" || !allows(selection.id)) return null;
  const wall = displayed.storey.walls.find((w) => w.id === selection.id);
  if (!wall) return null;
  const screen = (point: { x: number; y: number }) => {
    const [x, y] = projection.project([point.x, point.y, 0]);
    return {
      x: ((x + 1) * projection.viewport.width) / 2,
      y: ((1 - y) * projection.viewport.height) / 2,
    };
  };
  const start = screen(wall.start),
    end = screen(wall.end);
  if (![start.x, start.y, end.x, end.y].every(Number.isFinite)) return null;
  return { wallId: wall.id, start, end };
}
