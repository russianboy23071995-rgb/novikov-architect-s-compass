import { storeyOf } from "../../domain/storeys/access.ts";
import type { ViewIdentity } from "../../domain/views/scale.ts";
import { previewHatch } from "../hatches/actions.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import { addLine } from "../lines/actions.ts";
import { addWall } from "../walls/actions.ts";
import { addSlab } from "../slabs/actions.ts";
import { addRoof } from "../roofs/actions.ts";
import { addRoom } from "../rooms/actions.ts";
import type { Roof } from "../../domain/elements/roof/model.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
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
    }
  | { kind: "slab"; points: Point[]; thickness: number; topOffset: number; layerId?: string }
  | ({ kind: "roof"; points: Point[]; layerId?: string } & Omit<Roof, "id" | "points" | "layerId">)
  | {
      kind: "room";
      points: Point[];
      name?: string;
      floorBuildUp?: number;
      heightLines?: number[];
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
        : view.storeyId !== storeyOf(current).id))
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
  if (request.kind === "slab")
    return addSlab(current, {
      id,
      points: closedDrawingContour(request.points),
      thickness: request.thickness,
      topOffset: request.topOffset,
      ...(request.layerId ? { layerId: request.layerId } : {}),
    });
  if (request.kind === "room")
    return addRoom(current, {
      id,
      points: closedDrawingContour(request.points),
      ...(request.name ? { name: request.name } : {}),
      ...(request.floorBuildUp !== undefined ? { floorBuildUp: request.floorBuildUp } : {}),
      ...(request.heightLines ? { heightLines: request.heightLines } : {}),
      ...(request.layerId ? { layerId: request.layerId } : {}),
    });
  if (request.kind === "roof") {
    const { kind: _kind, points, layerId, ...values } = request;
    return addRoof(current, {
      id,
      points: closedDrawingContour(points),
      ...values,
      ...(layerId ? { layerId } : {}),
    });
  }
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
