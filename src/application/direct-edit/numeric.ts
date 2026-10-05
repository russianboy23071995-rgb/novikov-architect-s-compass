import { boundedEdgeTarget } from "./contour.ts";
import type { ElementTarget } from "../selection/target.ts";
import { resolvePolarInput } from "../../constraints/input/polar.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { parseMetres } from "../../core/units/metres.ts";
import { precisionTarget } from "../input/precision.ts";
import { editDirection } from "./snapping.ts";
import { previewEdit } from "./controller.ts";

/** Input adapter: resolves metres to the same pinned pointer target as mouse editing. */
export function numericMoveAxis(session: EditSession) {
  if (
    session.target.kind === "window" ||
    !["x", "y", "axis", "stretch", "edge"].includes(session.action)
  )
    return null;
  if (session.action === "stretch" && session.index === null) return null;
  const direction = editDirection(session)!;
  const length = Math.hypot(direction.x, direction.y);
  if (!Number.isFinite(length) || length === 0) return null;
  const i = session.index ?? 0;
  const label =
    session.action === "edge"
      ? "Versatz senkrecht zur Seite"
      : session.action === "stretch"
        ? "+ verlängert · − verkürzt"
        : session.action === "x"
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
  selection: ElementTarget | null,
  text: string,
) {
  const axis = numericMoveAxis(session);
  if (!axis)
    throw new Error("Streckeneingabe benötigt eine Bewegungsachse oder einen Streckgriff.");
  const metres = parseMetres(text);
  if (!Number.isFinite(metres))
    throw new Error("Bitte eine endliche Strecke in Metern eingeben, z. B. -1,25.");
  const point = boundedEdgeTarget(session, {
    x: session.anchor.x + metres * axis.direction.x,
    y: session.anchor.y + metres * axis.direction.y,
  });
  return { point, project: previewEdit(session, project, selection, point) };
}

export function previewMovementInput(
  session: EditSession,
  project: Project,
  selection: ElementTarget | null,
  angleText: string,
  lengthText: string,
  aim: Point | null,
) {
  if (session.action !== "move" && session.action !== "point" && session.action !== "insert") {
    const axis = numericMoveAxis(session);
    if (!axis) throw new Error("Keine numerische Bewegungsachse verfügbar.");
    const result = previewNumericMove(session, project, selection, lengthText);
    const degrees = resolvePolarInput({ x: 0, y: 0 }, axis.direction, null, 0).degrees;
    const metres =
      (result.point.x - session.anchor.x) * axis.direction.x +
      (result.point.y - session.anchor.y) * axis.direction.y;
    const capped = session.action === "edge" && Math.abs(metres - parseMetres(lengthText)) > 1e-9;
    return {
      ...result,
      degrees,
      metres,
      ...(capped ? { notice: `Geometrische Grenze · ${metres.toFixed(4)} m` } : {}),
    };
  }
  if (session.target.kind === "window") throw new Error("Fenster bleiben an ihre Wand gebunden.");
  const result = precisionTarget(session.anchor, aim, angleText, lengthText);
  return { ...result, project: previewEdit(session, project, selection, result.point) };
}

export function movementDirection(session: EditSession, aim: Point) {
  return resolvePolarInput(session.anchor, aim, null, 0).degrees;
}
