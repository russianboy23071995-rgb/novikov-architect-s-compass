import { parseMetres } from "../../core/units/metres.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";
import { prepareSelectionTranslation as prepareTranslation } from "./storey-translation.ts";
import { rotationTransform } from "../../domain/project/prepared-translation.ts";
import { createPointPreview } from "../tools/point-preview.ts";
import type { Project, Point } from "../../domain/project/schema.ts";
import type { SelectionSet } from "./state.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { drawingSnapPolicy, type AnchoredSnapPolicy } from "../tools/snapping.ts";
import type { AnchoredToolInteraction } from "../tools/interaction.ts";
import { assertMovableSelection, sameTargets } from "./move.ts";

/**
 * Drehen (docs/TASTENKUERZEL.md, B2): three clicks. The pivot, then the reference direction,
 * then the target direction; the selection turns by the angle between them, counterclockwise
 * positive. Shift rests the target in 45° steps from the reference. The typed angle (Tab) is
 * the turn itself. Joins, hosted openings and every check are those of the move.
 */
export type SelectionRotation = {
  base: Project;
  targets: SelectionSet;
  pivot: Point;
  /** Direction of the reference click in degrees (0 = +x). */
  reference: number;
  /** Distance of the reference click: the radius for a typed angle. */
  radius: number;
  snapping: AnchoredSnapPolicy;
};
const actions = new WeakMap<SelectionRotation, ReturnType<typeof prepareTranslation>>();

const degreesOf = (from: Point, to: Point) =>
  (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
/** Turn in (-180, 180]; micro-degree rounding keeps typed and snapped quarter turns exact. */
export function rotationAngle(reference: number, target: number): number {
  let turn = (((target - reference) % 360) + 360) % 360;
  if (turn > 180) turn -= 360;
  const rounded = Math.round(turn * 1e6) / 1e6;
  return rounded === 0 ? 0 : rounded;
}

/** Turn fields that cannot follow an angle refuse it before the gesture starts. */
export function assertRotatableSelection(
  project: Project,
  targets: SelectionSet,
  visibility?: LayerVisibilityPolicy,
) {
  assertMovableSelection(project, targets, visibility);
  const selected = new Set(targets.map((t) => t.id));
  for (const s of project.storeys)
    for (const w of s.roofWindows ?? [])
      if (selected.has(w.id) && !selected.has(w.roofId))
        throw new Error("Dachflächenfenster drehen nur mit ihrem Dach.");
}

export function beginSelectionRotation(
  base: Project,
  targets: SelectionSet,
  pivot: Point,
  referencePoint: Point,
  visibility?: LayerVisibilityPolicy,
): SelectionRotation {
  assertRotatableSelection(base, targets, visibility);
  if (![pivot.x, pivot.y, referencePoint.x, referencePoint.y].every(Number.isFinite))
    throw new Error("Ungültiger Drehpunkt.");
  const radius = Math.hypot(referencePoint.x - pivot.x, referencePoint.y - pivot.y);
  if (radius === 0) throw new Error("Bezugsrichtung muss vom Drehpunkt verschieden sein.");
  const moving = new Set(targets.map((t) => t.id));
  for (const w of base.storeys.flatMap((s) => s.windows))
    if (moving.has(w.wallId)) moving.add(w.id);
  const anchor = { ...pivot };
  const reference = degreesOf(anchor, referencePoint);
  const policy = drawingSnapPolicy(anchor);
  const session: SelectionRotation = {
    base,
    targets: targets.map((t) => ({ ...t })),
    pivot: anchor,
    reference,
    radius,
    snapping: {
      ...policy,
      sources: (refs) =>
        refs.filter((r) => [r, ...(r.dependencies ?? [])].every((s) => !moving.has(s.entityId))),
      // Shift: the target direction rests at the reference plus multiples of 45°.
      resolve: (point, context) => {
        if (!context.angleOrigin) return querySnap(point, context);
        const step = Math.round(rotationAngle(reference, degreesOf(anchor, point)) / 45) * 45;
        const a = ((reference + step) * Math.PI) / 180;
        const direction = { x: Math.cos(a), y: Math.sin(a) };
        const snapped = projectDirection(point, anchor, direction) ?? point;
        return {
          point: snapped,
          candidate: {
            kind: "angle",
            worldPoint: snapped,
            guideOrigin: anchor,
            angleDegrees: (((reference + step) % 360) + 360) % 360,
            distanceOnScreen: 0,
            sourceEntityId: null,
            sourceFeature: "rotate-45",
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

function action(session: SelectionRotation) {
  const prepared = actions.get(session);
  if (!prepared) throw new Error("Drehkontext geändert. Erneut beginnen.");
  return prepared;
}
/** The turn a pointer gives; null on the pivot itself. */
export function rotationAt(session: SelectionRotation, point: Point): number | null {
  if (point.x === session.pivot.x && point.y === session.pivot.y) return null;
  return rotationAngle(session.reference, degreesOf(session.pivot, point));
}
/** The full turned and validated project for one angle. */
export function previewSelectionRotation(
  session: SelectionRotation,
  current: Project,
  targets: SelectionSet,
  degrees: number,
  visibility?: LayerVisibilityPolicy,
): Project {
  if (session.base !== current || !sameTargets(session.targets, targets))
    throw new Error("Modell oder Auswahl geändert. Drehen erneut beginnen.");
  assertRotatableSelection(current, targets, visibility);
  return action(session).materializeTransform(current, rotationTransform(session.pivot, degrees));
}

export function selectionRotationInteraction(
  session: SelectionRotation,
  current: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project, degrees: number) => void,
  cancel: () => void,
): AnchoredToolInteraction {
  const pivot = { ...session.pivot };
  const prepared = action(session);
  const assertContext = () => {
    if (session.base !== current || !sameTargets(session.targets, targets))
      throw new Error("Drehkontext geändert. Erneut beginnen.");
    assertRotatableSelection(current, targets, visibility);
  };
  const angleFor = (point: Point) => {
    const degrees = rotationAt(session, point);
    if (degrees === null) throw new Error("Zielrichtung muss vom Drehpunkt verschieden sein.");
    return degrees;
  };
  const preview = createPointPreview(
    (point) => prepared.evaluateTransform(rotationTransform(pivot, angleFor(point))),
    assertContext,
  );
  const confirm = (point: Point) => {
    preview.clear();
    assertContext();
    const degrees = angleFor(point);
    commit(previewSelectionRotation(session, current, targets, degrees, visibility), degrees);
  };
  /** The point on the reference circle for a typed turn. */
  const pointFor = (degrees: number) => {
    const a = ((session.reference + degrees) * Math.PI) / 180;
    return {
      x: pivot.x + session.radius * Math.cos(a),
      y: pivot.y + session.radius * Math.sin(a),
    };
  };
  return {
    identity: session,
    origin: session.pivot,
    snapping: session.snapping,
    input: { axisLabel: null, degrees: null, angleOnly: true },
    click: "confirm",
    preview: (angle, _length, aim) => {
      if (angle.trim()) {
        const degrees = parseMetres(angle);
        if (!Number.isFinite(degrees)) throw new Error("Winkel muss eine endliche Zahl sein.");
        const point = pointFor(degrees);
        preview.get(point);
        return { point, degrees: angleFor(point), metres: session.radius };
      }
      if (!aim) throw new Error("Winkel eingeben oder mit der Maus bestimmen.");
      preview.get(aim);
      return {
        point: aim,
        degrees: angleFor(aim),
        metres: Math.hypot(aim.x - pivot.x, aim.y - pivot.y),
      };
    },
    geometryPreview: { replacedIds: prepared.replacedIds, evaluate: (point) => preview.get(point) },
    validate: (point) => {
      preview.clear();
      assertContext();
      previewSelectionRotation(session, current, targets, angleFor(point), visibility);
    },
    confirm,
    commit: confirm,
    cancel: () => {
      preview.clear();
      cancel();
    },
  };
}
