import type { BimWindow, Wall } from "../../domain/project/schema.ts";
import type { Door } from "../../domain/elements/door/model.ts";
import { doorInsertBoxes, windowInsertBoxes, type InsertBox } from "./opening-insert-solid.ts";

/** A rectangle in wall-local plan coordinates: x along the wall, y left of its direction. */
export type PlanRect = { x: [number, number]; y: [number, number] };

const rect = (box: InsertBox): PlanRect => ({ x: box.x, y: box.y });

/**
 * Plan symbol of a window element (docs/FENSTER_TUEREN.md, FT3), from the same boxes as the
 * 3D body: both jambs as cut frame profiles, the glass pane between them, the window boards
 * below the cut as seen outlines. Null for a plain opening.
 */
export function windowPlanSymbol(
  window: BimWindow,
  wall: Wall,
): { jambs: PlanRect[]; glass: PlanRect; sills: PlanRect[] } | null {
  if (!window.insert) return null;
  const boxes = windowInsertBoxes(window, wall);
  return {
    jambs: boxes.filter((b) => b.part === "jamb").map(rect),
    glass: rect(boxes.find((b) => b.part === "glass")!),
    sills: boxes.filter((b) => b.part === "sill").map(rect),
  };
}

/**
 * Plan symbol of a door element (FT3): both jambs of the frame (Zarge) as cut profiles and the
 * clear width the leaf swings in (opening width less both jambs). Null for a plain opening.
 */
export function doorPlanFrame(
  door: Door,
  wall: Wall,
): { jambs: PlanRect[]; leafWidth: number } | null {
  if (!door.insert) return null;
  const jambs = doorInsertBoxes(door, wall).filter((b) => b.part === "jamb");
  return { jambs: jambs.map(rect), leafWidth: door.width - 2 * door.insert.frameWidth };
}

/** SVG path of plan rectangles in the wall group (SVG y = −local y, as the plan draws). */
export function planRectPath(rects: readonly PlanRect[]): string {
  return rects
    .map(
      ({ x: [x0, x1], y: [y0, y1] }) => `M${x0},${-y0} L${x1},${-y0} L${x1},${-y1} L${x0},${-y1} Z`,
    )
    .join(" ");
}
