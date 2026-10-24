import { previewWallChain, type WallChain } from "../drawing/wall-chain.ts";
import { findTAxisReference, queryTAxisSnap } from "../walls/t-axis-snap.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
import type { ElementTarget } from "../selection/target.ts";
import type { AnchoredToolInteraction } from "./interaction.ts";
import type { EditSession } from "../../lib/bim/direct-edit.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { numericMoveAxis, previewMovementInput } from "../direct-edit/numeric.ts";
import { previewEdit } from "../direct-edit/controller.ts";
import { previewDrawingInput } from "../drawing/actions.ts";
import { drawingSnapPolicy } from "./snapping.ts";
import type { ToolSnapPolicy, AnchoredSnapPolicy } from "./snapping.ts";
import {
  editOriginReference,
  editSnapReferences,
  resolveEditSnap,
} from "../direct-edit/snapping.ts";
const editPolicies = new WeakMap<EditSession, AnchoredSnapPolicy>();
function editSnapPolicy(session: EditSession): AnchoredSnapPolicy {
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
/** Pin the existing edit-axis query and snap policy for shared selection movement. */
export function editMovementAxis(session: EditSession) {
  if (session.action !== "axis" || !["line", "hatch"].includes(session.target.kind)) return null;
  const pinned = Object.freeze({
    ...session,
    target: Object.freeze({ ...session.target }),
    anchor: Object.freeze({ ...session.anchor }),
  });
  const axis = numericMoveAxis(pinned);
  if (!axis) return null;
  const policy = editSnapPolicy(pinned);
  const snapping = Object.freeze({
    ...policy,
    origin: Object.freeze({
      ...policy.origin,
      point: Object.freeze({ ...policy.origin.point }),
      directions: Object.freeze(
        (policy.origin.directions ?? []).map((direction) => Object.freeze({ ...direction })),
      ),
    }),
  });
  return { ...axis, base: pinned.base, target: pinned.target, snapping };
}
export function editInteraction(
  session: EditSession,
  current: Project,
  selection: ElementTarget | null,
  commit: (point: Point, candidate?: SnapCandidate | null) => void,
  cancel: () => void,
): AnchoredToolInteraction {
  const axis = numericMoveAxis(session);
  const polar =
    ["move", "point", "insert"].includes(session.action) &&
    session.target.kind !== "window" &&
    session.target.kind !== "door";
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
): AnchoredToolInteraction {
  return {
    ...(wall
      ? {
          previewProject: (point: Point, candidate?: SnapCandidate | null) =>
            previewWallChain(wall, current, point, candidate),
        }
      : {}),
    identity: origin,
    snapping: wall ? wallDrawingPolicy(origin, path) : drawingSnapPolicy(origin, path),
    origin,
    input: { axisLabel: null, degrees: null },
    click: "confirm",
    preview: (angle, length, aim) => previewDrawingInput(base, current, origin, aim, angle, length),
    validate: (point, candidate) => {
      previewDrawingInput(base, current, origin, point, "", "");
      if (wall) previewWallChain(wall, current, point, candidate);
    },
    commit,
    cancel,
  };
}

/** Before the first click there is no construction origin to pin. */
export const wallStartSnapPolicy: ToolSnapPolicy = {
  origin: null,
  sources: (refs) => [...refs],
  resolve: (cursor, context) =>
    queryTAxisSnap(cursor, context, findTAxisReference(cursor, null, cursor, context)),
};

const wallPolicies = new WeakMap<object, AnchoredSnapPolicy>();
function wallDrawingPolicy(origin: Point, path?: readonly Point[]): AnchoredSnapPolicy {
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
