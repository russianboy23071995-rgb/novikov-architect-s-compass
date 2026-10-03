import type { ToolInteraction } from "./interaction.ts";
import type { EditSession, EditTarget } from "../../lib/bim/direct-edit.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { numericMoveAxis, previewMovementInput } from "../direct-edit/numeric.ts";
import { previewEdit } from "../direct-edit/controller.ts";
import { previewDrawingInput } from "../drawing/actions.ts";
export function editInteraction(
  session: EditSession,
  current: Project,
  selection: EditTarget | null,
  commit: (point: Point) => void,
  cancel: () => void,
): ToolInteraction {
  const axis = numericMoveAxis(session);
  const polar = ["move", "point"].includes(session.action) && session.target.kind !== "window";
  return {
    identity: session,
    origin: session.anchor,
    input: axis
      ? { axisLabel: axis.label, degrees: axis.degrees }
      : polar
        ? { axisLabel: null, degrees: null }
        : null,
    click: session.action === "move" && polar ? "direction" : "confirm",
    preview: (angle, length, aim) =>
      previewMovementInput(session, current, selection, angle, length, aim),
    validate: (point) => {
      previewEdit(session, current, selection, point);
    },
    commit,
    cancel,
  };
}
export function drawingInteraction(
  base: Project,
  current: Project,
  origin: Point,
  commit: (point: Point) => void,
  cancel: () => void,
): ToolInteraction {
  return {
    identity: origin,
    origin,
    input: { axisLabel: null, degrees: null },
    click: "confirm",
    preview: (angle, length, aim) => previewDrawingInput(base, current, origin, aim, angle, length),
    validate: (point) => {
      previewDrawingInput(base, current, origin, point, "", "");
    },
    commit,
    cancel,
  };
}
