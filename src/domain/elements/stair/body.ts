import { triangulateSimplePolygon } from "../../../geometry/polygons/triangulate.ts";
import {
  frameAt,
  stairGeometry,
  stairLayout,
  stairProfile,
  type Stair,
  type StairFrame,
} from "./model.ts";

type Vec3 = [number, number, number];
/** A stair face in the storey solid; `stair` keeps it out of every wall-only path. */
export type StairFace = { wallId: string; vertices: Vec3[]; normal: Vec3; stair: true };
/** One closed part of a stair: a flight or the landing (IFC writes them separately). */
export type StairPart = { kind: "flight" | "landing"; faces: StairFace[]; volume: number };

/** A flight's side profile (steps on a stair slab) extruded across the flight width. */
function flightPart(
  id: string,
  frame: StairFrame,
  profile: { x: number; y: number }[],
  width: number,
  z0: number,
): StairPart {
  const { d, n } = frame;
  const w = width / 2;
  const at = (s: number, z: number, t: number): Vec3 => {
    const p = frameAt(frame, s, t);
    return [p.x, p.y, z0 + z];
  };
  const faces: StairFace[] = [];
  let area = 0;
  for (const [i, j, k] of triangulateSimplePolygon(profile)) {
    const [p, q, r] = [profile[i]!, profile[j]!, profile[k]!];
    area += ((q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y)) / 2;
    // Side at −w looks towards −n, side at +w towards +n; windings follow the outward normal.
    faces.push({
      wallId: id,
      vertices: [at(p.x, p.y, -w), at(r.x, r.y, -w), at(q.x, q.y, -w)],
      normal: [-n.x, -n.y, 0],
      stair: true,
    });
    faces.push({
      wallId: id,
      vertices: [at(p.x, p.y, w), at(q.x, q.y, w), at(r.x, r.y, w)],
      normal: [n.x, n.y, 0],
      stair: true,
    });
  }
  for (let i = 0; i < profile.length; i++) {
    const p = profile[i]!,
      q = profile[(i + 1) % profile.length]!;
    const ds = q.x - p.x,
      dz = q.y - p.y;
    const length = Math.hypot(ds, dz);
    if (length < 1e-12) continue;
    // Outward normal of a counterclockwise profile edge in (s, z): (dz, −ds).
    const ns = dz / length,
      nz = -ds / length;
    faces.push({
      wallId: id,
      vertices: [at(p.x, p.y, -w), at(q.x, q.y, -w), at(q.x, q.y, w), at(p.x, p.y, w)],
      normal: [d.x * ns, d.y * ns, nz],
      stair: true,
    });
  }
  return { kind: "flight", faces, volume: Math.abs(area) * width };
}

/** Landing slab: the plan polygon (counterclockwise) between bottom and top. */
function landingPart(id: string, outline: { x: number; y: number }[], bottom: number, top: number) {
  const faces: StairFace[] = [
    { wallId: id, vertices: outline.map((p) => [p.x, p.y, top]), normal: [0, 0, 1], stair: true },
    {
      wallId: id,
      vertices: [...outline].reverse().map((p) => [p.x, p.y, bottom]),
      normal: [0, 0, -1],
      stair: true,
    },
  ];
  let area = 0;
  outline.forEach((p, i) => {
    const q = outline[(i + 1) % outline.length]!;
    area += (p.x * q.y - q.x * p.y) / 2;
    const length = Math.hypot(q.x - p.x, q.y - p.y);
    faces.push({
      wallId: id,
      vertices: [
        [p.x, p.y, bottom],
        [q.x, q.y, bottom],
        [q.x, q.y, top],
        [p.x, p.y, top],
      ],
      normal: [(q.y - p.y) / length, -(q.x - p.x) / length, 0],
      stair: true,
    });
  });
  return { kind: "landing" as const, faces, volume: Math.abs(area) * (top - bottom) };
}

/**
 * Closed solid stair (docs/TREPPE.md, TR1/TR3): every flight is its side profile (steps on a
 * stair slab) extruded across the flight width and starting at the height of its first riser;
 * an L or U adds the landing slab (stair slab thickness) at the top of the first flight. Foot
 * at the storey floor plus baseOffset. Null while the height is unknown.
 */
export function stairBody(
  stair: Omit<Stair, "layerId" | "renovation">,
  elevation: number,
  storeyHeight: number | null,
): { faces: StairFace[]; volume: number; parts: StairPart[] } | null {
  const g = stairGeometry(stair, storeyHeight);
  if (!g) return null;
  const layout = stairLayout(stair, g);
  const z0 = elevation + stair.baseOffset;
  const parts: StairPart[] = layout.flights.map((flight) =>
    flightPart(
      stair.id,
      flight.frame,
      stairProfile(
        {
          riserCount: flight.count,
          riser: g.riser,
          tread: g.tread,
          run: flight.run,
          rise: flight.count * g.riser,
        },
        stair.waist,
      ),
      stair.width,
      z0 + flight.first * g.riser,
    ),
  );
  if (layout.landing) {
    const top = z0 + g.flights[0]! * g.riser;
    parts.push(landingPart(stair.id, layout.landing, top - stair.waist, top));
  }
  return {
    faces: parts.flatMap((part) => part.faces),
    volume: parts.reduce((sum, part) => sum + part.volume, 0),
    parts,
  };
}
