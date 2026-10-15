import { prepareProjectSnapshot } from "../../domain/project/prepared-snapshot.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import { wallBase, wallHeights } from "../../domain/elements/wall/heights.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
import { commitProject, type ProjectHistory } from "../../lib/bim/history.ts";
import { type SelectionSet } from "./state.ts";
import { sameTargets, assertMovableSelection } from "./move.ts";
import type { LayerVisibilityPolicy } from "../layers/visibility.ts";

/** Own immutable preview data; never freeze caller state. */
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
/** One prepared vertical action for UI and future text/voice adapters.
 * Window sill/host and storey membership remain unchanged; only wall bases move.
 */
export function prepareZTranslation(
  source: Project,
  targets: SelectionSet,
  visibility?: LayerVisibilityPolicy,
) {
  assertMovableSelection(source, targets, visibility);
  if (targets.some((t) => t.kind !== "wall" && t.kind !== "window"))
    throw new Error("Z-Bewegung unterstützt zunächst Wände mit ihren Fenstern.");
  const snapshot = prepareProjectSnapshot(source);
  const base = snapshot.base;
  const selection = targets.map((t) => ({ ...t }));
  const moving = new Set(targets.filter((t) => t.kind === "wall").map((t) => t.id));
  if (!moving.size) throw new Error("Mindestens eine Wand auswählen.");
  const levels = new Map(
    resolveStoreyLevels(base.storeys, base.groundStoreyId).map((s) => [s.storeyId, s.elevation]),
  );
  const parts = base.storeys
    .filter((s) => s.walls.some((w) => moving.has(w.id)))
    .map((s) => {
      const elevation = levels.get(s.id);
      if (elevation == null) throw new Error("Geschosshöhe nicht aufgelöst.");
      const neighbours = new Map<string, Set<string>>();
      for (const [a, b] of [
        ...s.wallJoins.map((j) => [j.first.wallId, j.second.wallId]),
        ...s.wallTJunctions.map((j) => [j.hostWallId, j.incoming.wallId]),
      ]) {
        for (const [from, to] of [
          [a!, b!],
          [b!, a!],
        ]) {
          if (!neighbours.has(from!)) neighbours.set(from!, new Set());
          neighbours.get(from!)!.add(to!);
        }
      }
      const closure = new Set(s.walls.filter((w) => moving.has(w.id)).map((w) => w.id));
      for (const id of closure)
        for (const neighbour of neighbours.get(id) ?? []) closure.add(neighbour);
      const walls = s.walls.filter((w) => closure.has(w.id));
      const windows = s.windows.filter((w) => closure.has(w.wallId));
      const joins = s.wallJoins.filter(
        (j) => moving.has(j.first.wallId) === moving.has(j.second.wallId),
      );
      const tees = s.wallTJunctions.filter(
        (j) => moving.has(j.hostWallId) === moving.has(j.incoming.wallId),
      );
      return {
        s,
        closure,
        elevation,
        walls,
        windows,
        joins,
        tees,
        replacedIds: [...walls, ...windows].map((w) => w.id),
      };
    });
  const assertContext = (current: Project, currentTargets: SelectionSet) => {
    // Eligibility was checked once against the pinned immutable source/policy.
    // Do not rescan all project elements on each pointer sample.
    if (
      (visibility && !visibility.isCurrent(current, visibility.context)) ||
      current !== source ||
      !sameTargets(selection, currentTargets)
    )
      throw new Error("Modell oder Auswahl geändert. Z-Bewegung erneut beginnen.");
  };
  const shifted = (
    wall: Project["storeys"][number]["walls"][number],
    delta: number,
    elevation: number,
  ) => {
    if (!moving.has(wall.id) || delta === 0) return wall;
    const next = { ...wall, baseOffset: wallBase(wall) + delta };
    wallHeights(next, elevation);
    if (wallBase(next) === wallBase(wall))
      throw new Error("Z-Bewegung ist bei dieser Höhe nicht darstellbar.");
    return next;
  };
  const evaluate = (
    current: Project,
    currentTargets: SelectionSet,
    delta: number,
  ): GeometryPreview => {
    assertContext(current, currentTargets);
    if (!Number.isFinite(delta)) throw new Error("Endlicher Z-Versatz erforderlich.");
    const patches = parts.map((p) => ({
      storeyId: p.s.id,
      replacedIds: p.replacedIds,
      geometry: {
        assets: [],
        storey: {
          walls: p.walls.map((w) => shifted(w, delta, p.elevation)),
          windows: p.windows,
          wallJoins: (delta === 0 ? p.s.wallJoins : p.joins).filter((j) =>
            p.closure.has(j.first.wallId),
          ),
          wallTJunctions: (delta === 0 ? p.s.wallTJunctions : p.tees).filter((j) =>
            p.closure.has(j.hostWallId),
          ),
          lines: [],
          hatches: [],
          references: [],
        },
      },
    }));
    return freeze({ ...patches[0]!, storeyPatches: patches });
  };
  const materialize = (current: Project, currentTargets: SelectionSet, delta: number): Project => {
    const preview = evaluate(current, currentTargets, delta);
    snapshot.assertCurrent(current);
    if (delta === 0) return current;
    const patches = new Map(preview.storeyPatches!.map((p) => [p.storeyId, p]));
    return validateProject({
      ...base,
      storeys: base.storeys.map((s) => {
        const patch = patches.get(s.id),
          part = parts.find((p) => p.s.id === s.id);
        if (!patch || !part) return s;
        const changed = new Map(storeyOf(patch.geometry).walls.map((w) => [w.id, w]));
        return {
          ...s,
          walls: s.walls.map((w) => changed.get(w.id) ?? w),
          wallJoins: part.joins,
          wallTJunctions: part.tees,
        };
      }),
    });
  };
  return {
    evaluate,
    materialize,
    commit: (history: ProjectHistory, currentTargets: SelectionSet, delta: number) =>
      commitProject(history, materialize(history.present, currentTargets, delta)),
  };
}
