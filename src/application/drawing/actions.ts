import { addLine, addWall } from "../../lib/bim/model.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import type { LineAppearance } from "../../lib/bim/lines.ts";
import { precisionTarget } from "../input/precision.ts";
export const defaultDrawingWall = { thickness: 0.36, height: 2.8 } as const;
export type DrawingRequest =
  | { kind: "wall"; start: Point; end: Point; thickness: number; height: number }
  | { kind: "line"; points: Point[]; lineKind: "line" | "polyline"; appearance: LineAppearance };
export function assertDrawingContext(base: Project, current: Project) {
  if (base !== current) throw new Error("Das Modell wurde geändert. Zeichnen erneut beginnen.");
}
/** Shared text/geometry boundary; the UI supplies intent, never its own polar calculation. */
export function previewDrawingInput(
  base: Project,
  current: Project,
  origin: Point,
  aim: Point | null,
  angle: string,
  length: string,
) {
  assertDrawingContext(base, current);
  const result = precisionTarget(origin, aim, angle, length);
  if (Math.hypot(result.point.x - origin.x, result.point.y - origin.y) === 0)
    throw new Error("Das Element benötigt eine Länge größer als null.");
  return result;
}
/** One validated creation action for mouse and numeric drawing; caller commits once to history. */
export function createDrawing(
  base: Project,
  current: Project,
  id: string,
  request: DrawingRequest,
): Project {
  assertDrawingContext(base, current);
  return request.kind === "wall"
    ? addWall(current, {
        id,
        start: request.start,
        end: request.end,
        thickness: request.thickness,
        height: request.height,
      })
    : addLine(current, {
        id,
        kind: request.lineKind,
        points: request.points,
        ...request.appearance,
      });
}
