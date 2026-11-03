import { z } from "zod";
import type { Point2 } from "../../../geometry/primitives/point.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { contains } from "../../../geometry/polygons/contains.ts";
import type { Slab } from "./model.ts";

export const MAX_SLAB_OPENING_POINTS = 1000;

/**
 * Deckendurchbruch (schema 51, docs/DECKENDURCHBRUCH.md, L40): an opening through the whole
 * thickness of one slab of the same storey, like a window in its wall. Own element with its
 * own layer; the slab keeps its outline, the opening is cut from it in 3D, section and IFC.
 * points: simple outline in model metres, any winding, strictly inside the slab.
 */
export const slabOpeningSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    slabId: z.string().trim().min(1),
    points: z
      .array(z.object({ x: z.number().finite(), y: z.number().finite() }).strict())
      .min(3)
      .max(MAX_SLAB_OPENING_POINTS),
  })
  .strict()
  .superRefine((opening, ctx) => {
    const result = validateSimplePolygon(opening.points);
    if (!result.valid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points"],
        message: `Ungültiger Umriss des Deckendurchbruchs: ${result.reason} (${result.indices.join(", ")})`,
      });
  });
export type SlabOpening = z.infer<typeof slabOpeningSchema>;

const cross = (o: Point2, a: Point2, b: Point2) =>
  (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
/** Proper or touching intersection of two segments (collinear overlap included). */
function segmentsMeet(a: Point2, b: Point2, c: Point2, d: Point2) {
  const d1 = cross(c, d, a),
    d2 = cross(c, d, b),
    d3 = cross(a, b, c),
    d4 = cross(a, b, d);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)))
    return true;
  const on = (p: Point2, q: Point2, r: Point2) =>
    Math.min(p.x, q.x) <= r.x &&
    r.x <= Math.max(p.x, q.x) &&
    Math.min(p.y, q.y) <= r.y &&
    r.y <= Math.max(p.y, q.y);
  return (
    (d1 === 0 && on(c, d, a)) ||
    (d2 === 0 && on(c, d, b)) ||
    (d3 === 0 && on(a, b, c)) ||
    (d4 === 0 && on(a, b, d))
  );
}
const edges = (ring: readonly Point2[]) =>
  ring.map((p, i) => [p, ring[(i + 1) % ring.length]!] as const);
/** The rings neither cross nor touch. */
const apart = (a: readonly Point2[], b: readonly Point2[]) =>
  !edges(a).some(([p, q]) => edges(b).some(([r, s]) => segmentsMeet(p, q, r, s)));

/**
 * Why the openings do not fit their slab, or null. Each opening lies strictly inside its slab
 * (no shared edge or point, so the slab stays one piece with holes); openings of one slab
 * neither overlap nor touch.
 */
export function slabOpeningProblem(
  slab: Pick<Slab, "points">,
  openings: readonly Pick<SlabOpening, "id" | "points">[],
): string | null {
  for (const [index, opening] of openings.entries()) {
    if (!apart(opening.points, slab.points) || !contains(slab.points, opening.points[0]!))
      return `Deckendurchbruch ${opening.id} liegt nicht ganz in der Decke.`;
    for (const other of openings.slice(0, index))
      if (
        !apart(opening.points, other.points) ||
        contains(other.points, opening.points[0]!) ||
        contains(opening.points, other.points[0]!)
      )
        return `Deckendurchbrüche ${other.id} und ${opening.id} überschneiden sich.`;
  }
  return null;
}

/** Plan area in square metres. */
export function slabOpeningArea(opening: Pick<SlabOpening, "points">): number {
  const result = validateSimplePolygon(opening.points);
  return result.valid ? Math.abs(result.signedArea) : 0;
}

/**
 * Plan symbol after DIN 1356-1: both diagonals of the opening. A quadrilateral joins its
 * opposite corners; any other outline uses the diagonals of its bounding box, kept to the
 * parts inside the outline.
 */
export function slabOpeningCross(points: readonly Point2[]): [Point2, Point2][] {
  if (points.length === 4)
    return [
      [points[0]!, points[2]!],
      [points[1]!, points[3]!],
    ];
  const xs = points.map((p) => p.x),
    ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return [
    ...insideParts(points, { x: x0, y: y0 }, { x: x1, y: y1 }),
    ...insideParts(points, { x: x0, y: y1 }, { x: x1, y: y0 }),
  ];
}
/** Pieces of segment a–b inside the ring. */
function insideParts(ring: readonly Point2[], a: Point2, b: Point2): [Point2, Point2][] {
  const at = (t: number) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  const ts = [0, 1];
  for (const [p, q] of edges(ring)) {
    const denom = (b.x - a.x) * (q.y - p.y) - (b.y - a.y) * (q.x - p.x);
    if (denom === 0) continue;
    const t = ((p.x - a.x) * (q.y - p.y) - (p.y - a.y) * (q.x - p.x)) / denom;
    const u = ((p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x)) / denom;
    if (t > 0 && t < 1 && u >= 0 && u <= 1) ts.push(t);
  }
  ts.sort((m, n) => m - n);
  const parts: [Point2, Point2][] = [];
  for (let i = 0; i + 1 < ts.length; i++)
    if (ts[i + 1]! - ts[i]! > 1e-9 && contains(ring, at((ts[i]! + ts[i + 1]!) / 2)))
      parts.push([at(ts[i]!), at(ts[i + 1]!)]);
  return parts;
}
