import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../../application/selection/target.ts";
import type { ProjectionState } from "./projection-state.ts";

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
