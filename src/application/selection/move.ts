import { validateProject, type Project, type Point } from "../../domain/project/schema.ts";
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
  if (targets.some((t) => t.kind === "reference"))
    throw new Error("Bildreferenz-Bewegung folgt im nächsten Schritt.");
  const walls = new Set(targets.filter((t) => t.kind === "wall").map((t) => t.id));
  if (
    targets.some(
      (t) =>
        t.kind === "window" &&
        !walls.has(project.storey.windows.find((w) => w.id === t.id)!.wallId),
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
  for (const w of base.storey.windows) if (moving.has(w.wallId)) moving.add(w.id);
  const anchor = { ...origin };
  return {
    base,
    targets: targets.map((t) => ({ ...t })),
    origin: anchor,
    snapping: {
      ...drawingSnapPolicy(anchor),
      sources: (refs) =>
        refs.filter((r) => [r, ...(r.dependencies ?? [])].every((s) => !moving.has(s.entityId))),
    },
  };
}
/** One proposed snapshot: relationships never observe partially translated walls. */
export function previewSelectionMove(
  session: SelectionMove,
  current: Project,
  targets: SelectionSet,
  point: Point,
  visibility?: LayerVisibilityPolicy,
): Project {
  if (session.base !== current || !sameTargets(session.targets, targets))
    throw new Error("Modell oder Auswahl geändert. Bewegung erneut beginnen.");
  assertMovableSelection(current, targets, visibility);
  const dx = point.x - session.origin.x,
    dy = point.y - session.origin.y;
  if (!Number.isFinite(dx) || !Number.isFinite(dy)) throw new Error("Ungültige Bewegung.");
  if (dx === 0 && dy === 0) return current;
  const ids = new Set(targets.map((t) => t.id));
  const translate = (p: Point): Point => ({ x: p.x + dx, y: p.y + dy });
  const s = current.storey;
  return validateProject({
    ...current,
    storey: {
      ...s,
      walls: s.walls.map((w) =>
        ids.has(w.id) ? { ...w, start: translate(w.start), end: translate(w.end) } : w,
      ),
      lines: s.lines?.map((l) => (ids.has(l.id) ? { ...l, points: l.points.map(translate) } : l)),
      hatches: s.hatches.map((h) =>
        ids.has(h.id) ? { ...h, points: h.points.map(translate) } : h,
      ),
      wallJoins: s.wallJoins.filter((j) => ids.has(j.first.wallId) === ids.has(j.second.wallId)),
      wallTJunctions: s.wallTJunctions.filter(
        (j) => ids.has(j.hostWallId) === ids.has(j.incoming.wallId),
      ),
    },
  });
}
export function selectionMoveInteraction(
  session: SelectionMove,
  current: Project,
  targets: SelectionSet,
  visibility: LayerVisibilityPolicy,
  commit: (project: Project) => void,
  cancel: () => void,
): AnchoredToolInteraction {
  const previewProject = (point: Point) =>
    previewSelectionMove(session, current, targets, point, visibility);
  return {
    identity: session,
    origin: session.origin,
    snapping: session.snapping,
    input: { axisLabel: null, degrees: null },
    click: "confirm",
    preview: (angle, length, aim) => {
      const value = precisionTarget(session.origin, aim, angle, length);
      previewProject(value.point);
      return value;
    },
    previewProject,
    validate: (point) => {
      previewProject(point);
    },
    commit: (point) => commit(previewProject(point)),
    cancel,
  };
}
