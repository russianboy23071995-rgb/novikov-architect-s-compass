import { triangulateSimplePolygon } from "../../geometry/polygons/triangulate.ts";
import { slabLevels, type Slab } from "../../domain/elements/slab/model.ts";

type Vec3 = [number, number, number];
/** A slab face in the storey solid; `slab` keeps it out of every wall-only path. */
export type SlabFace = { wallId: string; vertices: Vec3[]; normal: Vec3; slab: true };

/**
 * Closed body of one ceiling slab (docs/SLAB_ELEMENT.md, Teil B): top on the raw floor of the
 * storey above plus offset, thickness downward. Top and underside as counterclockwise
 * triangles (non-convex outlines), one quad per outline edge. Null while the storey height
 * is unknown: no invented level.
 */
export function slabBody(
  slab: Pick<Slab, "id" | "points" | "thickness" | "topOffset">,
  upperElevation: number | null,
): { faces: SlabFace[]; volume: number } | null {
  const levels = slabLevels(slab, upperElevation);
  if (!levels) return null;
  const { top, bottom } = levels;
  const points = slab.points;
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i]!,
      b = points[(i + 1) % points.length]!;
    area += a.x * b.y - b.x * a.y;
  }
  const ring = area < 0 ? [...points].reverse() : points;
  const faces: SlabFace[] = [];
  const at = (i: number, z: number): Vec3 => [points[i]!.x, points[i]!.y, z];
  for (const [a, b, c] of triangulateSimplePolygon(points)) {
    faces.push({
      wallId: slab.id,
      vertices: [at(a, top), at(b, top), at(c, top)],
      normal: [0, 0, 1],
      slab: true,
    });
    faces.push({
      wallId: slab.id,
      vertices: [at(a, bottom), at(c, bottom), at(b, bottom)],
      normal: [0, 0, -1],
      slab: true,
    });
  }
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i]!,
      b = ring[(i + 1) % ring.length]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    faces.push({
      wallId: slab.id,
      vertices: [
        [a.x, a.y, bottom],
        [b.x, b.y, bottom],
        [b.x, b.y, top],
        [a.x, a.y, top],
      ],
      normal: [(b.y - a.y) / length, -(b.x - a.x) / length, 0],
      slab: true,
    });
  }
  return { faces, volume: (Math.abs(area) / 2) * (top - bottom) };
}
