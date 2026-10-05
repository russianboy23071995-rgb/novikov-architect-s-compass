import { previewHatch } from "../hatches/actions.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import { addLine, addWall } from "../../lib/bim/model.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import type { LineAppearance } from "../../lib/bim/lines.ts";
import { precisionTarget } from "../input/precision.ts";
export const defaultDrawingWall = { thickness: 0.36, height: 2.8 } as const;
export const defaultHatchFill: Hatch["fill"] = { color: "#94a3b8", opacity: 0.35 };

/** Drawing may explicitly return to its first point; the domain ring closes implicitly. */
export function closedDrawingContour(points: readonly Point[]): Point[] {
  const end =
    points.length > 1 && pointsCompatible(points[0]!, points.at(-1)!)
      ? points.length - 1
      : points.length;
  return points.slice(0, end).map((p) => ({ ...p }));
}
export type DrawingRequest =
  | { kind: "hatch"; points: Point[]; fill: Hatch["fill"] }
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
  if (request.kind === "hatch")
    return previewHatch(base, current, {
      projectId: current.id,
      kind: "create",
      hatch: { id, points: closedDrawingContour(request.points), fill: request.fill },
    });
  return request.kind === "wall"
    ? addWall(current, {
        id,
        start: request.start,
        end: request.end,
        thickness: request.thickness,
        bodyOffset: request.thickness / 2,
        height: request.height,
      })
    : addLine(current, {
        id,
        kind: request.lineKind,
        points: request.points,
        ...request.appearance,
      });
}
