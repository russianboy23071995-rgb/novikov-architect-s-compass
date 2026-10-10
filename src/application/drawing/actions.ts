import type { ViewIdentity } from "../../domain/views/scale.ts";
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
  | {
      kind: "hatch";
      points: Point[];
      fill: Hatch["fill"];
      background?: Hatch["background"];
      contour?: Hatch["contour"];
      patternDefinition?:
        import("../../domain/elements/hatch/pattern.ts").HatchPatternDefinition | null | undefined;
      patternRotation?: number | undefined;
      patternSize?: import("../../domain/elements/hatch/model.ts").HatchPatternSize | undefined;
      layerId?: string;
    }
  | {
      kind: "wall";
      start: Point;
      end: Point;
      thickness: number;
      height: number;
      bodyOffset?: number;
      layerId?: string;
    }
  | {
      kind: "line";
      points: Point[];
      lineKind: "line" | "polyline";
      appearance: LineAppearance;
      layerId?: string;
    };
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
  view?: ViewIdentity,
): Project {
  assertDrawingContext(base, current);
  if (
    view &&
    (view.projectId !== current.id ||
      (view.kind === "drawing-document"
        ? !current.drawingDocuments?.some((d) => d.id === view.documentId)
        : view.storeyId !== current.storey.id))
  )
    throw new Error("Der Zeichenkontext ist nicht mehr gültig.");
  if (request.kind === "hatch")
    return previewHatch(base, current, {
      projectId: current.id,
      kind: "create",
      patternDefinition: request.patternDefinition,
      patternRotation: request.patternRotation,
      patternSize: request.patternSize,
      hatch: {
        id,
        points: closedDrawingContour(request.points),
        fill: request.fill,
        ...(request.background ? { background: request.background } : {}),
        ...(request.contour ? { contour: request.contour } : {}),
        ...(request.layerId ? { layerId: request.layerId } : {}),
      },
    });
  return request.kind === "wall"
    ? addWall(current, {
        id,
        start: request.start,
        end: request.end,
        thickness: request.thickness,
        bodyOffset: request.bodyOffset ?? request.thickness / 2,
        ...(request.layerId ? { layerId: request.layerId } : {}),
        height: request.height,
      })
    : addLine(current, {
        id,
        kind: request.lineKind,
        points: request.points,
        ...request.appearance,
        ...(request.layerId ? { layerId: request.layerId } : {}),
      });
}
