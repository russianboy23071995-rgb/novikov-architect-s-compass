import type { Point2 } from "../../../geometry/primitives/point.ts";

/** Physical body coordinates; drawing-axis endpoints remain authoritative. */
export function wallBody(wall: {
  start: Point2;
  end: Point2;
  thickness: number;
  bodyOffset: number;
}) {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const normal = {
    x: -(wall.end.y - wall.start.y) / length,
    y: (wall.end.x - wall.start.x) / length,
  };
  const at = (axis: Point2, offset: number): Point2 => ({
    x: axis.x + normal.x * offset,
    y: axis.y + normal.y * offset,
  });
  const sideOffset = (side: number) => wall.bodyOffset + (side * wall.thickness) / 2;
  const start = at(wall.start, wall.bodyOffset),
    end = at(wall.end, wall.bodyOffset);
  const corner = (index: number, side: number) =>
    at(index === 0 ? wall.start : wall.end, sideOffset(side));
  const corners = [corner(0, -1), corner(1, -1), corner(1, 1), corner(0, 1)];
  if (
    !Number.isFinite(length) ||
    length <= 0 ||
    !Number.isFinite(wall.bodyOffset) ||
    ![start, end, ...corners].every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
  )
    throw new Error("Ungültige Wandkörperkoordinaten.");
  return { start, end, normal, corners, corner, sideOffset };
}
