import { z } from "zod";
import { WALL_RENOVATIONS } from "../wall/renovation.ts";
import { roofFaceRings, roofFrame, type RoofGeometryInput } from "./geometry.ts";
import { contains } from "../../../geometry/polygons/contains.ts";
import { ringsApart } from "../slab/opening.ts";
import type { Point2 } from "../../../geometry/primitives/point.ts";

const finite = z.number().finite();

export const ROOF_WINDOW_SIZE = { min: 0.3, max: 3 } as const;
export const ROOF_WINDOW_FRAME = { min: 0.03, max: 0.2 } as const;

/**
 * Roof window (Dachflächenfenster, schema 55, docs/DACHFLAECHENFENSTER.md, L41). It belongs to
 * one roof of its storey and lies in that roof's plane, sides parallel to the eave: `along` is
 * the distance of its centre along the reference line from its start, `slope` the distance on
 * the roof top from the reference line uphill. So it follows its roof when the roof moves.
 * `width` runs along the eave, `length` along the slope; the frame is `frame` wide all round.
 * The opening goes through the roof perpendicular to its surface.
 */
const roofWindowBase = z.object({
  id: z.string().trim().min(1),
  layerId: z.string().trim().min(1),
  roofId: z.string().trim().min(1),
  along: finite,
  slope: finite,
  width: finite.min(ROOF_WINDOW_SIZE.min).max(ROOF_WINDOW_SIZE.max),
  length: finite.min(ROOF_WINDOW_SIZE.min).max(ROOF_WINDOW_SIZE.max),
  frame: finite.min(ROOF_WINDOW_FRAME.min).max(ROOF_WINDOW_FRAME.max),
  renovation: z.enum(WALL_RENOVATIONS).optional(),
});
const frameFits = (w: { frame: number; width: number; length: number }) =>
  2 * w.frame < Math.min(w.width, w.length);
const FRAME_MESSAGE = "Der Rahmen eines Dachflächenfensters ist breiter als das Fenster.";

/** Upper reveal: square to the roof surface (default) or horizontal (Velux recommendation). */
export const ROOF_WINDOW_UPPER_REVEALS = ["square", "horizontal"] as const;
/** Lower reveal: square to the roof surface (default) or plumb (Velux recommendation). */
export const ROOF_WINDOW_LOWER_REVEALS = ["square", "plumb"] as const;
export type RoofWindowUpperReveal = (typeof ROOF_WINDOW_UPPER_REVEALS)[number];
export type RoofWindowLowerReveal = (typeof ROOF_WINDOW_LOWER_REVEALS)[number];

/** Schema 55 roof window: no reveal settings (all reveals square to the roof surface). */
export const roofWindowV55Schema = roofWindowBase.strict().refine(frameFits, FRAME_MESSAGE);
/**
 * Schema 56 (docs/DACHFLAECHENFENSTER.md, Laibung): the upper and lower reveal of the opening
 * may follow the Velux recommendation, the upper one horizontal and the lower one plumb, so
 * the opening widens towards the room. Missing means square to the roof surface.
 */
export const roofWindowSchema = roofWindowBase
  .extend({
    upperReveal: z.enum(ROOF_WINDOW_UPPER_REVEALS).optional(),
    lowerReveal: z.enum(ROOF_WINDOW_LOWER_REVEALS).optional(),
  })
  .strict()
  .refine(frameFits, FRAME_MESSAGE);
export type RoofWindow = z.infer<typeof roofWindowSchema>;

/** Tool start values: 78 × 118 cm, frame 6 cm (docs/DACHFLAECHENFENSTER.md). */
export const ROOF_WINDOW_DEFAULTS = { width: 0.78, length: 1.18, frame: 0.06 } as const;

type WindowPlace = Pick<RoofWindow, "along" | "slope" | "width" | "length">;
type WindowOpening = WindowPlace & Partial<Pick<RoofWindow, "upperReveal" | "lowerReveal">>;

/** The plan point of a place in the roof plane: `along` the reference line, `slope` on the top. */
function planPoint(roof: RoofGeometryInput, along: number, slope: number): Point2 {
  const f = roofFrame(roof);
  const run = slope * f.cos;
  return {
    x: f.origin.x + f.along.x * along + f.rise.x * run,
    y: f.origin.y + f.along.y * along + f.rise.y * run,
  };
}

/** The place in the roof plane of a plan point (inverse of planPoint). */
export function roofWindowPlace(
  roof: RoofGeometryInput,
  p: Point2,
): { along: number; slope: number } {
  const f = roofFrame(roof);
  const dx = p.x - f.origin.x,
    dy = p.y - f.origin.y;
  return { along: dx * f.along.x + dy * f.along.y, slope: (dx * f.rise.x + dy * f.rise.y) / f.cos };
}

/** Counterclockwise rectangle in plan of the window inset by `inset` on every side. */
function rectangle(roof: RoofGeometryInput, w: WindowPlace, inset = 0): Point2[] {
  const u = w.width / 2 - inset,
    s = w.length / 2 - inset;
  const ring = [
    planPoint(roof, w.along - u, w.slope - s),
    planPoint(roof, w.along + u, w.slope - s),
    planPoint(roof, w.along + u, w.slope + s),
    planPoint(roof, w.along - u, w.slope + s),
  ];
  let area = 0;
  ring.forEach((a, i) => {
    const b = ring[(i + 1) % 4]!;
    area += a.x * b.y - b.x * a.y;
  });
  return area < 0 ? ring.reverse() : ring;
}

/**
 * Plan rings of the opening on the roof top and on its underside (counterclockwise, the same
 * corner order). The opening runs perpendicular to the roof surface, so the underside ring is
 * the top ring moved uphill by thickness · sin(pitch). `inset` shrinks both (frame inner edge).
 */
export function roofWindowRings(
  roof: RoofGeometryInput,
  w: WindowPlace,
  inset = 0,
): { top: Point2[]; bottom: Point2[] } {
  const f = roofFrame(roof);
  const shift = roof.thickness * f.sin;
  const top = rectangle(roof, w, inset);
  return {
    top,
    bottom: top.map((p) => ({ x: p.x + f.rise.x * shift, y: p.y + f.rise.y * shift })),
  };
}

/**
 * Plan rings of the opening through the roof (docs/DACHFLAECHENFENSTER.md, Laibung): on the
 * roof top the window rectangle, on the underside its lower and upper edge moved uphill by
 * - square: thickness · sin(pitch) (perpendicular to the surface, as roofWindowRings),
 * - plumb (lower edge): 0, straight below the top edge,
 * - horizontal (upper edge): thickness / sin(pitch), level with the top edge.
 * The side reveals stay square. The frame and pane keep roofWindowRings (square).
 */
export function roofWindowOpening(
  roof: RoofGeometryInput,
  w: WindowOpening,
): { top: Point2[]; bottom: Point2[] } {
  const f = roofFrame(roof);
  const square = roof.thickness * f.sin;
  const lower = w.lowerReveal === "plumb" ? 0 : square;
  const upper = w.upperReveal === "horizontal" ? roof.thickness / f.sin : square;
  const top = rectangle(roof, w);
  return {
    top,
    bottom: top.map((p) => {
      const shift = roofWindowPlace(roof, p).slope > w.slope ? upper : lower;
      return { x: p.x + f.rise.x * shift, y: p.y + f.rise.y * shift };
    }),
  };
}

/**
 * Why the windows do not fit their roof, or null. Each opening lies strictly inside the roof's
 * top and underside faces (the roof stays one piece with holes); windows of one roof neither
 * overlap nor touch.
 */
export function roofWindowProblem(
  roof: RoofGeometryInput,
  windows: readonly (WindowOpening & { id: string })[],
): string | null {
  const faces = roofFaceRings(roof);
  const rings = windows.map((w) => roofWindowOpening(roof, w));
  for (const [index, window] of windows.entries()) {
    const { top, bottom } = rings[index]!;
    if (
      !ringsApart(top, faces.top) ||
      !contains(faces.top, top[0]!) ||
      !ringsApart(bottom, faces.bottom) ||
      !contains(faces.bottom, bottom[0]!)
    )
      return `Dachflächenfenster ${window.id} liegt nicht ganz in der Dachfläche.`;
    // Widened reveals may meet below the roof top, so both faces are compared.
    const apart = (a: Point2[], b: Point2[]) =>
      ringsApart(a, b) && !contains(b, a[0]!) && !contains(a, b[0]!);
    for (const [k, other] of windows.slice(0, index).entries())
      if (!apart(top, rings[k]!.top) || !apart(bottom, rings[k]!.bottom))
        return `Dachflächenfenster ${other.id} und ${window.id} überschneiden sich.`;
  }
  return null;
}
