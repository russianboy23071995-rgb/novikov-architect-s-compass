import type { DrawingLine, Wall, BimWindow } from "./schema.ts";
import { effectiveWallHeight } from "../elements/wall/roof-trim.ts";

export function validateLineGeometry(line: Pick<DrawingLine, "kind" | "points">): void {
  if (line.kind === "line" && line.points.length !== 2)
    throw new Error("A line needs exactly two points");
  let total = 0;
  for (let i = 1; i < line.points.length; i++) {
    const a = line.points[i - 1]!,
      b = line.points[i]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    if (!Number.isFinite(length) || length <= 0)
      throw new Error("Line segments must have finite positive length");
    total += length;
  }
  if (!Number.isFinite(total)) throw new Error("Line length must be finite");
}
export function validateWindowGeometry(
  opening: Omit<BimWindow, "layerId">,
  wall: Pick<Wall, "start" | "end" | "height" | "trimPlane">,
): void {
  const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
  const centre = opening.position * length;
  if (opening.width > length || centre < opening.width / 2 || length - centre < opening.width / 2) {
    throw new Error(`Window ${opening.id} must fit within its wall length`);
  }
  // A trimmed wall reaches up to the roof (L04b); the exact check over the roof is in
  // resolveRoofTrims.
  if (opening.sillHeight + opening.height > effectiveWallHeight(wall)) {
    throw new Error(`Window ${opening.id} must fit within its wall height`);
  }
}
