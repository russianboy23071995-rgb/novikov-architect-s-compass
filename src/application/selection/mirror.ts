import { parseMetres } from "../../core/units/metres.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";
import { prepareSelectionTranslation as prepareTranslation } from "./storey-translation.ts";
import { reflectionTransform } from "../../domain/project/prepared-translation.ts";
import { createPointPreview } from "../tools/point-preview.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { SelectionSet } from "./state.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { drawingSnapPolicy, type AnchoredSnapPolicy } from "../tools/snapping.ts";
import type { AnchoredToolInteraction } from "../tools/interaction.ts";
import { assertMovableSelection, sameTargets } from "./move.ts";
import { rotationAngle } from "./rotate.ts";

/**
 * Spiegeln (docs/TASTENKUERZEL.md, B3): two clicks. The first point of the axis, then a point
 * giving its direction; the selection is reflected across that line. Shift rests the axis in
 * absolute 45° steps; the typed angle (Tab) is the axis angle. Joins, hosted openings and every
 * check are those of the move.
 */
export type SelectionMirror = {
  base: Project;
  targets: SelectionSet;
  origin: Point;
  snapping: AnchoredSnapPolicy;
};
const actions = new WeakMap<SelectionMirror, ReturnType<typeof prepareTranslation>>();

/** Axis angle in [0, 180): a line and its reverse mirror alike; micro-degree rounding. */
export function mirrorAxisAngle(degrees: number): number {
  const a = rotationAngle(0, degrees);
  const axis = a < 0 ? a + 180 : a === 180 ? 0 : a;
  const rounded = Math.round(axis * 1e6) / 1e6;
  return rounded === 180 || rounded === 0 ? 0 : rounded;
}
const degreesOf = (from: Point, to: Point) =>
  (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;

/** Fields that cannot follow a mirror refuse it before the gesture starts. */
export function assertMirrorableSelection(
  project: Project,
  targets: SelectionSet,
  visibility?: LayerVisibilityPolicy,
) {
  assertMovableSelection(project, targets, visibility);
  const selected = new Set(targets.map((t) => t.id));
  for (const s of project.storeys)
    for (const w of s.roofWindows ?? [])
      if (selected.has(w.id) && !selected.has(w.roofId))
        throw new Error("Dachflächenfenster spiegeln nur mit ihrem Dach.");
}

export function beginSelectionMirror(
  base: Project,
  targets: SelectionSet,
  origin: Point,
  visibility?: LayerVisibilityPolicy,
): SelectionMirror {
  assertMirrorableSelection(base, targets, visibility);
  if (![origin.x, origin.y].every(Number.isFinite)) throw new Error("Ungültiger Achspunkt.");
  const moving = new Set(targets.map((t) => t.id));
  for (const w of base.storeys.flatMap((s) => s.windows))
    if (moving.has(w.wallId)) moving.add(w.id);
  const anchor = { ...origin };
  const policy = drawingSnapPolicy(anchor);
  const session: SelectionMirror = {
    base,
    targets: targets.map((t) => ({ ...t })),
    origin: anchor,
    snapping: {
      ...policy,
      sources: (refs) =>
        refs.filter((r) => [r, ...(r.dependencies ?? [])].every((s) => !moving.has(s.entityId))),
      // Shift: the axis rests at multiples of 45°, measured from +x.
      resolve: (point, context) => {
        if (!context.angleOrigin) return querySnap(point, context);
        const step = Math.round(degreesOf(anchor, point) / 45) * 45;
        const a = (step * Math.PI) / 180;
        const snapped =
          projectDirection(point, anchor, { x: Math.cos(a), y: Math.sin(a) }) ?? point;
        return {
          point: snapped,
          candidate: {
            kind: "angle",
            worldPoint: snapped,
            guideOrigin: anchor,
            angleDegrees: ((step % 360) + 360) % 360,
            distanceOnScreen: 0,
            sourceEntityId: null,
            sourceFeature: "mirror-45",
            priority: -1,
          },
        };
      },
    },
  };
  actions.set(
    session,
    prepareTranslation(
      base,
      targets.map((t) => t.id),
    ),
  );
  return session;
}

function action(session: SelectionMirror) {
  const prepared = actions.get(session);
  if (!prepared) throw new Error("Spiegelkontext geändert. Erneut beginnen.");
  return prepared;
}
/** The axis angle a pointer gives; null on the first axis point itself. */
export function mirrorAxisAt(session: SelectionMirror, point: Point): number | null {
  if (point.x === session.origin.x && point.y === session.origin.y) return null;
  return mirrorAxisAngle(degreesOf(session.origin, point));
}
/** The full mirrored and validated project for one axis angle. */
export function previewSelectionMirror(
  session: SelectionMirror,
  current: Project,
  targets: SelectionSet,
  axis: number,
  visibility?: LayerVisibilityPolicy,
): Project {
  if (session.base !== current || !sameTargets(session.targets, targets))
    throw new Error("Modell oder Auswahl geändert. Spiegeln erneut beginnen.");
  assertMirrorableSelection(current, targets, visibility);
  return action(session).materializeTransform(current, reflectionTransform(session.origin, axis));
}

export function selectionMirrorInteraction(
  session: SelectionMirror,
  current: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project, axis: number) => void,
  cancel: () => void,
): AnchoredToolInteraction {
  const origin = { ...session.origin };
  const prepared = action(session);
  const assertContext = () => {
    if (session.base !== current || !sameTargets(session.targets, targets))
      throw new Error("Spiegelkontext geändert. Erneut beginnen.");
    assertMirrorableSelection(current, targets, visibility);
  };
  const axisFor = (point: Point) => {
    const axis = mirrorAxisAt(session, point);
    if (axis === null) throw new Error("Zweiter Achspunkt muss vom ersten verschieden sein.");
    return axis;
  };
  const preview = createPointPreview(
    (point) => prepared.evaluateTransform(reflectionTransform(origin, axisFor(point))),
    assertContext,
  );
  const confirm = (point: Point) => {
    preview.clear();
    assertContext();
    const axis = axisFor(point);
    commit(previewSelectionMirror(session, current, targets, axis, visibility), axis);
  };
  /** A point on the axis one metre from its first point, for a typed angle. */
  const pointFor = (degrees: number) => {
    const a = (degrees * Math.PI) / 180;
    return { x: origin.x + Math.cos(a), y: origin.y + Math.sin(a) };
  };
  return {
    identity: session,
    origin: session.origin,
    snapping: session.snapping,
    input: { axisLabel: null, degrees: null, angleOnly: true, angleLabel: "Achswinkel" },
    click: "confirm",
    preview: (angle, _length, aim) => {
      if (angle.trim()) {
        const degrees = parseMetres(angle);
        if (!Number.isFinite(degrees)) throw new Error("Winkel muss eine endliche Zahl sein.");
        // The typed angle is the axis itself, exact: no detour over a rounded point.
        const axis = mirrorAxisAngle(degrees);
        const point = pointFor(axis);
        preview.get(point);
        return { point, degrees: axis, metres: 1 };
      }
      if (!aim) throw new Error("Achswinkel eingeben oder mit der Maus bestimmen.");
      preview.get(aim);
      return {
        point: aim,
        degrees: axisFor(aim),
        metres: Math.hypot(aim.x - origin.x, aim.y - origin.y),
      };
    },
    geometryPreview: { replacedIds: prepared.replacedIds, evaluate: (point) => preview.get(point) },
    validate: (point) => {
      preview.clear();
      assertContext();
      previewSelectionMirror(session, current, targets, axisFor(point), visibility);
    },
    confirm,
    commit: confirm,
    cancel: () => {
      preview.clear();
      cancel();
    },
  };
}
