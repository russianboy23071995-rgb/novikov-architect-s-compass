import type { Point2 } from "../../../geometry/primitives/point.ts";
import { contains } from "../../../geometry/polygons/contains.ts";
import { triangulateSimplePolygon } from "../../../geometry/polygons/triangulate.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { roofFrame, roofUndersideAt, type RoofGeometryInput } from "../roof/geometry.ts";
import type { Slab } from "../slab/model.ts";

/** Default height lines of a room in metres above its floor (user decision 29.10.2026). */
export const ROOM_HEIGHT_LINES = [1, 2] as const;
export const MAX_ROOM_HEIGHT_LINES = 5;
export const MIN_ROOM_HEIGHT_LINE = 0.1;
export const MAX_ROOM_HEIGHT_LINE = 10;

/** Upper boundary of a room above the storey floor: flat (slab underside) or a roof plane. */
export type CeilingSource = {
  id: string;
  points: readonly Point2[];
  /** Underside height above the storey floor at a plan point. */
  at: (p: Point2) => number;
  /** Line in plan where the underside reaches `z`, as point and direction; none when flat. */
  levelLine?: (z: number) => { point: Point2; direction: Point2 };
};

/** Ceiling sources of one storey (docs/ROOM_ELEMENT.md, R3): its slabs (underside, needs the
 * storey height) and its roofs (underside plane). Only the own storey is read (A08). */
export function storeyCeilingSources(storey: {
  height?: number | null | undefined;
  slabs?: readonly Pick<Slab, "id" | "points" | "thickness" | "topOffset">[] | undefined;
  roofs?: readonly (RoofGeometryInput & { id: string })[] | undefined;
}): CeilingSource[] {
  const sources: CeilingSource[] = [];
  const height = storey.height;
  if (typeof height === "number")
    for (const slab of storey.slabs ?? []) {
      const z = height + slab.topOffset - slab.thickness;
      sources.push({ id: slab.id, points: slab.points, at: () => z });
    }
  for (const roof of storey.roofs ?? []) {
    const frame = roofFrame(roof);
    sources.push({
      id: roof.id,
      points: roof.points,
      at: (p) => roofUndersideAt(roof, p),
      levelLine: (z) => {
        const run = (z - roof.referenceHeight) / frame.tan;
        return {
          point: { x: frame.origin.x + frame.rise.x * run, y: frame.origin.y + frame.rise.y * run },
          direction: frame.along,
        };
      },
    });
  }
  return sources;
}

export type RoomHeightZone = {
  /** Clear height range [from, to) in metres; to = null for the open top zone. */
  from: number | null;
  to: number | null;
  area: number;
};
export type RoomHeightLine = { start: Point2; end: Point2; levels: number[] };
export type RoomHeightField = {
  /** Floor above the storey floor: the optional floor build-up, else 0 (raw floor). */
  floor: number;
  /** Smallest and largest clear height over the covered part; null when nothing is covered. */
  min: number | null;
  max: number | null;
  /** Areas between the height lines, lowest first (below the first line … above the last). */
  zones: RoomHeightZone[];
  /** Part of the room without slab or roof above it: no height source (N34). */
  openArea: number;
  openPieces: Point2[][];
  lines: RoomHeightLine[];
};

type Line = { point: Point2; normal: Point2 };
const EPS = 1e-9;
const SIDE = 1e-6;

function area(ring: readonly Point2[]) {
  let a = 0;
  for (let i = 0; i < ring.length; i++) {
    const p = ring[i]!,
      q = ring[(i + 1) % ring.length]!;
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

function centroid(ring: readonly Point2[]): Point2 {
  let x = 0,
    y = 0;
  for (const p of ring) {
    x += p.x;
    y += p.y;
  }
  return { x: x / ring.length, y: y / ring.length };
}

/** Splits a convex polygon by a line; pieces keep counterclockwise order. */
function split(piece: Point2[], line: Line): Point2[][] {
  const d = piece.map(
    (p) => (p.x - line.point.x) * line.normal.x + (p.y - line.point.y) * line.normal.y,
  );
  if (d.every((v) => v >= -EPS) || d.every((v) => v <= EPS)) return [piece];
  const front: Point2[] = [],
    back: Point2[] = [];
  for (let i = 0; i < piece.length; i++) {
    const p = piece[i]!,
      q = piece[(i + 1) % piece.length]!;
    const dp = d[i]!,
      dq = d[(i + 1) % piece.length]!;
    if (dp >= -EPS) front.push(p);
    if (dp <= EPS) back.push(p);
    if ((dp > EPS && dq < -EPS) || (dp < -EPS && dq > EPS)) {
      const t = dp / (dp - dq);
      const cut = { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
      front.push(cut);
      back.push(cut);
    }
  }
  return [front, back].filter((ring) => ring.length >= 3 && area(ring) > EPS);
}

function lineThrough(a: Point2, b: Point2): Line | null {
  const length = Math.hypot(b.x - a.x, b.y - a.y);
  if (length < EPS) return null;
  return { point: a, normal: { x: -(b.y - a.y) / length, y: (b.x - a.x) / length } };
}

function boxOverlaps(points: readonly Point2[], box: readonly number[]) {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  return !(x0 > box[2]! || x1 < box[0]! || y0 > box[3]! || y1 < box[1]!);
}

/**
 * Clear height field of a room (docs/ROOM_ELEMENT.md, R3). The ceiling at a point is the lowest
 * underside of all sources above it; the clear height is that minus the floor. The room is
 * triangulated and every triangle is split by all source edges and all lines where a roof
 * underside reaches a height line, so every convex piece lies in one zone and under one fixed
 * set of sources: areas are exact and the height lines are the piece edges between zones.
 */
export function roomHeightField(
  room: {
    points: readonly Point2[];
    floorBuildUp?: number | undefined;
    heightLines?: readonly number[] | undefined;
  },
  sources: readonly CeilingSource[],
): RoomHeightField {
  const floor = room.floorBuildUp ?? 0;
  const levels = [...(room.heightLines ?? ROOM_HEIGHT_LINES)].sort((a, b) => a - b);
  const valid = validateSimplePolygon(room.points);
  const outline = valid.valid && valid.signedArea < 0 ? [...room.points].reverse() : room.points;
  const box = [Infinity, Infinity, -Infinity, -Infinity];
  for (const p of outline) {
    box[0] = Math.min(box[0]!, p.x);
    box[1] = Math.min(box[1]!, p.y);
    box[2] = Math.max(box[2]!, p.x);
    box[3] = Math.max(box[3]!, p.y);
  }
  const relevant = sources.filter((s) => s.points.length >= 3 && boxOverlaps(s.points, box));
  const lines: Line[] = [];
  for (const source of relevant) {
    source.points.forEach((a, i) => {
      const line = lineThrough(a, source.points[(i + 1) % source.points.length]!);
      if (line) lines.push(line);
    });
    if (source.levelLine)
      for (const h of levels) {
        const { point, direction } = source.levelLine(floor + h);
        lines.push({ point, normal: { x: -direction.y, y: direction.x } });
      }
  }
  let pieces: Point2[][] = triangulateSimplePolygon(outline).map(([i, j, k]) => {
    const tri = [outline[i]!, outline[j]!, outline[k]!];
    return area(tri) < 0 ? tri.reverse() : tri;
  });
  for (const line of lines) pieces = pieces.flatMap((piece) => split(piece, line));

  const covering = (p: Point2) => relevant.filter((s) => contains(s.points, p));
  const clearAt = (p: Point2, over: readonly CeilingSource[]) =>
    Math.min(...over.map((s) => s.at(p))) - floor;
  /** Zone index 0 … levels.length, or -1 without source. */
  const zoneOf = (clear: number | null) =>
    clear === null ? -1 : levels.filter((h) => clear >= h - EPS).length;
  const zoneAt = (p: Point2) => {
    const over = covering(p);
    return over.length ? zoneOf(clearAt(p, over)) : -1;
  };

  const zones: RoomHeightZone[] = Array.from({ length: levels.length + 1 }, (_, i) => ({
    from: i === 0 ? null : levels[i - 1]!,
    to: i === levels.length ? null : levels[i]!,
    area: 0,
  }));
  let openArea = 0,
    min: number | null = null,
    max: number | null = null;
  const openPieces: Point2[][] = [];
  const segments: RoomHeightLine[] = [];
  for (const piece of pieces) {
    const c = centroid(piece);
    const over = covering(c);
    const a = area(piece);
    if (!over.length) {
      openArea += a;
      openPieces.push(piece);
      continue;
    }
    const zone = zoneOf(clearAt(c, over));
    zones[zone]!.area += a;
    for (const p of piece) {
      const clear = clearAt(p, over);
      min = min === null ? clear : Math.min(min, clear);
      max = max === null ? clear : Math.max(max, clear);
    }
    // Height lines: edges towards a higher zone inside the room, seen from the lower side.
    piece.forEach((p, i) => {
      const q = piece[(i + 1) % piece.length]!;
      const length = Math.hypot(q.x - p.x, q.y - p.y);
      if (length < SIDE) return;
      const outside = {
        x: (p.x + q.x) / 2 + ((q.y - p.y) / length) * SIDE,
        y: (p.y + q.y) / 2 - ((q.x - p.x) / length) * SIDE,
      };
      if (!contains(outline, outside)) return;
      const other = zoneAt(outside);
      if (other > zone) segments.push({ start: p, end: q, levels: levels.slice(zone, other) });
    });
  }
  return { floor, min, max, zones, openArea, openPieces, lines: mergeCollinear(segments) };
}

/** Joins touching collinear segments with the same levels, so dashes and labels run through. */
function mergeCollinear(segments: RoomHeightLine[]): RoomHeightLine[] {
  const result = [...segments];
  const near = (a: Point2, b: Point2) => Math.hypot(a.x - b.x, a.y - b.y) < SIDE;
  const collinear = (s: RoomHeightLine, p: Point2) =>
    Math.abs(
      (s.end.x - s.start.x) * (p.y - s.start.y) - (s.end.y - s.start.y) * (p.x - s.start.x),
    ) /
      Math.max(Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y), EPS) <
    SIDE;
  for (let joined = true; joined;) {
    joined = false;
    outer: for (let i = 0; i < result.length; i++)
      for (let j = i + 1; j < result.length; j++) {
        const s = result[i]!,
          t = result[j]!;
        if (s.levels.join() !== t.levels.join() || !collinear(s, t.start) || !collinear(s, t.end))
          continue;
        const ends: [Point2, Point2] | null = near(s.end, t.start)
          ? [s.start, t.end]
          : near(t.end, s.start)
            ? [t.start, s.end]
            : near(s.end, t.end)
              ? [s.start, t.start]
              : near(s.start, t.start)
                ? [s.end, t.end]
                : null;
        if (!ends) continue;
        result[i] = { start: ends[0], end: ends[1], levels: s.levels };
        result.splice(j, 1);
        joined = true;
        break outer;
      }
  }
  return result;
}
