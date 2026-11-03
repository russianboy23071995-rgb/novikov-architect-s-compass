import { z } from "zod";
import type { Point2 } from "../../../geometry/primitives/point.ts";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { contains } from "../../../geometry/polygons/contains.ts";
import type { Slab } from "./model.ts";

export const MAX_SLAB_OPENING_POINTS = 1000;

const point = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const base = {
  id: z.string().trim().min(1),
  layerId: z.string().trim().min(1),
  slabId: z.string().trim().min(1),
};
const outline = z.array(point).min(3).max(MAX_SLAB_OPENING_POINTS);
const validOutline = (points: readonly Point2[] | undefined, ctx: z.RefinementCtx) => {
  if (!points) return;
  const result = validateSimplePolygon(points);
  if (!result.valid)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["points"],
      message: `Ungültiger Umriss des Deckendurchbruchs: ${result.reason} (${result.indices.join(", ")})`,
    });
};

/**
 * Deckendurchbruch (docs/DECKENDURCHBRUCH.md, L40): an opening through the whole thickness of
 * one slab of the same storey, like a window in its wall. Own element with its own layer; the
 * slab keeps its outline, the opening is cut from it in 3D, section and IFC.
 * Either `points` (simple outline in model metres, any winding) or, since schema 52, `circle`
 * (centre and diameter, a round opening); always strictly inside the slab.
 */
export const slabOpeningSchema = z
  .object({
    ...base,
    points: outline.optional(),
    circle: z
      .object({ center: point, diameter: z.number().finite().positive() })
      .strict()
      .optional(),
  })
  .strict()
  .superRefine((opening, ctx) => {
    if (!opening.points === !opening.circle)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points"],
        message: "Ein Deckendurchbruch hat entweder einen Umriss oder einen Kreis.",
      });
    validOutline(opening.points, ctx);
  });
export type SlabOpening = z.infer<typeof slabOpeningSchema>;
/** Schema 51: outline only. */
export const slabOpeningV51Schema = z
  .object({ ...base, points: outline })
  .strict()
  .superRefine((opening, ctx) => validOutline(opening.points, ctx));

/** Segments of the polygon that stands for a round opening. */
export const CIRCLE_SEGMENTS = 96;
/**
 * The outline every geometric path uses: the stored points, or for a circle the polygon around
 * it (corners outside, edges touching the circle), so a check on it never lets the circle
 * reach a slab edge or another opening. The corners sit half a step off the axes: a section
 * through the centre along x or y then never runs exactly through a corner.
 */
export function slabOpeningOutline(opening: Pick<SlabOpening, "points" | "circle">): Point2[] {
  if (opening.points) return opening.points;
  const { center, diameter } = opening.circle!;
  const r = diameter / 2 / Math.cos(Math.PI / CIRCLE_SEGMENTS);
  return Array.from({ length: CIRCLE_SEGMENTS }, (_, i) => {
    const a = (2 * Math.PI * (i + 0.5)) / CIRCLE_SEGMENTS;
    return { x: center.x + r * Math.cos(a), y: center.y + r * Math.sin(a) };
  });
}

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
 * neither overlap nor touch. Circles are checked by the polygon around them.
 */
export function slabOpeningProblem(
  slab: Pick<Slab, "points">,
  openings: readonly Pick<SlabOpening, "id" | "points" | "circle">[],
): string | null {
  const rings = openings.map(slabOpeningOutline);
  for (const [index, opening] of openings.entries()) {
    const ring = rings[index]!;
    if (!apart(ring, slab.points) || !contains(slab.points, ring[0]!))
      return `Deckendurchbruch ${opening.id} liegt nicht ganz in der Decke.`;
    for (const [k, other] of openings.slice(0, index).entries()) {
      const otherRing = rings[k]!;
      if (!apart(ring, otherRing) || contains(otherRing, ring[0]!) || contains(ring, otherRing[0]!))
        return `Deckendurchbrüche ${other.id} und ${opening.id} überschneiden sich.`;
    }
  }
  return null;
}

/** Plan area in square metres; a circle exactly. */
export function slabOpeningArea(opening: Pick<SlabOpening, "points" | "circle">): number {
  if (opening.circle) return Math.PI * (opening.circle.diameter / 2) ** 2;
  const result = validateSimplePolygon(opening.points!);
  return result.valid ? Math.abs(result.signedArea) : 0;
}

/** Depth of the black wedge: distance of its inner point to both sides, as a share of its legs. */
export const WEDGE_DEPTH = 0.12;

export type SlabOpeningSymbol =
  | { kind: "outline"; outline: Point2[]; wedge: Point2[] | null }
  | {
      kind: "circle";
      center: Point2;
      radius: number;
      /** Ends of the diameter that bounds the black half; the black arc runs through the upper left. */
      half: [Point2, Point2];
    };

/**
 * Plan symbol of a Deckendurchbruch after the template of the user (03.11.2026), symmetric
 * after the review of the same day. An outline gets a black wedge in its upper left corner (the
 * leftmost, of those the upper one): both legs run equally far along the two sides, as far as
 * the shorter of them; its inner point is the corner offset inward on the bisector, 12 % of a leg
 * from both sides. The wedge is mirrored at the bisector. If that point falls outside a narrow
 * outline, there is no wedge. A circle gets its upper left half in black, bounded by the
 * diameter from lower left to upper right.
 */
export function slabOpeningSymbol(
  opening: Pick<SlabOpening, "points" | "circle">,
): SlabOpeningSymbol {
  if (opening.circle) {
    const { center, diameter } = opening.circle;
    const radius = diameter / 2,
      d = radius / Math.SQRT2;
    return {
      kind: "circle",
      center,
      radius,
      half: [
        { x: center.x + d, y: center.y + d },
        { x: center.x - d, y: center.y - d },
      ],
    };
  }
  const ring = opening.points!;
  const n = ring.length;
  // The leftmost corner, of those the upper one (model y up): the upper left of a rectangle,
  // never the apex of a pointed outline.
  let corner = 0;
  ring.forEach((p, i) => {
    const c = ring[corner]!;
    if (p.x < c.x || (p.x === c.x && p.y > c.y)) corner = i;
  });
  const a = ring[corner]!,
    next = ring[(corner + 1) % n]!,
    prev = ring[(corner + n - 1) % n]!;
  const flat = (p: Point2) => Math.abs(p.x - a.x) / (Math.hypot(p.x - a.x, p.y - a.y) || 1);
  const [horizontal, vertical] = flat(next) >= flat(prev) ? [next, prev] : [prev, next];
  const unit = (p: Point2) => {
    const length = Math.hypot(p.x - a.x, p.y - a.y);
    return { x: (p.x - a.x) / length, y: (p.y - a.y) / length, length };
  };
  const u = unit(horizontal),
    v = unit(vertical);
  const leg = Math.min(u.length, v.length);
  const tip = (w: typeof u) => ({ x: a.x + leg * w.x, y: a.y + leg * w.y });
  // On the bisector at distance WEDGE_DEPTH·leg from both sides: depth / sin(half angle).
  const bisector = { x: u.x + v.x, y: u.y + v.y };
  const length = Math.hypot(bisector.x, bisector.y);
  const halfSin = Math.sqrt(Math.max(0, (1 - (u.x * v.x + u.y * v.y)) / 2));
  const reach = halfSin > 1e-9 && length > 1e-9 ? (WEDGE_DEPTH * leg) / halfSin : 0;
  const inner = {
    x: a.x + (bisector.x / length) * reach,
    y: a.y + (bisector.y / length) * reach,
  };
  return {
    kind: "outline",
    outline: ring,
    wedge: reach > 0 && contains(ring, inner) ? [a, tip(u), inner, tip(v)] : null,
  };
}
