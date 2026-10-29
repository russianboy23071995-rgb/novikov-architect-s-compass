import { replacePathVertex, translatePoint } from "../../geometry/primitives/point.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { boundedWindowPosition } from "../../domain/elements/wall/window-range.ts";
import { previewHatch } from "../hatches/actions.ts";
import { updateDoor } from "../doors/actions.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { updateLine } from "../lines/actions.ts";
import { updateWindow } from "../windows/actions.ts";
import { wallLength } from "../../domain/project/schema.ts";
import { updateWall } from "../walls/actions.ts";
import { updateSlab } from "../slabs/actions.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
import type { WallSolidReuse } from "../../domain/elements/wall/connections.ts";
import type { ProjectResultMode } from "../../domain/project/owned-snapshot.ts";

export type TransformTarget = { kind: "wall" | "line" | "hatch" | "slab"; id: string };

export function editablePoints(project: Project, target: TransformTarget): Point[] {
  if (target.kind === "wall") {
    const wall = storeyOf(project).walls.find((item) => item.id === target.id);
    if (wall) return [{ ...wall.start }, { ...wall.end }];
  } else if (target.kind === "hatch") {
    const hatch = storeyOf(project).hatches.find((item) => item.id === target.id);
    if (hatch) return hatch.points.map((point) => ({ ...point }));
  } else if (target.kind === "slab") {
    const slab = storeyOf(project).slabs?.find((item) => item.id === target.id);
    if (slab) return slab.points.map((point) => ({ ...point }));
  } else {
    const line = storeyOf(project).lines?.find((item) => item.id === target.id);
    if (line) return line.points.map((point) => ({ ...point }));
  }
  throw new Error("Das ausgewählte Element existiert nicht mehr.");
}

function applyPoints(
  project: Project,
  target: TransformTarget,
  points: Point[],
  offset: Point | null = null,
  reuse?: WallSolidReuse,
  resultMode: ProjectResultMode = "mutable",
): Project {
  if (target.kind === "hatch") {
    const hatch = storeyOf(project).hatches.find((h) => h.id === target.id)!;
    const pattern =
      offset && hatch.pattern
        ? {
            ...hatch.pattern,
            origin: translatePoint(hatch.pattern.origin, offset),
          }
        : hatch.pattern;
    return previewHatch(project, project, {
      projectId: project.id,
      kind: "update",
      id: target.id,
      changes: { points, ...(pattern ? { pattern } : {}) },
    });
  }
  // Outline edits of a ceiling slab use the shared slab action (docs/SLAB_ELEMENT.md, E1).
  if (target.kind === "slab") return updateSlab(project, target.id, { points });
  return target.kind === "wall"
    ? updateWall(
        project,
        target.id,
        { start: points[0]!, end: points[1]! },
        offset ? "move" : "reshape",
        reuse,
        resultMode,
      )
    : updateLine(project, target.id, { points });
}

/** Translation is atomic; hosted windows retain their relative wall positions. */
export function moveElement(project: Project, target: TransformTarget, offset: Point): Project {
  if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y))
    throw new Error("Verschiebung muss endliche Meterwerte enthalten.");
  return applyPoints(
    project,
    target,
    editablePoints(project, target).map((p) => translatePoint(p, offset)),
    offset,
  );
}

export function moveElementPoint(
  project: Project,
  target: TransformTarget,
  index: number,
  position: Point,
  reuse?: WallSolidReuse,
  resultMode: ProjectResultMode = "mutable",
): Project {
  return applyPoints(
    project,
    target,
    replacePathVertex(editablePoints(project, target), index, position),
    null,
    reuse,
    resultMode,
  );
}

/** Set the terminal segment's length, retaining its direction and the other endpoint. */
export function stretchEndpoint(
  project: Project,
  target: TransformTarget,
  endpoint: "start" | "end",
  length: number,
): Project {
  if (!Number.isFinite(length) || length <= 0) throw new Error("Länge muss größer als null sein.");
  if (target.kind === "hatch" || target.kind === "slab")
    throw new Error("Geschlossene Umrisse haben keine freien Endpunkte.");
  const points = editablePoints(project, target);
  const last = points.length - 1;
  if (points.length > 2 && points[0]!.x === points[last]!.x && points[0]!.y === points[last]!.y)
    throw new Error(
      "Geschlossene Polylinien haben keine freien Endpunkte. Punkt versetzen verwenden.",
    );
  const index = endpoint === "start" ? 0 : last;
  const fixed = points[endpoint === "start" ? 1 : last - 1]!;
  const moving = points[index]!;
  const dx = moving.x - fixed.x,
    dy = moving.y - fixed.y;
  const scale = length / Math.hypot(dx, dy);
  return moveElementPoint(project, target, index, {
    x: fixed.x + dx * scale,
    y: fixed.y + dy * scale,
  });
}

/** Wall-hosted openings: windows and doors share one movement and range rule. */
export type OpeningTarget = { kind: "window" | "door"; id: string };

export function hostedOpening(project: Project, target: OpeningTarget) {
  const storey = storeyOf(project);
  const opening =
    target.kind === "window"
      ? storey.windows.find((item) => item.id === target.id)
      : storey.doors?.find((item) => item.id === target.id);
  const wall = storey.walls.find((item) => item.id === opening?.wallId);
  if (!opening || !wall)
    throw new Error(`${target.kind === "window" ? "Fenster" : "Tür"} oder zugehörige Wand fehlt.`);
  return { opening, wall };
}

/** Opening centre on the wall's reference line; the anchor of every along-wall gesture. */
export function openingCentre(project: Project, target: OpeningTarget): Point {
  const { opening, wall } = hostedOpening(project, target);
  const body = wallBody(wall);
  return {
    x: body.start.x + (wall.end.x - wall.start.x) * opening.position,
    y: body.start.y + (wall.end.y - wall.start.y) * opening.position,
  };
}

/** Openings move along their existing host, never detach into free space. */
export function moveOpeningAlongWall(
  project: Project,
  target: OpeningTarget,
  distance: number,
): Project {
  if (!Number.isFinite(distance)) throw new Error("Abstand muss ein endlicher Meterwert sein.");
  const { opening, wall } = hostedOpening(project, target);
  const position = boundedWindowPosition(
    project,
    wall,
    opening.width,
    opening.position + distance / wallLength(wall),
    target.kind === "door" ? "Tür" : "Fenster",
  );
  return target.kind === "window"
    ? updateWindow(project, target.id, { position })
    : updateDoor(project, target.id, { position });
}

export function moveWindowAlongWall(project: Project, id: string, distance: number): Project {
  return moveOpeningAlongWall(project, { kind: "window", id }, distance);
}

export { parseMetres } from "../../core/units/metres.ts";
