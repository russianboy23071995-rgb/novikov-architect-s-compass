import { prepareZTranslation } from "./z-translation.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { SelectionSet } from "./state.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import type { AnchoredToolInteraction } from "../tools/interaction.ts";
import { drawingSnapPolicy } from "../tools/snapping.ts";
import { parseMetres } from "../../core/units/metres.ts";

/** Axis-local interaction coordinates: x is signed metres along Z, y is zero.
 * These coordinates never enter model geometry; only the scalar delta reaches the action.
 */
export function zMoveInteraction(
  project: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (next: Project) => void,
  cancel: () => void,
): AnchoredToolInteraction {
  const action = prepareZTranslation(project, targets, visibility);
  const origin = { x: 0, y: 0 };
  const delta = (point: Point) => {
    if (point.y !== 0 || !Number.isFinite(point.x)) throw new Error("Ungültiger Z-Versatz.");
    return point.x;
  };
  const evaluate = (point: Point) => action.evaluate(project, targets, delta(point));
  const confirm = (point: Point) => commit(action.materialize(project, targets, delta(point)));
  return {
    identity: action,
    origin,
    snapping: drawingSnapPolicy(origin),
    input: { axisLabel: "Z · Länge mit Vorzeichen (+ oben / − unten)", degrees: null },
    click: "confirm",
    preview: (_angle, length, aim) => {
      const metres = length.trim() ? parseMetres(length) : aim ? delta(aim) : 0;
      const point = { x: metres, y: 0 };
      evaluate(point);
      return { point, degrees: 0, metres };
    },
    geometryPreview: {
      replacedIds: action
        .evaluate(project, targets, 0)
        .storeyPatches!.flatMap((p) => p.replacedIds),
      evaluate,
    },
    validate: (point) => {
      action.materialize(project, targets, delta(point));
    },
    confirm,
    commit: confirm,
    cancel,
  };
}
