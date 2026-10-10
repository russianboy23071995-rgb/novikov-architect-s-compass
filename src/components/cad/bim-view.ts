import { visiblePlanGeometry } from "../../rendering/viewport/layer-display.ts";
import type { LayerVisibilityPolicy } from "../../application/layers/visibility.ts";
import { imageReferenceCorners } from "../../rendering/viewport/image-reference.ts";
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
export function planBounds(project: Project, visibility?: LayerVisibilityPolicy): string {
  const storey = visibility
    ? visiblePlanGeometry(
        project,
        (id) => visibility.evaluate(project, visibility.context, id).eligible,
      )
    : project.storey;
  if (
    !storey.walls.length &&
    !storey.lines?.length &&
    !storey.hatches.length &&
    !storey.references.length
  )
    return "-2 -3 8 6";
  let left = Infinity,
    top = Infinity,
    right = -Infinity,
    bottom = -Infinity;
  const include = (point: Point, padding = 0) => {
    left = Math.min(left, point.x - padding);
    right = Math.max(right, point.x + padding);
    top = Math.min(top, -point.y - padding);
    bottom = Math.max(bottom, -point.y + padding);
  };
  for (const wall of storey.walls) {
    const body = wallBody(wall);
    for (const point of [body.start, body.end, wall.start, wall.end])
      include(point, wall.thickness / 2);
  }
  for (const line of storey.lines ?? []) for (const point of line.points) include(point);
  for (const hatch of storey.hatches) for (const point of hatch.points) include(point);
  for (const reference of storey.references)
    for (const point of imageReferenceCorners(
      reference,
      project.assets.find((a) => a.id === reference.assetId)!,
    ))
      include(point);
  if (!Number.isFinite(left)) return "-2 -3 8 6";
  left -= 1.5;
  top -= 1.5;
  right += 1.5;
  bottom += 1.5;
  return `${left} ${top} ${right - left} ${bottom - top}`;
}
