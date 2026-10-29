import { replacePathVertex, translatePoint } from "../../geometry/primitives/point.ts";
import { moveVertex, type VertexShape } from "../../geometry/polygons/vertex-merge.ts";
import { START_CAPTURE_PX } from "../drawing/path-closure.ts";
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
import { updateRoof } from "../roofs/actions.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
import type { WallSolidReuse } from "../../domain/elements/wall/connections.ts";
import type { ProjectResultMode } from "../../domain/project/owned-snapshot.ts";

export type TransformTarget = { kind: "wall" | "line" | "hatch" | "slab" | "roof"; id: string };

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
  } else if (target.kind === "roof") {
    const roof = storeyOf(project).roofs?.find((item) => item.id === target.id);
    if (roof) return roof.points.map((point) => ({ ...point }));
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
  // A moved roof takes its reference line along; an outline edit keeps it (ROOF_ELEMENT.md, D3).
  if (target.kind === "roof") {
    const roof = storeyOf(project).roofs!.find((r) => r.id === target.id)!;
    return updateRoof(project, target.id, {
      points,
      ...(offset
        ? {
            referenceLine: {
              start: translatePoint(roof.referenceLine.start, offset),
              end: translatePoint(roof.referenceLine.end, offset),
            },
          }
        : {}),
    });
  }
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

/** Vertex list kind of point-edited elements; walls keep their two fixed end points. */
export function vertexShape(target: TransformTarget): VertexShape | null {
  return target.kind === "wall" ? null : target.kind === "line" ? "path" : "ring";
}

/** Targets with an editable vertex list (corner click moves, corner on corner deletes). */
export function isVertexTarget(target: { kind: string }): target is TransformTarget {
  return (
    (target.kind === "line" ||
      target.kind === "hatch" ||
      target.kind === "slab" ||
      target.kind === "roof") &&
    vertexShape(target as TransformTarget) !== null
  );
}

/** A vertex moved onto another vertex of the same element deletes it (POLYGON_REGELN Regel 2). */
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
    (() => {
      const points = editablePoints(project, target),
        shape = vertexShape(target);
      return shape
        ? moveVertex(points, index, position, shape)
        : replacePathVertex(points, index, position);
    })(),
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
  if (target.kind === "hatch" || target.kind === "slab" || target.kind === "roof")
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

/**
 * While a corner moves, every other corner of the same element wins over all other snaps
 * within `radiusPx` on screen (POLYGON_REGELN Regel 2): preview and click then land exactly
 * on it, which deletes the moved corner. Null for other edits or farther cursors.
 */
export function capturedVertex(
  session: {
    base: Project;
    target: { kind: string; id: string };
    action: string;
    index: number | null;
  },
  cursor: Point,
  pixelsPerMetre: number,
  radiusPx = START_CAPTURE_PX,
): Point | null {
  const { target, index } = session;
  if (session.action !== "point" || index === null || !isVertexTarget(target)) return null;
  const points = editablePoints(session.base, target);
  const moved = points[index];
  if (!moved) return null;
  let best: Point | null = null,
    bestDistance = radiusPx;
  for (const point of points) {
    if (point.x === moved.x && point.y === moved.y) continue;
    const distance = Math.hypot(point.x - cursor.x, point.y - cursor.y) * pixelsPerMetre;
    if (distance <= bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return best ? { ...best } : null;
}
