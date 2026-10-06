import type { ElementTarget } from "../selection/target.ts";
import type { ToolInteraction } from "./interaction.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { numericMoveAxis, previewMovementInput } from "../direct-edit/numeric.ts";
import { previewEdit } from "../direct-edit/controller.ts";
import { previewDrawingInput } from "../drawing/actions.ts";
import { drawingSnapPolicy } from "./snapping.ts";
import type { ToolSnapPolicy } from "./snapping.ts";
import {
  editOriginReference,
  editSnapReferences,
  resolveEditSnap,
} from "../direct-edit/snapping.ts";
const editPolicies = new WeakMap<EditSession, ToolSnapPolicy>();
function editSnapPolicy(session: EditSession): ToolSnapPolicy {
  let policy = editPolicies.get(session);
  if (!policy) {
    policy = {
      origin: editOriginReference(session),
      sources: (refs) => editSnapReferences(session, refs),
      resolve: (point, context) => resolveEditSnap(session, point, context),
    };
    editPolicies.set(session, policy);
  }
  return policy;
}
export function editInteraction(
  session: EditSession,
  current: Project,
  selection: ElementTarget | null,
  commit: (point: Point) => void,
  cancel: () => void,
): ToolInteraction {
  const axis = numericMoveAxis(session);
  const polar =
    ["move", "point", "insert"].includes(session.action) && session.target.kind !== "window";
  return {
    identity: session,
    snapping: editSnapPolicy(session),
    origin: session.anchor,
    input: axis
      ? { axisLabel: axis.label, degrees: axis.degrees }
      : polar
        ? { axisLabel: null, degrees: null }
        : null,
    click: "confirm",
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
  path?: readonly Point[],
): ToolInteraction {
  return {
    identity: origin,
    snapping: drawingSnapPolicy(origin, path),
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
