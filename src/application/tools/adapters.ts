import { appendWallChain, type WallChain } from "../drawing/wall-chain.ts";
import { findTAxisReference, queryTAxisSnap } from "../walls/t-axis-snap.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
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
  commit: (point: Point, candidate?: SnapCandidate | null) => void,
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
    validate: (point, candidate) => {
      previewEdit(session, current, selection, point, candidate);
    },
    commit,
    cancel,
  };
}
export function drawingInteraction(
  base: Project,
  current: Project,
  origin: Point,
  commit: (point: Point, candidate?: SnapCandidate | null) => void,
  cancel: () => void,
  path?: readonly Point[],
  wall?: WallChain,
): ToolInteraction {
  return {
    identity: origin,
    snapping: wall ? wallDrawingPolicy(origin, path) : drawingSnapPolicy(origin, path),
    origin,
    input: { axisLabel: null, degrees: null },
    click: "confirm",
    preview: (angle, length, aim) => previewDrawingInput(base, current, origin, aim, angle, length),
    validate: (point, candidate) => {
      previewDrawingInput(base, current, origin, point, "", "");
      if (wall) {
        let id = "@wall-preview";
        while (wall.preview.storey.walls.some((w) => w.id === id)) id += "-";
        appendWallChain(wall, current, id, point, candidate);
      }
    },
    commit,
    cancel,
  };
}

const wallPolicies = new WeakMap<object, ToolSnapPolicy>();
function wallDrawingPolicy(origin: Point, path?: readonly Point[]): ToolSnapPolicy {
  const key = path ?? origin;
  let policy = wallPolicies.get(key);
  if (!policy) {
    policy = {
      ...drawingSnapPolicy(origin, path),
      resolve: (cursor, context) =>
        queryTAxisSnap(cursor, context, findTAxisReference(origin, null, cursor, context)),
    };
    wallPolicies.set(key, policy);
  }
  return policy;
}
