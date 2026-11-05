import { textSchema } from "../elements/text/model.ts";
import { placedDrawingSchema } from "../elements/drawing/model.ts";
import { dimensionSchema } from "../elements/dimension/model.ts";
import { columnSchema } from "../elements/column/model.ts";
import { stairSchema } from "../elements/stair/model.ts";
import { railingSchema } from "../elements/railing/model.ts";
import { objectSchema } from "../elements/object/model.ts";
import { roofWindowSchema } from "../elements/roof/window.ts";
import { roofFrame } from "../elements/roof/geometry.ts";
import { translatePoint } from "../../geometry/primitives/point.ts";
import { wallDependencyClosure } from "../elements/wall/dependency-closure.ts";
import { prepareProjectSnapshot } from "./prepared-snapshot.ts";
import { wallBase } from "../elements/wall/heights.ts";
import { storeyOf } from "../storeys/access.ts";
import { validateProject, type Project, type Point, type Wall } from "./schema.ts";
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
import { slabOpeningProblem, slabOpeningSchema } from "../elements/slab/opening.ts";
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

/**
 * A plan transform (docs/TASTENKUERZEL.md, B2): every point maps, turned fields (columns,
 * objects, texts, stairs, images) add `degrees` counterclockwise. A move is the transform
 * with `delta` and 0°; a turn has no `delta`. Hatch patterns keep their angle.
 */
export type PlanTransform = Readonly<{
  point: (p: Point) => Point;
  degrees: number;
  delta?: Point;
  /** B3: a reflection across an axis at this angle (degrees); `degrees` is then 0. */
  mirror?: number;
}>;
export function translationTransform(delta: Point): PlanTransform {
  return { point: (p) => translatePoint(p, delta), degrees: 0, delta };
}
/** Exact for quarter turns: 90°, 180° and 270° leave no rounding residue. */
export function rotationTransform(pivot: Point, degrees: number): PlanTransform {
  if (![pivot.x, pivot.y, degrees].every(Number.isFinite)) throw new Error("Ungültige Drehung.");
  const quarter = degrees / 90;
  const exact = Number.isInteger(quarter) ? ((quarter % 4) + 4) % 4 : null;
  const a = (degrees * Math.PI) / 180;
  const cos = exact === null ? Math.cos(a) : [1, 0, -1, 0][exact]!;
  const sin = exact === null ? Math.sin(a) : [0, 1, 0, -1][exact]!;
  return {
    degrees,
    point: (p) => {
      const dx = p.x - pivot.x,
        dy = p.y - pivot.y;
      return { x: pivot.x + dx * cos - dy * sin, y: pivot.y + dx * sin + dy * cos };
    },
  };
}
/**
 * Spiegeln (docs/TASTENKUERZEL.md, B3): reflection across the line through `origin` at
 * `axisDegrees`. Exact for axes in 45° steps: no rounding residue, a second reflection
 * restores every point.
 */
export function reflectionTransform(origin: Point, axisDegrees: number): PlanTransform {
  if (![origin.x, origin.y, axisDegrees].every(Number.isFinite))
    throw new Error("Ungültige Spiegelachse.");
  const eighth = axisDegrees / 45;
  const exact = Number.isInteger(eighth) ? ((eighth % 4) + 4) % 4 : null;
  const a = (2 * axisDegrees * Math.PI) / 180;
  const cos = exact === null ? Math.cos(a) : [1, 0, -1, 0][exact]!;
  const sin = exact === null ? Math.sin(a) : [0, 1, 0, -1][exact]!;
  return {
    degrees: 0,
    mirror: axisDegrees,
    point: (p) => {
      const dx = p.x - origin.x,
        dy = p.y - origin.y;
      return { x: origin.x + dx * cos + dy * sin, y: origin.y + dx * sin - dy * cos };
    },
  };
}
const identityTransform = (t: PlanTransform) =>
  t.mirror !== undefined
    ? false
    : t.delta
      ? t.delta.x === 0 && t.delta.y === 0
      : t.degrees % 360 === 0;
const other = <T extends string>(value: T, a: T, b: T): T =>
  value === a ? b : value === b ? a : value;
/** Degrees in [0, 360), never -0. */
const turnedDegrees = (value: number, by: number) => {
  const next = (((value + by) % 360) + 360) % 360;
  return next === 0 ? 0 : next;
};

/** One full preparation. Per-target work uses this owned immutable snapshot only. */
function prepareStoreyTranslation(base: Project, selectedIds: readonly string[]) {
  const ids = new Set(selectedIds);
  const s = storeyOf(base);
  const available = new Set(
    [
      ...s.walls,
      ...s.windows,
      ...(s.doors ?? []),
      ...(s.slabs ?? []),
      ...(s.slabOpenings ?? []),
      ...(s.roofs ?? []),
      ...(s.rooms ?? []),
      ...(s.columns ?? []),
      ...(s.stairs ?? []),
      ...(s.railings ?? []),
      ...(s.objects ?? []),
      ...(s.roofWindows ?? []),
      ...(s.dimensions ?? []),
      ...(s.texts ?? []),
      ...(s.drawings ?? []),
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ].map((e) => e.id),
  );
  if (!ids.size || ids.size !== selectedIds.length || selectedIds.some((id) => !available.has(id)))
    throw new Error("Ungültige Bewegungsauswahl.");
  if (s.windows.some((w) => ids.has(w.id) && !ids.has(w.wallId)))
    throw new Error("Fenster zusammen mit ihrer Wand auswählen.");
  if ((s.doors ?? []).some((d) => ids.has(d.id) && !ids.has(d.wallId)))
    throw new Error("Türen zusammen mit ihrer Wand auswählen.");
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
      // Slab openings follow their slab (docs/DECKENDURCHBRUCH.md) or move on their own.
      ...(s.slabOpenings
        ? { slabOpenings: s.slabOpenings.filter((o) => ids.has(o.id) || ids.has(o.slabId)) }
        : {}),
      ...(s.roofs ? { roofs: s.roofs.filter((roof) => ids.has(roof.id)) } : {}),
      ...(s.rooms ? { rooms: s.rooms.filter((room) => ids.has(room.id)) } : {}),
      ...(s.columns ? { columns: s.columns.filter((column) => ids.has(column.id)) } : {}),
      ...(s.stairs ? { stairs: s.stairs.filter((stair) => ids.has(stair.id)) } : {}),
      ...(s.railings ? { railings: s.railings.filter((r) => ids.has(r.id)) } : {}),
      ...(s.objects ? { objects: s.objects.filter((o) => ids.has(o.id)) } : {}),
      // A roof window moves on its own only; with its roof it follows that roof by itself.
      ...(s.roofWindows
        ? { roofWindows: s.roofWindows.filter((w) => ids.has(w.id) && !ids.has(w.roofId)) }
        : {}),
      ...(s.dimensions ? { dimensions: s.dimensions.filter((d) => ids.has(d.id)) } : {}),
      ...(s.texts ? { texts: s.texts.filter((t) => ids.has(t.id)) } : {}),
      ...(s.drawings ? { drawings: s.drawings.filter((d) => ids.has(d.id)) } : {}),
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
  // B3: a mirrored wall swaps start and end, so its join ends swap their index too.
  type End = (typeof s.wallJoins)[number]["first"];
  const flipEnd = (e: End): End =>
    ids.has(e.wallId) ? { ...e, endpoint: e.endpoint === 0 ? 1 : 0 } : e;
  const mirrored = {
    joins: freeze(
      retainedJoins.map((j) => ({ first: flipEnd(j.first), second: flipEnd(j.second) })),
    ),
    tees: freeze(retainedTees.map((j) => ({ ...j, incoming: flipEnd(j.incoming) }))),
  };
  const mirroredLocal = {
    joins: freeze(mirrored.joins.filter((j) => walls.has(j.first.wallId))),
    tees: freeze(mirrored.tees.filter((j) => walls.has(j.hostWallId))),
  };
  const counts = new Map<string, number>();
  for (const wall of s.walls)
    for (const p of [wall.start, wall.end]) {
      const key = pointKey(p, wallBase(wall));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  // A join node: its point at the foot heights of both walls, which may differ (L09 U1).
  const joinNodeKeys = (join: (typeof s.wallJoins)[number], wallOf: (id: string) => Wall) => {
    const first = wallOf(join.first.wallId),
      p = join.first.endpoint === 0 ? first.start : first.end;
    return [...new Set([first, wallOf(join.second.wallId)].map((w) => pointKey(p, wallBase(w))))];
  };
  const fixedJoinedNodes = retainedJoins
    .filter((j) => !ids.has(j.first.wallId))
    .map((j) => joinNodeKeys(j, (id) => byWall.get(id)!));
  const assets = new Map(affected.assets.map((a) => [a.id, a]));
  const replacedIds = Object.freeze(
    [
      ...storeyOf(affected).walls,
      ...storeyOf(affected).windows,
      ...(storeyOf(affected).doors ?? []),
      ...(storeyOf(affected).slabs ?? []),
      ...(storeyOf(affected).slabOpenings ?? []),
      ...(storeyOf(affected).roofs ?? []),
      ...(storeyOf(affected).rooms ?? []),
      ...(storeyOf(affected).columns ?? []),
      ...(storeyOf(affected).stairs ?? []),
      ...(storeyOf(affected).railings ?? []),
      ...(storeyOf(affected).objects ?? []),
      ...(storeyOf(affected).roofWindows ?? []),
      ...(storeyOf(affected).dimensions ?? []),
      ...(storeyOf(affected).texts ?? []),
      ...(storeyOf(affected).drawings ?? []),
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

  function evaluate(t: PlanTransform): GeometryPreview {
    if (t.delta && (!Number.isFinite(t.delta.x) || !Number.isFinite(t.delta.y)))
      throw new Error("Ungültige Bewegung.");
    if (!Number.isFinite(t.degrees)) throw new Error("Ungültige Drehung.");
    if (t.mirror !== undefined && !Number.isFinite(t.mirror))
      throw new Error("Ungültige Spiegelachse.");
    if (identityTransform(t)) return freeze({ geometry: affected, replacedIds });
    const mirror = t.mirror;
    const turn = mirror !== undefined || t.degrees % 360 !== 0;
    /** A direction field: turned by the angle, or reflected at the axis (2α − θ). */
    const orient = (value: number) =>
      mirror === undefined ? turnedDegrees(value, t.degrees) : turnedDegrees(2 * mirror - value, 0);
    const joins = mirror === undefined ? localJoins : mirroredLocal.joins;
    const tees = mirror === undefined ? localTees : mirroredLocal.tees;
    const translate = (p: Point) => {
      const next = t.point(p);
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
    const nodeCount = (keys: readonly string[]) => keys.reduce((n, k) => n + countAt(k), 0);
    for (const keys of fixedJoinedNodes)
      if (keys.some((k) => changedCounts.has(k)) && nodeCount(keys) !== 2)
        throw new Error("Mehrfachanschluss noch nicht unterstützt.");
    const geometry: ModelGeometry = {
      assets: affected.assets,
      storey: {
        ...storeyOf(affected),
        // A mirrored wall swaps start and end: its left face, axis offset and build-up side
        // stay where the mirror image puts them (B3).
        walls: storeyOf(affected).walls.map((w) =>
          !ids.has(w.id)
            ? w
            : mirror === undefined
              ? { ...w, start: translate(w.start), end: translate(w.end) }
              : { ...w, start: translate(w.end), end: translate(w.start) },
        ),
        // On a mirrored wall openings sit at 1 − position; a door hinges on the other jamb and
        // window sashes run in mirror order with swapped hinges. Otherwise the lists stay the
        // prepared ones, identical across pointer targets.
        windows:
          mirror === undefined
            ? storeyOf(affected).windows
            : storeyOf(affected).windows.map((w) =>
                !ids.has(w.wallId)
                  ? w
                  : {
                      ...w,
                      position: 1 - w.position,
                      ...(w.insert?.sashes
                        ? {
                            insert: {
                              ...w.insert,
                              sashes: [...w.insert.sashes].reverse().map((sash) => ({
                                ...sash,
                                hinge: other(sash.hinge, "left", "right"),
                              })),
                            },
                          }
                        : {}),
                    },
              ),
        ...(mirror !== undefined && storeyOf(affected).doors
          ? {
              doors: storeyOf(affected).doors!.map((d) =>
                !ids.has(d.wallId)
                  ? d
                  : { ...d, position: 1 - d.position, hinge: other(d.hinge, "start", "end") },
              ),
            }
          : {}),
        lines: storeyOf(affected).lines!.map((l) => ({ ...l, points: l.points.map(translate) })),
        hatches: storeyOf(affected).hatches.map((h) => ({
          ...h,
          points: h.points.map(translate),
          ...(h.pattern ? { pattern: { ...h.pattern, origin: translate(h.pattern.origin) } } : {}),
        })),
        references: storeyOf(affected).references.map((r) => {
          if (mirror === undefined)
            return {
              ...r,
              origin: translate(r.origin),
              ...(turn ? { rotation: r.rotation + (t.degrees * Math.PI) / 180 } : {}),
            };
          // An image is never mirrored (B3): its centre moves to the mirror side, it keeps
          // its angle and content.
          const asset = assets.get(r.assetId)!;
          const w = asset.pixelWidth * r.metresPerPixel,
            h = asset.pixelHeight * r.metresPerPixel;
          const c = Math.cos(r.rotation),
            sn = Math.sin(r.rotation);
          const centre = {
            x: r.origin.x + (c * w) / 2 + (sn * h) / 2,
            y: r.origin.y + (sn * w) / 2 - (c * h) / 2,
          };
          const moved = translate(centre);
          return {
            ...r,
            origin: { x: r.origin.x + moved.x - centre.x, y: r.origin.y + moved.y - centre.y },
          };
        }),
        ...(storeyOf(affected).slabs
          ? {
              slabs: storeyOf(affected).slabs!.map((slab) => ({
                ...slab,
                points: slab.points.map(translate),
              })),
            }
          : {}),
        ...(storeyOf(affected).slabOpenings
          ? {
              slabOpenings: storeyOf(affected).slabOpenings!.map((o) => ({
                ...o,
                ...(o.points ? { points: o.points.map(translate) } : {}),
                ...(o.circle
                  ? { circle: { ...o.circle, center: translate(o.circle.center) } }
                  : {}),
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
                // Mirrored, the uphill side swaps; along and slope of its windows then hold.
                ...(mirror !== undefined ? { rise: other(roof.rise, "left", "right") } : {}),
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
                ...(turn ? { rotation: orient(column.rotation) } : {}),
              })),
            }
          : {}),
        // A railing moves with all its points (docs/GELAENDER.md, G3).
        ...(storeyOf(affected).railings
          ? {
              railings: storeyOf(affected).railings!.map((railing) => ({
                ...railing,
                points: railing.points.map(translate),
              })),
            }
          : {}),
        // A roof window moves in its roof's plane (docs/DACHFLAECHENFENSTER.md, D3): the plan
        // move along the eave and up the slope, its sides stay parallel to the eave.
        ...(storeyOf(affected).roofWindows
          ? {
              roofWindows: storeyOf(affected).roofWindows!.map((w) => {
                // Turned only with its roof (B2): then it follows the roof by itself.
                if (mirror !== undefined)
                  throw new Error("Dachflächenfenster spiegeln nur mit ihrem Dach.");
                if (!t.delta) throw new Error("Dachflächenfenster drehen nur mit ihrem Dach.");
                const delta = t.delta;
                const roof = storeyOf(base).roofs!.find((r) => r.id === w.roofId)!;
                const f = roofFrame(roof);
                return {
                  ...w,
                  along: w.along + delta.x * f.along.x + delta.y * f.along.y,
                  slope: w.slope + (delta.x * f.rise.x + delta.y * f.rise.y) / f.cos,
                };
              }),
            }
          : {}),
        // An object moves with its centre (docs/OBJEKTBIBLIOTHEK.md, O1).
        ...(storeyOf(affected).objects
          ? {
              objects: storeyOf(affected).objects!.map((o) => {
                if (mirror === undefined)
                  return {
                    ...o,
                    position: translate(o.position),
                    ...(turn ? { rotation: orient(o.rotation) } : {}),
                  };
                // Mirrored (B3): the flip across the depth axis toggles, the angle follows
                // as 2α − θ + 180°; a second mirror restores the object exactly.
                const { mirrored: wasMirrored, ...rest } = o;
                return {
                  ...rest,
                  position: translate(o.position),
                  rotation: turnedDegrees(2 * mirror - o.rotation, 180),
                  ...(wasMirrored ? {} : { mirrored: true }),
                };
              }),
            }
          : {}),
        // A stair moves with its start point (docs/TREPPE.md, TR2).
        ...(storeyOf(affected).stairs
          ? {
              stairs: storeyOf(affected).stairs!.map((stair) => ({
                ...stair,
                start: translate(stair.start),
                ...(turn ? { direction: orient(stair.direction) } : {}),
                // Mirrored (B3): drawing axis and the turn of L and U swap sides.
                ...(mirror !== undefined && stair.axis
                  ? { axis: other(stair.axis, "left", "right") }
                  : {}),
                ...(mirror !== undefined &&
                (stair.turn || (stair.shape && stair.shape !== "straight"))
                  ? { turn: stair.turn === "right" ? ("left" as const) : ("right" as const) }
                  : {}),
              })),
            }
          : {}),
        ...(storeyOf(affected).texts
          ? {
              texts: storeyOf(affected).texts!.map((text) => {
                if (mirror === undefined)
                  return {
                    ...text,
                    position: translate(text.position),
                    ...(turn ? { rotation: orient(text.rotation) } : {}),
                  };
                // Mirrored (B3), the text stays readable: its block lands on the mirror side of
                // the point. A reading direction that would point left turns by 180° and swaps
                // left/right alignment; otherwise top/bottom anchoring swaps.
                const raw = orient(text.rotation);
                const flip = raw > 90 && raw <= 270;
                return {
                  ...text,
                  position: translate(text.position),
                  rotation: flip ? turnedDegrees(raw, 180) : raw,
                  ...(flip
                    ? { align: other(text.align, "left", "right") }
                    : { anchor: other(text.anchor, "top", "bottom") }),
                };
              }),
            }
          : {}),
        // Placed drawings move with their position; mask and size stay (docs/ZEICHNUNG.md).
        ...(storeyOf(affected).drawings
          ? {
              drawings: storeyOf(affected).drawings!.map((d) => ({
                ...d,
                position: translate(d.position),
              })),
            }
          : {}),
        ...(storeyOf(affected).dimensions
          ? {
              dimensions: storeyOf(affected).dimensions!.map((d) => {
                // Turned only in quarter turns (B2): an odd one swaps the orientation. Mirrored
                // only at axes in 45° steps (B3): a diagonal axis swaps it.
                const quarter = mirror === undefined ? t.degrees / 90 : mirror / 45;
                if (!Number.isInteger(quarter))
                  throw new Error(
                    mirror === undefined
                      ? "Maßketten drehen nur in 90°-Schritten."
                      : "Maßketten spiegeln nur an Achsen in 45°-Schritten.",
                  );
                const swap = Math.abs(quarter) % 2 === 1;
                const orientation = swap
                  ? d.orientation === "horizontal"
                    ? ("vertical" as const)
                    : ("horizontal" as const)
                  : d.orientation;
                const moved = translate(
                  d.orientation === "horizontal" ? { x: 0, y: d.offset } : { x: d.offset, y: 0 },
                );
                return {
                  ...d,
                  ...(swap ? { orientation } : {}),
                  points: d.points.map(translate),
                  offset: orientation === "horizontal" ? moved.y : moved.x,
                };
              }),
            }
          : {}),
        wallJoins: joins,
        wallTJunctions: tees,
      },
    };
    const localWalls = new Map(storeyOf(geometry).walls.map((w) => [w.id, w]));
    for (const join of joins)
      if (nodeCount(joinNodeKeys(join, (id) => localWalls.get(id)!)) !== 2)
        throw new Error("Mehrfachanschluss noch nicht unterstützt.");
    for (const wall of storeyOf(geometry).walls)
      if (!detachedEnd || wall.id === movingId) wallBody(wall);
    for (const line of storeyOf(geometry).lines!) validateLineGeometry(line);
    for (const hatch of storeyOf(geometry).hatches) hatchSchema.parse(hatch);
    for (const slab of storeyOf(geometry).slabs ?? []) slabSchema.parse(slab);
    for (const opening of storeyOf(geometry).slabOpenings ?? []) slabOpeningSchema.parse(opening);
    // A moved opening or slab keeps every opening of that slab inside it, already in the preview.
    const movedOpenings = storeyOf(geometry).slabOpenings ?? [];
    if (movedOpenings.length) {
      const now = <T extends { id: string }>(all: readonly T[], moved: readonly T[]) =>
        all.map((e) => moved.find((m) => m.id === e.id) ?? e);
      const slabs = now(s.slabs ?? [], storeyOf(geometry).slabs ?? []);
      const openings = now(s.slabOpenings ?? [], movedOpenings);
      for (const slabId of new Set(movedOpenings.map((o) => o.slabId))) {
        const problem = slabOpeningProblem(
          slabs.find((slab) => slab.id === slabId)!,
          openings.filter((o) => o.slabId === slabId),
        );
        if (problem) throw new Error(problem);
      }
    }
    for (const roof of storeyOf(geometry).roofs ?? []) roofSchema.parse(roof);
    for (const room of storeyOf(geometry).rooms ?? []) roomSchema.parse(room);
    for (const column of storeyOf(geometry).columns ?? []) columnSchema.parse(column);
    for (const stair of storeyOf(geometry).stairs ?? []) stairSchema.parse(stair);
    for (const railing of storeyOf(geometry).railings ?? []) railingSchema.parse(railing);
    for (const object of storeyOf(geometry).objects ?? []) objectSchema.parse(object);
    for (const w of storeyOf(geometry).roofWindows ?? []) roofWindowSchema.parse(w);
    for (const d of storeyOf(geometry).dimensions ?? []) dimensionSchema.parse(d);
    for (const t of storeyOf(geometry).texts ?? []) textSchema.parse(t);
    for (const d of storeyOf(geometry).drawings ?? []) placedDrawingSchema.parse(d);
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

  function materialize(t: PlanTransform) {
    const patch = evaluate(t);
    if (identityTransform(t)) return s;
    const replace = <T extends { id: string }>(all: readonly T[], changed: readonly T[]): T[] => {
      const byId = new Map(changed.map((e) => [e.id, e]));
      return all.map((e) => byId.get(e.id) ?? e);
    };
    return {
      ...s,
      walls: replace(s.walls, storeyOf(patch.geometry).walls),
      // Openings change only on mirrored walls (B3); a move or turn keeps the stored lists.
      ...(t.mirror !== undefined
        ? {
            windows: replace(s.windows, storeyOf(patch.geometry).windows),
            ...(s.doors ? { doors: replace(s.doors, storeyOf(patch.geometry).doors ?? []) } : {}),
          }
        : {}),
      ...(s.lines ? { lines: replace(s.lines, storeyOf(patch.geometry).lines!) } : {}),
      hatches: replace(s.hatches, storeyOf(patch.geometry).hatches),
      references: replace(s.references, storeyOf(patch.geometry).references),
      ...(s.slabs ? { slabs: replace(s.slabs, storeyOf(patch.geometry).slabs ?? []) } : {}),
      ...(s.slabOpenings
        ? { slabOpenings: replace(s.slabOpenings, storeyOf(patch.geometry).slabOpenings ?? []) }
        : {}),
      ...(s.roofs ? { roofs: replace(s.roofs, storeyOf(patch.geometry).roofs ?? []) } : {}),
      ...(s.rooms ? { rooms: replace(s.rooms, storeyOf(patch.geometry).rooms ?? []) } : {}),
      ...(s.columns ? { columns: replace(s.columns, storeyOf(patch.geometry).columns ?? []) } : {}),
      ...(s.stairs ? { stairs: replace(s.stairs, storeyOf(patch.geometry).stairs ?? []) } : {}),
      ...(s.railings
        ? { railings: replace(s.railings, storeyOf(patch.geometry).railings ?? []) }
        : {}),
      ...(s.objects ? { objects: replace(s.objects, storeyOf(patch.geometry).objects ?? []) } : {}),
      ...(s.roofWindows
        ? { roofWindows: replace(s.roofWindows, storeyOf(patch.geometry).roofWindows ?? []) }
        : {}),
      ...(s.texts ? { texts: replace(s.texts, storeyOf(patch.geometry).texts ?? []) } : {}),
      ...(s.drawings
        ? { drawings: replace(s.drawings, storeyOf(patch.geometry).drawings ?? []) }
        : {}),
      ...(s.dimensions
        ? { dimensions: replace(s.dimensions, storeyOf(patch.geometry).dimensions ?? []) }
        : {}),
      wallJoins: t.mirror === undefined ? retainedJoins : mirrored.joins,
      wallTJunctions: t.mirror === undefined ? retainedTees : mirrored.tees,
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
      ...(s.doors ?? []),
      ...(s.slabs ?? []),
      ...(s.slabOpenings ?? []),
      ...(s.roofs ?? []),
      ...(s.rooms ?? []),
      ...(s.columns ?? []),
      ...(s.stairs ?? []),
      ...(s.railings ?? []),
      ...(s.objects ?? []),
      ...(s.roofWindows ?? []),
      ...(s.dimensions ?? []),
      ...(s.texts ?? []),
      ...(s.drawings ?? []),
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
  /** Any plan transform (B2: turn about a point), with the move's checks and joins. */
  const evaluateTransform = (t: PlanTransform): GeometryPreview => {
    if (parts.length === 1 && parts[0]!.id === activeId) return parts[0]!.action.evaluate(t);
    const patches = parts.map((p) => ({ storeyId: p.id, ...p.action.evaluate(t) }));
    const active = patches.find((p) => p.storeyId === activeId) ?? empty;
    return { ...active, storeyPatches: patches };
  };
  const materializeTransform = (current: Project, t: PlanTransform): Project => {
    snapshot.assertCurrent(current);
    const changed = new Map(parts.map((p) => [p.id, p.action.materialize(t)]));
    if (identityTransform(t)) return current;
    return validateProject({ ...base, storeys: base.storeys.map((s) => changed.get(s.id) ?? s) });
  };
  return Object.freeze({
    replacedIds: parts.find((p) => p.id === activeId)?.action.replacedIds ?? [],
    evaluate: (delta: Point): GeometryPreview => evaluateTransform(translationTransform(delta)),
    materialize: (current: Project, delta: Point): Project =>
      materializeTransform(current, translationTransform(delta)),
    evaluateTransform,
    materializeTransform,
  });
}

/** Single active-storey API retains its selection contract. */
export function prepareTranslation(source: Project, selectedIds: readonly string[]) {
  const s = storeyOf(source);
  const available = new Set(
    [
      ...s.walls,
      ...s.windows,
      ...(s.doors ?? []),
      ...(s.slabs ?? []),
      ...(s.slabOpenings ?? []),
      ...(s.roofs ?? []),
      ...(s.rooms ?? []),
      ...(s.columns ?? []),
      ...(s.stairs ?? []),
      ...(s.railings ?? []),
      ...(s.objects ?? []),
      ...(s.roofWindows ?? []),
      ...(s.dimensions ?? []),
      ...(s.texts ?? []),
      ...(s.drawings ?? []),
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
    ].map((e) => e.id),
  );
  if (selectedIds.some((id) => !available.has(id))) throw new Error("Ungültige Bewegungsauswahl.");
  return prepareStoreysTranslation(source, selectedIds);
}
