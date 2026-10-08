import { validateProject, type Project, type Point } from "./schema.ts";
import type { GeometryPreview, ModelGeometry } from "./geometry-scope.ts";
import { validateLineGeometry, validateWindowGeometry } from "./geometry-validation.ts";
import {
  createPreparedWallSolids,
  prepareDetachedEndSolids,
} from "../elements/wall/connections.ts";
import { wallBody } from "../elements/wall/body.ts";
import { hatchSchema } from "../elements/hatch/model.ts";
import { validateReferenceExtent } from "../elements/reference/model.ts";

/** Freeze owned plain data, never caller-owned model objects. */
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const pointKey = (p: Point) => JSON.stringify([p.x, p.y]);

/** One full preparation. Per-target work uses this owned immutable snapshot only. */
export function prepareTranslation(source: Project, selectedIds: readonly string[]) {
  const base = freeze(validateProject(source));
  const ids = new Set(selectedIds);
  const s = base.storey;
  const available = new Set(
    [...s.walls, ...s.windows, ...(s.lines ?? []), ...s.hatches, ...s.references].map((e) => e.id),
  );
  if (!ids.size || ids.size !== selectedIds.length || selectedIds.some((id) => !available.has(id)))
    throw new Error("Ungültige Bewegungsauswahl.");
  if (s.windows.some((w) => ids.has(w.id) && !ids.has(w.wallId)))
    throw new Error("Fenster zusammen mit ihrer Wand auswählen.");
  const byWall = new Map(s.walls.map((w) => [w.id, w]));
  const neighbours = new Map<string, Set<string>>();
  for (const [a, b] of [
    ...s.wallJoins.map((j) => [j.first.wallId, j.second.wallId] as const),
    ...s.wallTJunctions.map((j) => [j.hostWallId, j.incoming.wallId] as const),
  ]) {
    for (const [from, to] of [
      [a, b],
      [b, a],
    ] as const) {
      if (!neighbours.has(from)) neighbours.set(from, new Set());
      neighbours.get(from)!.add(to);
    }
  }
  // Conservative connected-component closure, prepared once. Includes stationary partners.
  const walls = new Set(selectedIds.filter((id) => byWall.has(id)));
  for (const id of walls) for (const neighbour of neighbours.get(id) ?? []) walls.add(neighbour);
  const affected: ModelGeometry = {
    assets: base.assets.filter((a) =>
      s.references.some((r) => ids.has(r.id) && r.assetId === a.id),
    ),
    storey: {
      walls: s.walls.filter((w) => walls.has(w.id)),
      windows: s.windows.filter((w) => walls.has(w.wallId)),
      wallJoins: s.wallJoins.filter((j) => walls.has(j.first.wallId)),
      wallTJunctions: s.wallTJunctions.filter((j) => walls.has(j.hostWallId)),
      lines: (s.lines ?? []).filter((l) => ids.has(l.id)),
      hatches: s.hatches.filter((h) => ids.has(h.id)),
      references: s.references.filter((r) => ids.has(r.id)),
    },
  };
  freeze(affected);
  const movingWalls = affected.storey.walls.filter((w) => ids.has(w.id));
  const retainedJoins = s.wallJoins.filter(
    (j) => ids.has(j.first.wallId) === ids.has(j.second.wallId),
  );
  const retainedTees = s.wallTJunctions.filter(
    (j) => ids.has(j.hostWallId) === ids.has(j.incoming.wallId),
  );
  const localJoins = retainedJoins.filter((j) => walls.has(j.first.wallId));
  const localTees = retainedTees.filter((j) => walls.has(j.hostWallId));
  const counts = new Map<string, number>();
  for (const wall of s.walls)
    for (const p of [wall.start, wall.end]) {
      const key = pointKey(p);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  const fixedJoinedNodes = new Set(
    retainedJoins
      .filter((j) => !ids.has(j.first.wallId))
      .map((j) => {
        const wall = byWall.get(j.first.wallId)!;
        return pointKey(j.first.endpoint === 0 ? wall.start : wall.end);
      }),
  );
  const assets = new Map(affected.assets.map((a) => [a.id, a]));
  const replacedIds = Object.freeze(
    [
      ...affected.storey.walls,
      ...affected.storey.windows,
      ...affected.storey.lines!,
      ...affected.storey.hatches,
      ...affected.storey.references,
    ].map((e) => e.id),
  );

  // Bounded case proven by K06b: one free chain end, optionally its hosted windows.
  // Derive the changed stationary end once after detachment, not at every pointer target.
  const degree = new Map<string, number>();
  for (const j of s.wallJoins)
    for (const id of [j.first.wallId, j.second.wallId]) degree.set(id, (degree.get(id) ?? 0) + 1);
  const movingId = movingWalls.length === 1 ? movingWalls[0]!.id : null;
  const detachedEnd =
    movingId !== null &&
    !s.wallTJunctions.length &&
    degree.get(movingId) === 1 &&
    [...degree.values()].every((n) => n <= 2) &&
    selectedIds.every(
      (id) => id === movingId || s.windows.some((w) => w.id === id && w.wallId === movingId),
    );
  const stationary = detachedEnd
    ? freeze({
        storey: {
          ...affected.storey,
          walls: affected.storey.walls.filter((w) => w.id !== movingId),
          windows: affected.storey.windows.filter((w) => w.wallId !== movingId),
          wallJoins: localJoins,
          wallTJunctions: localTees,
        },
      })
    : null;
  const deriveSolids = stationary
    ? prepareDetachedEndSolids(stationary)
    : createPreparedWallSolids(affected.storey.walls.map((w) => w.id));

  function evaluate(delta: Point): GeometryPreview {
    if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))
      throw new Error("Ungültige Bewegung.");
    if (delta.x === 0 && delta.y === 0) return freeze({ geometry: affected, replacedIds });
    const translate = (p: Point) => {
      const next = { x: p.x + delta.x, y: p.y + delta.y };
      if (!Number.isFinite(next.x) || !Number.isFinite(next.y))
        throw new Error("Ungültige Bewegung.");
      return next;
    };
    const changedCounts = new Map<string, number>();
    const changeCount = (p: Point, change: number) => {
      const key = pointKey(p);
      changedCounts.set(key, (changedCounts.get(key) ?? 0) + change);
    };
    for (const wall of movingWalls)
      for (const p of [wall.start, wall.end]) {
        changeCount(p, -1);
        changeCount(translate(p), 1);
      }
    const countAt = (key: string) => (counts.get(key) ?? 0) + (changedCounts.get(key) ?? 0);
    // Spatial dependency: a moving, previously unrelated endpoint may occupy a fixed join.
    for (const key of changedCounts.keys())
      if (fixedJoinedNodes.has(key) && countAt(key) !== 2)
        throw new Error("Mehrfachanschluss noch nicht unterstützt.");
    const geometry: ModelGeometry = {
      assets: affected.assets,
      storey: {
        ...affected.storey,
        walls: affected.storey.walls.map((w) =>
          ids.has(w.id) ? { ...w, start: translate(w.start), end: translate(w.end) } : w,
        ),
        lines: affected.storey.lines!.map((l) => ({ ...l, points: l.points.map(translate) })),
        hatches: affected.storey.hatches.map((h) => ({ ...h, points: h.points.map(translate) })),
        references: affected.storey.references.map((r) => ({ ...r, origin: translate(r.origin) })),
        wallJoins: localJoins,
        wallTJunctions: localTees,
      },
    };
    const localWalls = new Map(geometry.storey.walls.map((w) => [w.id, w]));
    for (const join of localJoins) {
      const wall = localWalls.get(join.first.wallId)!;
      const p = join.first.endpoint === 0 ? wall.start : wall.end;
      if (countAt(pointKey(p)) !== 2) throw new Error("Mehrfachanschluss noch nicht unterstützt.");
    }
    for (const wall of geometry.storey.walls)
      if (!detachedEnd || wall.id === movingId) wallBody(wall);
    for (const line of geometry.storey.lines!) validateLineGeometry(line);
    for (const hatch of geometry.storey.hatches) hatchSchema.parse(hatch);
    for (const opening of geometry.storey.windows)
      if (!detachedEnd || opening.wallId === movingId)
        validateWindowGeometry(opening, localWalls.get(opening.wallId)!);
    for (const reference of geometry.storey.references)
      validateReferenceExtent(reference, assets.get(reference.assetId)!);
    // The exact existing corner/T/opening/solid rules, applied to the dependency closure.
    deriveSolids(geometry);
    return freeze({ geometry, replacedIds });
  }

  function materialize(current: Project, delta: Point): Project {
    // Identity is necessary but not sufficient for arbitrary public callers mutating a base.
    // Full comparison is a confirmation boundary, never part of pointer evaluation.
    if (current !== source || JSON.stringify(validateProject(current)) !== JSON.stringify(base))
      throw new Error("Modell geändert. Bewegung erneut beginnen.");
    const patch = evaluate(delta);
    if (delta.x === 0 && delta.y === 0) return current;
    const replace = <T extends { id: string }>(all: readonly T[], changed: readonly T[]): T[] => {
      const byId = new Map(changed.map((e) => [e.id, e]));
      return all.map((e) => byId.get(e.id) ?? e);
    };
    return validateProject({
      ...base,
      storey: {
        ...s,
        walls: replace(s.walls, patch.geometry.storey.walls),
        ...(s.lines ? { lines: replace(s.lines, patch.geometry.storey.lines!) } : {}),
        hatches: replace(s.hatches, patch.geometry.storey.hatches),
        references: replace(s.references, patch.geometry.storey.references),
        wallJoins: retainedJoins,
        wallTJunctions: retainedTees,
      },
    });
  }
  return Object.freeze({ evaluate, materialize, replacedIds });
}
