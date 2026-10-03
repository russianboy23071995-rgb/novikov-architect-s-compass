import type { EditSession, EditTarget } from "../../lib/bim/direct-edit.ts";
import type { Project } from "../../lib/bim/model.ts";
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
  return { direction: { x: direction.x / length, y: direction.y / length }, label };
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
