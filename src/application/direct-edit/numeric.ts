import { resolvePolarInput } from "../../constraints/input/polar.ts";
import type { EditSession, EditTarget } from "../../lib/bim/direct-edit.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { parseMetres } from "../../lib/bim/transforms.ts";
import { editDirection } from "./snapping.ts";
import { previewEdit } from "./controller.ts";

/** Input adapter: resolves metres to the same pinned pointer target as mouse editing. */
export function numericMoveAxis(session: EditSession) {
  if (session.target.kind === "window" || !["x", "y", "axis"].includes(session.action)) return null;
  const direction = editDirection(session)!;
  const length = Math.hypot(direction.x, direction.y);
  if (!Number.isFinite(length) || length === 0) return null;
  const i = session.index ?? 0;
  const label =
    session.action === "x"
      ? "+X (rechts)"
      : session.action === "y"
        ? "+Y (oben)"
        : "+ Richtung Punkt " + (i === 0 ? 2 : i) + " → " + (i + 1);
  return {
    direction: { x: direction.x / length, y: direction.y / length },
    label,
    degrees: resolvePolarInput({ x: 0, y: 0 }, direction, null, 0).degrees,
  };
}

export function previewNumericMove(
  session: EditSession,
  project: Project,
  selection: EditTarget | null,
  text: string,
) {
  const axis = numericMoveAxis(session);
  if (!axis)
    throw new Error("Streckeneingabe ist nur für ganze Elemente auf X/Y/Elementachse verfügbar.");
  const metres = parseMetres(text);
  if (!Number.isFinite(metres))
    throw new Error("Bitte eine endliche Strecke in Metern eingeben, z. B. -1,25.");
  const point = {
    x: session.anchor.x + metres * axis.direction.x,
    y: session.anchor.y + metres * axis.direction.y,
  };
  return { point, project: previewEdit(session, project, selection, point) };
}

export function previewMovementInput(
  session: EditSession,
  project: Project,
  selection: EditTarget | null,
  angleText: string,
  lengthText: string,
  aim: Point | null,
) {
  if (session.action !== "move") {
    const axis = numericMoveAxis(session);
    if (!axis) throw new Error("Keine numerische Bewegungsachse verfügbar.");
    const result = previewNumericMove(session, project, selection, lengthText);
    const degrees = resolvePolarInput({ x: 0, y: 0 }, axis.direction, null, 0).degrees;
    return { ...result, degrees, metres: parseMetres(lengthText) };
  }
  if (session.target.kind === "window") throw new Error("Fenster bleiben an ihre Wand gebunden.");
  const parse = (text: string, label: string) => {
    if (!text.trim()) return null;
    const value = parseMetres(text);
    if (!Number.isFinite(value)) throw new Error(label + " muss eine endliche Zahl sein.");
    return value;
  };
  const result = resolvePolarInput(
    session.anchor,
    aim,
    parse(angleText, "Winkel"),
    parse(lengthText, "Länge"),
  );
  return { ...result, project: previewEdit(session, project, selection, result.point) };
}

export function movementDirection(session: EditSession, aim: Point) {
  return resolvePolarInput(session.anchor, aim, null, 0).degrees;
}
