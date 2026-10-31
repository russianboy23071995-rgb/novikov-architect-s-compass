import { triangulateSimplePolygon } from "../../../geometry/polygons/triangulate.ts";
import { stairFrame, stairGeometry, stairProfile, type Stair } from "./model.ts";

type Vec3 = [number, number, number];
/** A stair face in the storey solid; `stair` keeps it out of every wall-only path. */
export type StairFace = { wallId: string; vertices: Vec3[]; normal: Vec3; stair: true };

/**
 * Closed solid flight (docs/TREPPE.md, TR1): the side profile (steps on a stair slab) extruded
 * across the flight width, placed at the start along the direction, foot at the storey floor
 * plus baseOffset. Null while the height is unknown.
 */
export function stairBody(
  stair: Omit<Stair, "layerId" | "renovation">,
  elevation: number,
  storeyHeight: number | null,
): { faces: StairFace[]; volume: number } | null {
  const g = stairGeometry(stair, storeyHeight);
  if (!g) return null;
  const profile = stairProfile(g, stair.waist);
  const { origin, d, n } = stairFrame(stair);
  const w = stair.width / 2;
  const z0 = elevation + stair.baseOffset;
  const at = (s: number, z: number, t: number): Vec3 => [
    origin.x + d.x * s + n.x * t,
    origin.y + d.y * s + n.y * t,
    z0 + z,
  ];
  const faces: StairFace[] = [];
  let area = 0;
  for (const [i, j, k] of triangulateSimplePolygon(profile)) {
    const [p, q, r] = [profile[i]!, profile[j]!, profile[k]!];
    area += ((q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y)) / 2;
    // Side at −w looks towards −n, side at +w towards +n; windings follow the outward normal.
    faces.push({
      wallId: stair.id,
      vertices: [at(p.x, p.y, -w), at(r.x, r.y, -w), at(q.x, q.y, -w)],
      normal: [-n.x, -n.y, 0],
      stair: true,
    });
    faces.push({
      wallId: stair.id,
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
      wallId: stair.id,
      vertices: [at(p.x, p.y, -w), at(q.x, q.y, -w), at(q.x, q.y, w), at(p.x, p.y, w)],
      normal: [d.x * ns, d.y * ns, nz],
      stair: true,
    });
  }
  return { faces, volume: Math.abs(area) * stair.width };
}
