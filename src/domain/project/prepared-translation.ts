import { dimensionSchema } from "../elements/dimension/model.ts";
import { columnSchema } from "../elements/column/model.ts";
import { translatePoint } from "../../geometry/primitives/point.ts";
import { wallDependencyClosure } from "../elements/wall/dependency-closure.ts";
import { prepareProjectSnapshot } from "./prepared-snapshot.ts";
import { wallBase } from "../elements/wall/heights.ts";
import { storeyOf } from "../storeys/access.ts";
import { validateProject, type Project, type Point } from "./schema.ts";
import type { GeometryPreview, ModelGeometry } from "./geometry-scope.ts";
import { validateLineGeometry, validateWindowGeometry } from "./geometry-validation.ts";
import { doorOpening } from "../elements/door/model.ts";
import {
  createPreparedWallSolids,
  prepareDetachedEndSolids,
} from "../elements/wall/connections.ts";
import { wallBody } from "../elements/wall/body.ts";
import { hatchSchema } from "../elements/hatch/model.ts";
import { slabSchema } from "../elements/slab/model.ts";
import { roofSchema } from "../elements/roof/model.ts";
import { roomSchema } from "../elements/room/model.ts";
import { validateReferenceExtent } from "../elements/reference/model.ts";

/** Freeze owned plain data, never caller-owned model objects. */
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) freeze(child);
    Object.freeze(value);
  }
  return value;
}
const pointKey = (p: Point, z: number) => JSON.stringify([p.x, p.y, z]);

/** One full preparation. Per-target work uses this owned immutable snapshot only. */
function prepareStoreyTranslation(base: Project, selectedIds: readonly string[]) {
  const ids = new Set(selectedIds);
  const s = storeyOf(base);
  const available = new Set(
    [
      ...s.walls,
      ...s.windows,
      ...(s.slabs ?? []),
      ...(s.roofs ?? []),
      ...(s.rooms ?? []),
      ...(s.columns ?? []),
      ...(s.dimensions ?? []),
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ].map((e) => e.id),
  );
  if (!ids.size || ids.size !== selectedIds.length || selectedIds.some((id) => !available.has(id)))
    throw new Error("Ungültige Bewegungsauswahl.");
  if (s.windows.some((w) => ids.has(w.id) && !ids.has(w.wallId)))
    throw new Error("Fenster zusammen mit ihrer Wand auswählen.");
  const byWall = new Map(s.walls.map((w) => [w.id, w]));
  const walls = wallDependencyClosure(
    base,
    selectedIds.filter((id) => byWall.has(id)),
  );
  const affected: ModelGeometry = {
    assets: base.assets.filter((a) =>
      s.references.some((r) => ids.has(r.id) && r.assetId === a.id),
    ),
    storey: {
      // The storey height places moving ceiling slabs in the 3D preview.
      height: s.height,
      walls: s.walls.filter((w) => walls.has(w.id)),
      windows: s.windows.filter((w) => walls.has(w.wallId)),
      // Doors stay hosted by relative position; they follow their walls like windows.
      ...(s.doors ? { doors: s.doors.filter((d) => walls.has(d.wallId)) } : {}),
      wallJoins: s.wallJoins.filter((j) => walls.has(j.first.wallId)),
      wallTJunctions: s.wallTJunctions.filter((j) => walls.has(j.hostWallId)),
      lines: (s.lines ?? []).filter((l) => ids.has(l.id)),
      hatches: s.hatches.filter((h) => ids.has(h.id)),
      references: s.references.filter((r) => ids.has(r.id)),
      ...(s.slabs ? { slabs: s.slabs.filter((slab) => ids.has(slab.id)) } : {}),
      ...(s.roofs ? { roofs: s.roofs.filter((roof) => ids.has(roof.id)) } : {}),
      ...(s.rooms ? { rooms: s.rooms.filter((room) => ids.has(room.id)) } : {}),
      ...(s.columns ? { columns: s.columns.filter((column) => ids.has(column.id)) } : {}),
      ...(s.dimensions ? { dimensions: s.dimensions.filter((d) => ids.has(d.id)) } : {}),
    },
  };
  freeze(affected);
  const movingWalls = storeyOf(affected).walls.filter((w) => ids.has(w.id));
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
      const key = pointKey(p, wallBase(wall));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  const fixedJoinedNodes = new Set(
    retainedJoins
      .filter((j) => !ids.has(j.first.wallId))
      .map((j) => {
        const wall = byWall.get(j.first.wallId)!;
        return pointKey(j.first.endpoint === 0 ? wall.start : wall.end, wallBase(wall));
      }),
  );
  const assets = new Map(affected.assets.map((a) => [a.id, a]));
  const replacedIds = Object.freeze(
    [
      ...storeyOf(affected).walls,
      ...storeyOf(affected).windows,
      ...(storeyOf(affected).doors ?? []),
      ...(storeyOf(affected).slabs ?? []),
      ...(storeyOf(affected).roofs ?? []),
      ...(storeyOf(affected).rooms ?? []),
      ...(storeyOf(affected).columns ?? []),
      ...(storeyOf(affected).dimensions ?? []),
      ...storeyOf(affected).lines!,
      ...storeyOf(affected).hatches,
      ...storeyOf(affected).references,
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
          ...storeyOf(affected),
          walls: storeyOf(affected).walls.filter((w) => w.id !== movingId),
          windows: storeyOf(affected).windows.filter((w) => w.wallId !== movingId),
          ...(storeyOf(affected).doors
            ? { doors: storeyOf(affected).doors!.filter((d) => d.wallId !== movingId) }
            : {}),
          wallJoins: localJoins,
          wallTJunctions: localTees,
        },
      })
    : null;
  const deriveSolids = stationary
    ? prepareDetachedEndSolids(stationary)
    : createPreparedWallSolids(storeyOf(affected).walls.map((w) => w.id));

  function evaluate(delta: Point): GeometryPreview {
    if (!Number.isFinite(delta.x) || !Number.isFinite(delta.y))
      throw new Error("Ungültige Bewegung.");
    if (delta.x === 0 && delta.y === 0) return freeze({ geometry: affected, replacedIds });
    const translate = (p: Point) => {
      const next = translatePoint(p, delta);
      if (!Number.isFinite(next.x) || !Number.isFinite(next.y))
        throw new Error("Ungültige Bewegung.");
      return next;
    };
    const changedCounts = new Map<string, number>();
    const changeCount = (p: Point, change: number, z: number) => {
      const key = pointKey(p, z);
      changedCounts.set(key, (changedCounts.get(key) ?? 0) + change);
    };
    for (const wall of movingWalls)
      for (const p of [wall.start, wall.end]) {
        changeCount(p, -1, wallBase(wall));
        changeCount(translate(p), 1, wallBase(wall));
      }
    const countAt = (key: string) => (counts.get(key) ?? 0) + (changedCounts.get(key) ?? 0);
    // Spatial dependency: a moving, previously unrelated endpoint may occupy a fixed join.
    for (const key of changedCounts.keys())
      if (fixedJoinedNodes.has(key) && countAt(key) !== 2)
        throw new Error("Mehrfachanschluss noch nicht unterstützt.");
    const geometry: ModelGeometry = {
      assets: affected.assets,
      storey: {
        ...storeyOf(affected),
        walls: storeyOf(affected).walls.map((w) =>
          ids.has(w.id) ? { ...w, start: translate(w.start), end: translate(w.end) } : w,
        ),
        lines: storeyOf(affected).lines!.map((l) => ({ ...l, points: l.points.map(translate) })),
        hatches: storeyOf(affected).hatches.map((h) => ({
          ...h,
          points: h.points.map(translate),
          ...(h.pattern ? { pattern: { ...h.pattern, origin: translate(h.pattern.origin) } } : {}),
        })),
        references: storeyOf(affected).references.map((r) => ({
          ...r,
          origin: translate(r.origin),
        })),
        ...(storeyOf(affected).slabs
          ? {
              slabs: storeyOf(affected).slabs!.map((slab) => ({
                ...slab,
                points: slab.points.map(translate),
              })),
            }
          : {}),
        // A roof moves with its reference line (docs/ROOF_ELEMENT.md, D3).
        ...(storeyOf(affected).roofs
          ? {
              roofs: storeyOf(affected).roofs!.map((roof) => ({
                ...roof,
                points: roof.points.map(translate),
                referenceLine: {
                  start: translate(roof.referenceLine.start),
                  end: translate(roof.referenceLine.end),
                },
              })),
            }
          : {}),
        ...(storeyOf(affected).rooms
          ? {
              rooms: storeyOf(affected).rooms!.map((room) => ({
                ...room,
                points: room.points.map(translate),
              })),
            }
          : {}),
        // A column moves with its centre (docs/STUETZEN.md, P3).
        ...(storeyOf(affected).columns
          ? {
              columns: storeyOf(affected).columns!.map((column) => ({
                ...column,
                position: translate(column.position),
              })),
            }
          : {}),
        ...(storeyOf(affected).dimensions
          ? {
              dimensions: storeyOf(affected).dimensions!.map((d) => {
                const moved = translate(
                  d.orientation === "horizontal" ? { x: 0, y: d.offset } : { x: d.offset, y: 0 },
                );
                return {
                  ...d,
                  points: d.points.map(translate),
                  offset: d.orientation === "horizontal" ? moved.y : moved.x,
                };
              }),
            }
          : {}),
        wallJoins: localJoins,
        wallTJunctions: localTees,
      },
    };
    const localWalls = new Map(storeyOf(geometry).walls.map((w) => [w.id, w]));
    for (const join of localJoins) {
      const wall = localWalls.get(join.first.wallId)!;
      const p = join.first.endpoint === 0 ? wall.start : wall.end;
      if (countAt(pointKey(p, wallBase(wall))) !== 2)
        throw new Error("Mehrfachanschluss noch nicht unterstützt.");
    }
    for (const wall of storeyOf(geometry).walls)
      if (!detachedEnd || wall.id === movingId) wallBody(wall);
    for (const line of storeyOf(geometry).lines!) validateLineGeometry(line);
    for (const hatch of storeyOf(geometry).hatches) hatchSchema.parse(hatch);
    for (const slab of storeyOf(geometry).slabs ?? []) slabSchema.parse(slab);
    for (const roof of storeyOf(geometry).roofs ?? []) roofSchema.parse(roof);
    for (const room of storeyOf(geometry).rooms ?? []) roomSchema.parse(room);
    for (const column of storeyOf(geometry).columns ?? []) columnSchema.parse(column);
    for (const d of storeyOf(geometry).dimensions ?? []) dimensionSchema.parse(d);
    for (const opening of storeyOf(geometry).windows)
      if (!detachedEnd || opening.wallId === movingId)
        validateWindowGeometry(opening, localWalls.get(opening.wallId)!);
    for (const door of storeyOf(geometry).doors ?? [])
      if (!detachedEnd || door.wallId === movingId) {
        const wall = localWalls.get(door.wallId)!;
        validateWindowGeometry(doorOpening(door, wall), wall);
      }
    for (const reference of storeyOf(geometry).references)
      validateReferenceExtent(reference, assets.get(reference.assetId)!);
    // The exact existing corner/T/opening/solid rules, applied to the dependency closure.
    deriveSolids(geometry);
    return freeze({ geometry, replacedIds });
  }

  function materialize(delta: Point) {
    const patch = evaluate(delta);
    if (delta.x === 0 && delta.y === 0) return s;
    const replace = <T extends { id: string }>(all: readonly T[], changed: readonly T[]): T[] => {
      const byId = new Map(changed.map((e) => [e.id, e]));
      return all.map((e) => byId.get(e.id) ?? e);
    };
    return {
      ...s,
      walls: replace(s.walls, storeyOf(patch.geometry).walls),
      ...(s.lines ? { lines: replace(s.lines, storeyOf(patch.geometry).lines!) } : {}),
      hatches: replace(s.hatches, storeyOf(patch.geometry).hatches),
      references: replace(s.references, storeyOf(patch.geometry).references),
      ...(s.slabs ? { slabs: replace(s.slabs, storeyOf(patch.geometry).slabs ?? []) } : {}),
      ...(s.roofs ? { roofs: replace(s.roofs, storeyOf(patch.geometry).roofs ?? []) } : {}),
      ...(s.rooms ? { rooms: replace(s.rooms, storeyOf(patch.geometry).rooms ?? []) } : {}),
      ...(s.columns ? { columns: replace(s.columns, storeyOf(patch.geometry).columns ?? []) } : {}),
      ...(s.dimensions
        ? { dimensions: replace(s.dimensions, storeyOf(patch.geometry).dimensions ?? []) }
        : {}),
      wallJoins: retainedJoins,
      wallTJunctions: retainedTees,
    };
  }
  return Object.freeze({ evaluate, materialize, replacedIds });
}

/** Public boundary: one validated owned snapshot, one final whole-model check.
 * Private per-storey builders cannot be called with an unvalidated caller project.
 */
export function prepareStoreysTranslation(source: Project, selectedIds: readonly string[]) {
  const snapshot = prepareProjectSnapshot(source);
  const base = snapshot.base;
  const selected = new Set(selectedIds);
  const parts = base.storeys.flatMap((s) => {
    const ids = [
      ...s.walls,
      ...s.windows,
      ...(s.slabs ?? []),
      ...(s.roofs ?? []),
      ...(s.rooms ?? []),
      ...(s.columns ?? []),
      ...(s.dimensions ?? []),
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ]
      .filter((e) => selected.has(e.id))
      .map((e) => e.id);
    return ids.length
      ? [
          {
            id: s.id,
            ids,
            action: prepareStoreyTranslation({ ...base, workingStoreyId: s.id }, ids),
          },
        ]
      : [];
  });
  if (
    !selectedIds.length ||
    selected.size !== selectedIds.length ||
    parts.reduce((n, p) => n + p.ids.length, 0) !== selectedIds.length
  )
    throw new Error("Ungültige Bewegungsauswahl.");
  const activeId = storeyOf(base).id;
  const empty: GeometryPreview = {
    geometry: {
      assets: [],
      storey: {
        walls: [],
        windows: [],
        lines: [],
        hatches: [],
        references: [],
        wallJoins: [],
        wallTJunctions: [],
      },
    },
    replacedIds: [],
  };
  return Object.freeze({
    replacedIds: parts.find((p) => p.id === activeId)?.action.replacedIds ?? [],
    evaluate(delta: Point): GeometryPreview {
      if (parts.length === 1 && parts[0]!.id === activeId) return parts[0]!.action.evaluate(delta);
      const patches = parts.map((p) => ({ storeyId: p.id, ...p.action.evaluate(delta) }));
      const active = patches.find((p) => p.storeyId === activeId) ?? empty;
      return { ...active, storeyPatches: patches };
    },
    materialize(current: Project, delta: Point): Project {
      snapshot.assertCurrent(current);
      const changed = new Map(parts.map((p) => [p.id, p.action.materialize(delta)]));
      if (delta.x === 0 && delta.y === 0) return current;
      return validateProject({ ...base, storeys: base.storeys.map((s) => changed.get(s.id) ?? s) });
    },
  });
}

/** Single active-storey API retains its selection contract. */
export function prepareTranslation(source: Project, selectedIds: readonly string[]) {
  const s = storeyOf(source);
  const available = new Set(
    [
      ...s.walls,
      ...s.windows,
      ...(s.slabs ?? []),
      ...(s.roofs ?? []),
      ...(s.rooms ?? []),
      ...(s.columns ?? []),
      ...(s.dimensions ?? []),
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ].map((e) => e.id),
  );
  if (selectedIds.some((id) => !available.has(id))) throw new Error("Ungültige Bewegungsauswahl.");
  return prepareStoreysTranslation(source, selectedIds);
}
