import { previewContourEdge } from "../../application/direct-edit/contour.ts";
import type { Point, Project } from "./model.ts";
import { wallLength } from "./model.ts";
import { endpointAtOffsetTarget } from "../../geometry/primitives/offset-endpoint.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import {
  editablePoints,
  moveElement,
  moveElementPoint,
  moveWindowAlongWall,
} from "./transforms.ts";
export type EditAction = "point" | "stretch" | "move" | "axis" | "x" | "y" | "insert" | "edge";
export type EditTarget = { kind: "wall" | "line" | "window" | "hatch"; id: string };
export type EditSession = {
  base: Project;
  target: EditTarget;
  action: EditAction;
  index: number | null;
  anchor: Point;
};

export function editAnchor(project: Project, target: EditTarget): Point {
  if (target.kind !== "window")
    return editablePoints(project, { kind: target.kind, id: target.id })[0]!;
  const opening = project.storey.windows.find((item) => item.id === target.id);
  const wall = project.storey.walls.find((item) => item.id === opening?.wallId);
  if (!opening || !wall) throw new Error("Fenster nicht gefunden.");
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * opening.position,
    y: wall.start.y + (wall.end.y - wall.start.y) * opening.position,
  };
}

/** Always derive the preview from the pinned original, never from the preceding preview. */
export function editAtPointer(session: EditSession, current: Project, pointer: Point): Project {
  if (current !== session.base)
    throw new Error("Das Modell wurde geändert. Bearbeitung erneut starten.");
  if (session.action === "insert" || session.action === "edge")
    return previewContourEdge(session, pointer);
  const { base, target, index, action, anchor } = session;
  const delta = { x: pointer.x - anchor.x, y: pointer.y - anchor.y };
  if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))
    throw new Error("Ungültige Zielposition.");
  if (target.kind === "window") {
    const opening = base.storey.windows.find((item) => item.id === target.id)!;
    const wall = base.storey.walls.find((item) => item.id === opening.wallId)!;
    return moveWindowAlongWall(
      base,
      target.id,
      (delta.x * (wall.end.x - wall.start.x) + delta.y * (wall.end.y - wall.start.y)) /
        wallLength(wall),
    );
  }
  const entity = { kind: target.kind, id: target.id };
  const points = editablePoints(base, entity);
  const i = index ?? 0;
  if (!Number.isInteger(i) || !points[i]) throw new Error("Ungültiger Griff.");
  const next = points[i === 0 ? 1 : i - 1]!;
  const vector = { x: points[i]!.x - next.x, y: points[i]!.y - next.y };
  if (action === "axis" || action === "stretch") {
    const length = Math.hypot(vector.x, vector.y);
    const distance = (delta.x * vector.x + delta.y * vector.y) / length;
    delta.x = (vector.x / length) * distance;
    delta.y = (vector.y / length) * distance;
    if (action === "stretch" && length + distance <= 1e-9)
      throw new Error("Der Punkt darf seinen Nachbarpunkt nicht überqueren.");
  }
  if (action === "x") delta.y = 0;
  if (action === "y") delta.x = 0;
  if (action === "point" || action === "stretch") {
    if (index === null) throw new Error("Zuerst einen Punktgriff anklicken.");
    if (target.kind === "wall" && action === "point") {
      const wall = base.storey.walls.find((item) => item.id === target.id)!;
      const length = Math.hypot(vector.x, vector.y);
      for (const side of [-1, 1]) {
        const offset = (side * wall.thickness) / 2;
        const corner = {
          x: points[i]!.x - (vector.y / length) * offset,
          y: points[i]!.y + (vector.x / length) * offset,
        };
        if (pointsCompatible(anchor, corner)) {
          // Preserve an unchanged gesture exactly, including large-coordinate models.
          const position =
            delta.x === 0 && delta.y === 0
              ? points[i]!
              : endpointAtOffsetTarget(next, pointer, offset);
          return moveElementPoint(base, entity, i, position);
        }
      }
    }
    return moveElementPoint(base, entity, i, {
      x: points[i]!.x + delta.x,
      y: points[i]!.y + delta.y,
    });
  }
  return moveElement(base, entity, delta);
}
