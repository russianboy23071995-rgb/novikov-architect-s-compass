import type { Project } from "../../domain/project/schema.ts";

type Rect = { x0: number; y0: number; x1: number; y1: number };
/** Paper and margin frame of a drawing space, in plan metres (docs/LAYOUTS.md). */
export type SheetFrames = { paper: Rect; frame: Rect };

// Keyed by the lens project of a Plankopf or layout space; released with it.
const frames = new WeakMap<Project, SheetFrames>();

/** Registers the sheet of a drawing space so its corners and edges become snap targets. */
export function setSheetFrames(project: Project, sheet: SheetFrames): void {
  frames.set(project, sheet);
}
export function sheetFrames(project: Project): SheetFrames | undefined {
  return frames.get(project);
}
/** Entity ids of the sheet's snap points; they never name a model element. */
export const PAPER_SNAP_ID = "@paper";
export const MARGIN_FRAME_SNAP_ID = "@margin-frame";
export const rectCorners = (r: Rect) => [
  { x: r.x0, y: r.y0 },
  { x: r.x1, y: r.y0 },
  { x: r.x1, y: r.y1 },
  { x: r.x0, y: r.y1 },
];
