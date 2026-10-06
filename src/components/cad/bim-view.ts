import { wallBody } from "../../domain/elements/wall/body.ts";
import { addWall, addWindow, createProject, wallLength } from "../../lib/bim/model.ts";
import type { Point, Project, Wall } from "../../lib/bim/model.ts";

export type Selection = import("../../application/selection/target.ts").ElementTarget | null;

export function createExampleProject(): Project {
  return addWindow(
    addWall(createProject("project-1", "storey-1"), {
      id: "wall-1",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
    }),
    { id: "window-1", wallId: "wall-1", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 },
  );
}

/** Preserve the start and direction when editing length, including diagonal walls. */
export function endAtLength(wall: Wall, length: number): Point {
  if (!Number.isFinite(length) || length <= 0) throw new Error("Length must be greater than zero.");
  const scale = length / wallLength(wall);
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * scale,
    y: wall.start.y + (wall.end.y - wall.start.y) * scale,
  };
}

export function drawingPoint(
  point: Point,
  start: Point | null,
  snap: boolean,
  ortho: boolean,
): Point {
  const next = snap
    ? { x: Math.round(point.x * 10) / 10, y: Math.round(point.y * 10) / 10 }
    : { ...point };
  if (ortho && start) {
    if (Math.abs(next.x - start.x) >= Math.abs(next.y - start.y)) next.y = start.y;
    else next.x = start.x;
  }
  return next;
}

/** SVG uses downward-positive Y; model coordinates use upward-positive Y. */
export function planBounds(project: Project): string {
  if (
    !project.storey.walls.length &&
    !project.storey.lines?.length &&
    !project.storey.hatches.length
  )
    return "-2 -3 8 6";
  const extents = project.storey.walls.flatMap((wall) =>
    [wallBody(wall).start, wallBody(wall).end, wall.start, wall.end].map((point) => ({
      left: point.x - wall.thickness / 2,
      right: point.x + wall.thickness / 2,
      top: -point.y - wall.thickness / 2,
      bottom: -point.y + wall.thickness / 2,
    })),
  );
  for (const line of [...(project.storey.lines ?? []), ...project.storey.hatches])
    for (const point of line.points)
      extents.push({ left: point.x, right: point.x, top: -point.y, bottom: -point.y });
  const left = Math.min(...extents.map((p) => p.left)) - 1.5;
  const top = Math.min(...extents.map((p) => p.top)) - 1.5;
  const right = Math.max(...extents.map((p) => p.right)) + 1.5;
  const bottom = Math.max(...extents.map((p) => p.bottom)) + 1.5;
  return `${left} ${top} ${right - left} ${bottom - top}`;
}
