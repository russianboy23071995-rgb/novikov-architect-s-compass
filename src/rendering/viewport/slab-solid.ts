import {
  triangulatePolygonWithHoles,
  triangulateSimplePolygon,
} from "../../geometry/polygons/triangulate.ts";
import type { Point2 } from "../../geometry/primitives/point.ts";
import { slabLevels, type Slab } from "../../domain/elements/slab/model.ts";

type Vec3 = [number, number, number];
/** A slab face in the storey solid; `slab` keeps it out of every wall-only path. */
export type SlabFace = { wallId: string; vertices: Vec3[]; normal: Vec3; slab: true };

/**
 * Closed body of one ceiling slab (docs/SLAB_ELEMENT.md, Teil B): top on the raw floor of the
 * storey above plus offset, thickness downward. Top and underside as counterclockwise
 * triangles (non-convex outlines), one quad per outline edge. Null while the storey height
 * is unknown: no invented level. Openings (Deckendurchbrüche, docs/DECKENDURCHBRUCH.md) are
 * holes through the whole thickness with their own inner side faces; without openings the body
 * is exactly the former one.
 */
export function slabBody(
  slab: Pick<Slab, "id" | "points" | "thickness" | "topOffset">,
  upperElevation: number | null,
  holes: readonly (readonly Point2[])[] = [],
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
  const all = holes.length ? [...points, ...holes.flat()] : points;
  const at = (i: number, z: number): Vec3 => [all[i]!.x, all[i]!.y, z];
  const triangles = holes.length
    ? triangulatePolygonWithHoles(points, holes)
    : triangulateSimplePolygon(points);
  for (const [a, b, c] of triangles) {
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
  // Holes run clockwise: the same edge rule turns their side faces into the opening.
  const holeArea = (hole: readonly Point2[]) => {
    let sum = 0;
    for (let i = 0; i < hole.length; i++)
      sum +=
        hole[i]!.x * hole[(i + 1) % hole.length]!.y - hole[(i + 1) % hole.length]!.x * hole[i]!.y;
    return sum;
  };
  const rings = [ring, ...holes.map((hole) => (holeArea(hole) > 0 ? [...hole].reverse() : hole))];
  const cutAway = holes.reduce((sum, hole) => sum + Math.abs(holeArea(hole)), 0);
  for (const edgeRing of rings)
    for (let i = 0; i < edgeRing.length; i++) {
      const a = edgeRing[i]!,
        b = edgeRing[(i + 1) % edgeRing.length]!;
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
  return { faces, volume: ((Math.abs(area) - cutAway) / 2) * (top - bottom) };
}
