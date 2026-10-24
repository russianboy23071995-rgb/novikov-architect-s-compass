import { prepareProjectSnapshot } from "../../domain/project/prepared-snapshot.ts";
import { validateWindowGeometry } from "../../domain/project/geometry-validation.ts";
import { doorOpening } from "../../domain/elements/door/model.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { GeometryPreview } from "../../domain/project/geometry-scope.ts";
import {
  wallBase,
  wallHeights,
  resolveWallHeightRule,
} from "../../domain/elements/wall/heights.ts";
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
 * Doors move with their wall (user decision 24.10.2026): the storey-relative z offset
 * changes by the wall's base change, so the door keeps its height above the wall foot.
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
      const doors = (s.doors ?? []).filter((d) => closure.has(d.wallId));
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
        doors,
        joins,
        tees,
        replacedIds: [...walls, ...windows, ...doors].map((w) => w.id),
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
    // A rigid translation moves both ends, retaining the reference and changing its offset.
    // Height itself stays unchanged, so prepared preview and full commit remain identical.
    const next = {
      ...wall,
      baseOffset: wallBase(wall) + delta,
      ...(wall.topBinding
        ? { topBinding: { ...wall.topBinding, topOffset: wall.topBinding.topOffset + delta } }
        : {}),
    };
    if (next.topBinding) {
      const upper = levels.get(next.topBinding.storeyId);
      if (upper == null) throw new Error("Der Rohdeckenbezug fehlt.");
      next.height = resolveWallHeightRule(next, elevation, next.topBinding, {
        topElevation: upper,
        thickness: next.topBinding.slabThickness,
      }).height;
    }
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
    const patches = parts.map((p) => {
      const walls = p.walls.map((w) => shifted(w, delta, p.elevation));
      const before = new Map(p.walls.map((w) => [w.id, w]));
      const after = new Map(walls.map((w) => [w.id, w]));
      const doors = p.doors.map((d) => {
        const old = before.get(d.wallId)!,
          next = after.get(d.wallId)!;
        return next === old ? d : { ...d, zOffset: d.zOffset + wallBase(next) - wallBase(old) };
      });
      return {
        storeyId: p.s.id,
        replacedIds: p.replacedIds,
        geometry: {
          assets: [],
          storey: {
            walls,
            windows: p.windows,
            ...(p.s.doors ? { doors } : {}),
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
      };
    });
    for (const patch of patches) {
      const walls = new Map(patch.geometry.storey.walls.map((w) => [w.id, w]));
      for (const opening of patch.geometry.storey.windows)
        validateWindowGeometry(opening, walls.get(opening.wallId)!);
      for (const door of patch.geometry.storey.doors ?? []) {
        const wall = walls.get(door.wallId)!;
        validateWindowGeometry(doorOpening(door, wall), wall);
      }
    }
    return freeze({ ...patches[0]!, storeyPatches: patches });
  };
  const materialize = (current: Project, currentTargets: SelectionSet, delta: number): Project => {
    const preview = evaluate(current, currentTargets, delta);
    snapshot.assertCurrent(current);
    if (delta === 0) return current;
    const patches = new Map(preview.storeyPatches!.map((p) => [p.storeyId, p]));
    return validateLike(base, {
      ...base,
      storeys: base.storeys.map((s) => {
        const patch = patches.get(s.id),
          part = parts.find((p) => p.s.id === s.id);
        if (!patch || !part) return s;
        const changed = new Map(storeyOf(patch.geometry).walls.map((w) => [w.id, w]));
        const doors = new Map((storeyOf(patch.geometry).doors ?? []).map((d) => [d.id, d]));
        return {
          ...s,
          walls: s.walls.map((w) => changed.get(w.id) ?? w),
          ...(s.doors ? { doors: s.doors.map((d) => doors.get(d.id) ?? d) } : {}),
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
