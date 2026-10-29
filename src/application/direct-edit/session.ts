import { translatePoint } from "../../geometry/primitives/point.ts";
import { directionOffset, stretchOffset } from "../../geometry/projections/direction.ts";
import {
  createProjectSnapshot,
  type ProjectResultMode,
} from "../../domain/project/owned-snapshot.ts";
import type { WallSolidReuse } from "../../domain/elements/wall/connections.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { previewContourOffset } from "./offset.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { previewContourEdge } from "./contour.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
import { wallLength } from "../../domain/project/schema.ts";
import { endpointAtOffsetTarget } from "../../geometry/primitives/offset-endpoint.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import {
  editablePoints,
  moveElement,
  moveElementPoint,
  hostedOpening,
  moveOpeningAlongWall,
  openingCentre,
} from "./transforms.ts";
export type EditAction =
  "point" | "stretch" | "move" | "axis" | "x" | "y" | "insert" | "edge" | "offset";
export type EditTarget = {
  kind: "wall" | "line" | "window" | "door" | "hatch" | "slab";
  id: string;
};
export type EditSession = {
  base: Project;
  target: EditTarget;
  action: EditAction;
  index: number | null;
  anchor: Point;
};

export function editAnchor(project: Project, target: EditTarget): Point {
  if (target.kind === "window" || target.kind === "door")
    return openingCentre(project, { kind: target.kind, id: target.id });
  return editablePoints(project, { kind: target.kind, id: target.id })[0]!;
}

/** Always derive the preview from the pinned original, never from the preceding preview. */
export function editAtPointer(
  session: EditSession,
  current: Project,
  pointer: Point,
  reuse?: WallSolidReuse,
): Project {
  return evaluatePointer(session, current, pointer, reuse, "mutable");
}

/** Same action and full validation, with an immutable result for prepared consumers. */
export function editAtPointerSnapshot(
  session: EditSession,
  current: Project,
  pointer: Point,
  reuse?: WallSolidReuse,
): Project {
  return createProjectSnapshot(evaluatePointer(session, current, pointer, reuse, "owned"));
}

function evaluatePointer(
  session: EditSession,
  current: Project,
  pointer: Point,
  reuse: WallSolidReuse | undefined,
  resultMode: ProjectResultMode,
): Project {
  if (current !== session.base)
    throw new Error("Das Modell wurde geändert. Bearbeitung erneut starten.");
  if (session.action === "offset") return previewContourOffset(session, pointer);
  if (session.action === "insert" || session.action === "edge")
    return previewContourEdge(session, pointer);
  const { base, target, index, action, anchor } = session;
  const delta = { x: pointer.x - anchor.x, y: pointer.y - anchor.y };
  if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))
    throw new Error("Ungültige Zielposition.");
  if (target.kind === "window" || target.kind === "door") {
    const opening = { kind: target.kind, id: target.id };
    const { wall } = hostedOpening(base, opening);
    return moveOpeningAlongWall(
      base,
      opening,
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
  if (action === "axis") {
    const offset = directionOffset(pointer, anchor, vector);
    if (!offset) throw new Error("Ungültige Bewegungsachse oder Zielposition.");
    Object.assign(delta, offset);
  }
  if (action === "stretch") {
    Object.assign(delta, stretchOffset(pointer, anchor, vector));
  }
  if (action === "x") delta.y = 0;
  if (action === "y") delta.x = 0;
  if (action === "point" || action === "stretch") {
    if (index === null) throw new Error("Zuerst einen Punktgriff anklicken.");
    if (target.kind === "wall" && action === "point") {
      const wall = storeyOf(base).walls.find((item) => item.id === target.id)!;
      const length = Math.hypot(vector.x, vector.y);
      for (const side of [-1, 1]) {
        const offset = wallBody(wall).sideOffset(side) * (i === 0 ? -1 : 1);
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
          return moveElementPoint(base, entity, i, position, reuse, resultMode);
        }
      }
    }
    return moveElementPoint(base, entity, i, translatePoint(points[i]!, delta), reuse, resultMode);
  }
  return moveElement(base, entity, delta);
}
