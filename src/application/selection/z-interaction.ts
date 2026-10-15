import { prepareZTranslation } from "./z-translation.ts";
import type { SelectionMove } from "./move.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { AnchoredToolInteraction } from "../tools/interaction.ts";
import { createPointPreview } from "../tools/point-preview.ts";
import { parseMetres } from "../../core/units/metres.ts";

/** The shared input carries signed axial distance in its local y coordinate.
 * This is an input coordinate, never a second editable model or a world XY target. */
export function selectionZInteraction(
  session: SelectionMove,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project) => void,
  cancel: () => void,
): AnchoredToolInteraction {
  const { base, targets } = session;
  const origin = { ...session.origin };
  const action = prepareZTranslation(base, targets, visibility);
  const distance = (p: Point) => {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) throw new Error("Ungültiger Z-Versatz.");
    return p.y - origin.y;
  };
  const preview = createPointPreview(
    (p) => action.evaluate(base, targets, distance(p)),
    () => {},
  );
  const initial = preview.get(origin);
  const confirm = (p: Point) => {
    preview.clear();
    commit(action.materialize(base, targets, distance(p)));
  };
  return {
    identity: {},
    origin,
    snapping: session.snapping,
    axisConstraint: { origin, direction: [0, 0, 1] },
    input: { axisLabel: "Z-Versatz · positiv nach oben, negativ nach unten", degrees: 0 },
    click: "confirm",
    preview: (_angle, length, aim) => {
      const delta = length.trim() ? parseMetres(length) : aim ? distance(aim) : 0;
      if (!Number.isFinite(delta)) throw new Error("Endlicher Z-Versatz erforderlich.");
      const point = { x: origin.x, y: origin.y + delta };
      preview.get(point);
      return { point, metres: delta, degrees: 0 };
    },
    geometryPreview: {
      replacedIds: initial.storeyPatches!.flatMap((p) => [...p.replacedIds]),
      evaluate: preview.get,
    },
    validate: (p) => {
      action.materialize(base, targets, distance(p));
    },
    confirm,
    commit: confirm,
    cancel: () => {
      preview.clear();
      cancel();
    },
  };
}
