import { selectionMovementAxes } from "../input/movement-axes.ts";
import { projectDirection, directionOffset } from "../../geometry/projections/direction.ts";
import { parseMetres } from "../../core/units/metres.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import { prepareSelectionTranslation as prepareTranslation } from "./storey-translation.ts";
import { createPointPreview } from "../tools/point-preview.ts";
import { type Project, type Point } from "../../domain/project/schema.ts";
import { eligibleSelection, targetKey, type SelectionSet } from "./state.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";
import { drawingSnapPolicy, type AnchoredSnapPolicy } from "../tools/snapping.ts";
import { precisionTarget } from "../input/precision.ts";
import type { AnchoredToolInteraction } from "../tools/interaction.ts";

export type SelectionMove = {
  base: Project;
  targets: SelectionSet;
  origin: Point;
  snapping: AnchoredSnapPolicy;
};
export type FixedPlanMoveAxis =
  | "x"
  | "y"
  | Readonly<{
      rawDirection: Readonly<Point>;
      direction: Readonly<Point>;
      label: string;
      degrees: number;
      base: Project;
      target: SelectionSet[number];
      snapping: AnchoredSnapPolicy;
    }>;
const preparations = new WeakMap<
  SelectionMove,
  {
    action: ReturnType<typeof prepareTranslation>;
    origin: Point;
    targets: SelectionSet;
  }
>();
export function sameTargets(a: SelectionSet, b: SelectionSet): boolean {
  const keys = new Set(a.map(targetKey));
  return (
    keys.size === a.length &&
    a.length === b.length &&
    b.every((t) => keys.has(targetKey(t))) &&
    new Set(b.map(targetKey)).size === b.length
  );
}
export function assertMovableSelection(
  project: Project,
  targets: SelectionSet,
  visibility?: LayerVisibilityPolicy,
) {
  if (!targets.length || !sameTargets(targets, eligibleSelection(project, visibility, targets)))
    throw new Error("Auswahl ist nicht mehr sichtbar oder aktuell. Erneut auswählen.");
  // Roofs move with the roof tool (docs/ROOF_ELEMENT.md, D3); never skipped silently.
  if (targets.some((t) => t.kind === "roof"))
    throw new Error("Dächer lassen sich noch nicht verschieben. Dach aus der Auswahl nehmen.");
  const walls = new Set(targets.filter((t) => t.kind === "wall").map((t) => t.id));
  if (
    targets.some(
      (t) =>
        t.kind === "window" &&
        !walls.has(project.storeys.flatMap((s) => s.windows).find((w) => w.id === t.id)!.wallId),
    )
  )
    throw new Error(
      "Fenster für die freie Gruppenbewegung zusammen mit ihrer Wand auswählen. Einzelfenster lassen sich entlang ihrer Wand bewegen.",
    );
}
export function beginSelectionMove(
  base: Project,
  targets: SelectionSet,
  origin: Point,
  visibility?: LayerVisibilityPolicy,
): SelectionMove {
  assertMovableSelection(base, targets, visibility);
  if (!Number.isFinite(origin.x) || !Number.isFinite(origin.y))
    throw new Error("Ungültiger Ursprung.");
  const moving = new Set(targets.map((t) => t.id));
  for (const w of base.storeys.flatMap((s) => s.windows))
    if (moving.has(w.wallId)) moving.add(w.id);
  const anchor = { ...origin };
  const session: SelectionMove = {
    base,
    targets: targets.map((t) => ({ ...t })),
    origin: anchor,
    snapping: {
      ...drawingSnapPolicy(anchor),
      sources: (refs) =>
        refs.filter((r) => [r, ...(r.dependencies ?? [])].every((s) => !moving.has(s.entityId))),
    },
  };
  session.snapping.origin = {
    ...session.snapping.origin,
    directions: selectionMovementAxes(base, targets)
      .filter((a) => a.direction[2] === 0)
      .map((a) => ({ x: a.direction[0], y: a.direction[1] })),
  };
  preparations.set(session, {
    action: prepareTranslation(
      base,
      targets.map((t) => t.id),
    ),
    origin: { ...anchor },
    targets: targets.map((t) => ({ ...t })),
  });
  return session;
}
/** One proposed snapshot: relationships never observe partially translated walls. */
export function previewSelectionMove(
  session: SelectionMove,
  current: Project,
  targets: SelectionSet,
  point: Point,
  visibility?: LayerVisibilityPolicy,
  direction?: Point,
): Project {
  if (session.base !== current || !sameTargets(session.targets, targets))
    throw new Error("Modell oder Auswahl geändert. Bewegung erneut beginnen.");
  assertMovableSelection(current, targets, visibility);
  const prepared = preparation(session);
  return prepared.action.materialize(current, movementOffset(point, prepared.origin, direction));
}
function movementOffset(point: Point, origin: Point, direction?: Point): Point {
  if (!direction) return { x: point.x - origin.x, y: point.y - origin.y };
  const offset = directionOffset(point, origin, direction);
  if (!offset) throw new Error("Ungültige Bewegungsachse oder Zielposition.");
  return offset;
}
function preparation(session: SelectionMove) {
  const prepared = preparations.get(session);
  if (
    !prepared ||
    !sameTargets(prepared.targets, session.targets) ||
    prepared.origin.x !== session.origin.x ||
    prepared.origin.y !== session.origin.y
  )
    throw new Error("Bewegungskontext geaendert. Erneut beginnen.");
  return prepared;
}
/** No full project materialization or validation on the pointer path. */
export function previewSelectionGeometry(
  session: SelectionMove,
  current: Project,
  targets: SelectionSet,
  point: Point,
  visibility?: LayerVisibilityPolicy,
  direction?: Point,
) {
  if (session.base !== current || !sameTargets(session.targets, targets))
    throw new Error("Modell oder Auswahl geändert. Bewegung erneut beginnen.");
  assertMovableSelection(current, targets, visibility);
  const prepared = preparation(session);
  return prepared.action.evaluate(movementOffset(point, prepared.origin, direction));
}

export function selectionMoveInteraction(
  session: SelectionMove,
  current: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project) => void,
  cancel: () => void,
  fixedAxis?: FixedPlanMoveAxis,
): AnchoredToolInteraction {
  if (
    fixedAxis !== undefined &&
    fixedAxis !== "x" &&
    fixedAxis !== "y" &&
    (typeof fixedAxis !== "object" || fixedAxis === null)
  )
    throw new Error("Ungültige feste Bewegungsachse.");
  const origin = { ...session.origin };
  const binding =
    typeof fixedAxis === "object"
      ? {
          rawDirection: Object.freeze({ ...fixedAxis.rawDirection }),
          direction: Object.freeze({ ...fixedAxis.direction }),
          label: fixedAxis.label,
          degrees: fixedAxis.degrees,
          base: fixedAxis.base,
          target: { ...fixedAxis.target },
          snapping: fixedAxis.snapping,
        }
      : null;
  if (binding) {
    const raw = binding.rawDirection,
      unit = binding.direction,
      length = Math.hypot(raw.x, raw.y);
    if (
      ![raw.x, raw.y, unit.x, unit.y, binding.degrees, length].every(Number.isFinite) ||
      length === 0 ||
      unit.x !== raw.x / length ||
      unit.y !== raw.y / length ||
      binding.degrees < 0 ||
      binding.degrees > 360 ||
      typeof binding.label !== "string" ||
      !binding.label.trim() ||
      binding.base !== current ||
      !sameTargets([binding.target], targets) ||
      !binding.snapping?.origin ||
      binding.snapping.origin.point.x !== origin.x ||
      binding.snapping.origin.point.y !== origin.y
    )
      throw new Error("Ungültige feste Bewegungsachse.");
  }
  const direction =
    binding?.direction ??
    (fixedAxis ? (fixedAxis === "x" ? { x: 1, y: 0 } : { x: 0, y: 1 }) : null);
  const rawDirection = binding?.rawDirection;
  const snapDirection = rawDirection ?? direction;
  // Already constrained targets retain their exact snapped/numeric coordinate.
  const constrain = (point: Point) =>
    binding || !direction || (fixedAxis === "x" ? point.y === origin.y : point.x === origin.x)
      ? point
      : projectDirection(point, origin, direction)!;
  const evaluateProject = (point: Point) =>
    previewSelectionMove(session, current, targets, constrain(point), visibility, rawDirection);
  const assertContext = () => {
    if (
      session.base !== current ||
      !sameTargets(session.targets, targets) ||
      session.origin.x !== origin.x ||
      session.origin.y !== origin.y
    )
      throw new Error("Bewegungskontext geaendert. Erneut beginnen.");
    assertMovableSelection(current, targets, visibility);
  };
  const prepared = preparation(session);
  const preview = createPointPreview(
    (point) => previewSelectionGeometry(session, current, targets, point, visibility, rawDirection),
    assertContext,
  );
  const geometry = (point: Point) => preview.get(constrain(point));
  const confirm = (point: Point) => {
    preview.clear();
    assertContext();
    // Materialize and fully validate once, then publish through the guarded history boundary.
    commit(evaluateProject(point));
  };
  return {
    identity: session,
    origin: session.origin,
    snapping: binding
      ? binding.snapping
      : snapDirection
        ? {
            ...session.snapping,
            origin: { ...session.snapping.origin, directions: [snapDirection] },
            resolve: (point, context) =>
              querySnap(point, {
                ...context,
                fixedAxis: { origin, direction: snapDirection },
                orthoOrigin: null,
                angleOrigin: null,
              }),
          }
        : session.snapping,
    input: fixedAxis
      ? {
          axisLabel: binding?.label ?? (fixedAxis === "x" ? "+X (rechts)" : "+Y (oben)"),
          degrees: binding?.degrees ?? (fixedAxis === "x" ? 0 : 90),
        }
      : { axisLabel: null, degrees: null },
    click: "confirm",
    preview: (angle, length, aim) => {
      if (direction) {
        if (!length.trim() && !aim) throw new Error("Länge eingeben oder mit der Maus bestimmen.");
        const metresInput = length.trim() ? parseMetres(length) : null;
        const point =
          metresInput !== null
            ? {
                x: origin.x + metresInput * direction.x,
                y: origin.y + metresInput * direction.y,
              }
            : constrain(aim!);
        const metres = (point.x - origin.x) * direction.x + (point.y - origin.y) * direction.y;
        geometry(point);
        return { point, metres, degrees: binding?.degrees ?? (fixedAxis === "x" ? 0 : 90) };
      }
      const value = precisionTarget(session.origin, aim, angle, length);
      preview.get(value.point);
      return value;
    },
    geometryPreview: { replacedIds: prepared.action.replacedIds, evaluate: geometry },
    validate: (point) => {
      preview.clear();
      assertContext();
      evaluateProject(point);
    },
    confirm,
    commit: confirm,
    cancel: () => {
      preview.clear();
      cancel();
    },
  };
}
