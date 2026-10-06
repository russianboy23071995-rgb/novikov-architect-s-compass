import { previewHatch } from "../hatches/actions.ts";
import { updateLine, updateWall, updateWindow, wallLength } from "../../lib/bim/model.ts";
import type { Point, Project } from "../../lib/bim/model.ts";

export type TransformTarget = { kind: "wall" | "line" | "hatch"; id: string };

export function editablePoints(project: Project, target: TransformTarget): Point[] {
  if (target.kind === "wall") {
    const wall = project.storey.walls.find((item) => item.id === target.id);
    if (wall) return [{ ...wall.start }, { ...wall.end }];
  } else if (target.kind === "hatch") {
    const hatch = project.storey.hatches.find((item) => item.id === target.id);
    if (hatch) return hatch.points.map((point) => ({ ...point }));
  } else {
    const line = project.storey.lines?.find((item) => item.id === target.id);
    if (line) return line.points.map((point) => ({ ...point }));
  }
  throw new Error("Das ausgewählte Element existiert nicht mehr.");
}

function applyPoints(
  project: Project,
  target: TransformTarget,
  points: Point[],
  intent: "reshape" | "move" = "reshape",
): Project {
  if (target.kind === "hatch")
    return previewHatch(project, project, {
      projectId: project.id,
      kind: "update",
      id: target.id,
      changes: { points },
    });
  return target.kind === "wall"
    ? updateWall(project, target.id, { start: points[0]!, end: points[1]! }, intent)
    : updateLine(project, target.id, { points });
}

/** Translation is atomic; hosted windows retain their relative wall positions. */
export function moveElement(project: Project, target: TransformTarget, offset: Point): Project {
  if (!Number.isFinite(offset.x) || !Number.isFinite(offset.y))
    throw new Error("Verschiebung muss endliche Meterwerte enthalten.");
  return applyPoints(
    project,
    target,
    editablePoints(project, target).map((p) => ({ x: p.x + offset.x, y: p.y + offset.y })),
    "move",
  );
}

export function moveElementPoint(
  project: Project,
  target: TransformTarget,
  index: number,
  position: Point,
): Project {
  const points = editablePoints(project, target);
  if (!Number.isInteger(index) || index < 0 || index >= points.length)
    throw new Error("Ungültiger Punkt.");
  // A closed polyline represents its shared first/last vertex twice; keep closure.
  const last = points.length - 1;
  const closed =
    points.length > 2 && points[0]!.x === points[last]!.x && points[0]!.y === points[last]!.y;
  points[index] = { ...position };
  if (closed && (index === 0 || index === last)) {
    points[0] = { ...position };
    points[last] = { ...position };
  }
  return applyPoints(project, target, points);
}

/** Set the terminal segment's length, retaining its direction and the other endpoint. */
export function stretchEndpoint(
  project: Project,
  target: TransformTarget,
  endpoint: "start" | "end",
  length: number,
): Project {
  if (!Number.isFinite(length) || length <= 0) throw new Error("Länge muss größer als null sein.");
  if (target.kind === "hatch")
    throw new Error("Geschlossene Schraffuren haben keine freien Endpunkte.");
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

/** Windows move along their existing host, never detach into free space. */
export function moveWindowAlongWall(project: Project, id: string, distance: number): Project {
  if (!Number.isFinite(distance)) throw new Error("Abstand muss ein endlicher Meterwert sein.");
  const window = project.storey.windows.find((item) => item.id === id);
  const wall = project.storey.walls.find((item) => item.id === window?.wallId);
  if (!window || !wall) throw new Error("Fenster oder zugehörige Wand fehlt.");
  return updateWindow(project, id, { position: window.position + distance / wallLength(wall) });
}

export { parseMetres } from "../../core/units/metres.ts";
