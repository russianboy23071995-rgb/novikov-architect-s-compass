import { z } from "zod";
import { roofFaceRings } from "./geometry.ts";
import { resolveStoreyLevels, type StoreyHeight } from "../../storeys/heights.ts";

export const MAX_ROOF_POINTS = 10000;
export const MIN_ROOF_PITCH = 1;
export const MAX_ROOF_PITCH = 80;

const point = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const cut = z.enum(["vertical", "perpendicular", "horizontal"]);

/**
 * Single inclined roof surface of a storey (schema 31, docs/ROOF_ELEMENT.md, user decisions
 * 29.10.2026). Stored once in the storey that owns it; heights are relative to that storey's
 * floor, so the roof moves with the storey elevation and nothing absolute is stored.
 * points: outer roof edge seen from above, simple polygon, any winding, no holes yet.
 * referenceLine/rise: the underside passes through the reference line at referenceHeight and
 * rises towards `rise` (left or right of start → end) with `pitch` degrees.
 * thickness: perpendicular to the roof surface. eaveCut/topCut: end faces of the edges parallel
 * to the reference line (verges are always vertical); see geometry.ts.
 */
export const roofSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    points: z.array(point).min(3).max(MAX_ROOF_POINTS),
    referenceLine: z.object({ start: point, end: point }).strict(),
    rise: z.enum(["left", "right"]),
    referenceHeight: z.number().finite(),
    pitch: z.number().finite().min(MIN_ROOF_PITCH).max(MAX_ROOF_PITCH),
    thickness: z.number().finite().positive(),
    eaveCut: cut,
    topCut: cut,
  })
  .strict()
  .superRefine((roof, ctx) => {
    // Every stored roof yields one valid closed body; no silently wrong 3D geometry.
    try {
      roofFaceRings(roof);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points"],
        message: error instanceof Error ? error.message : "Ungültiges Dach.",
      });
    }
  });
export type Roof = z.infer<typeof roofSchema>;

/** Tool start values: 35°, 0,24 m, reference line on the storey floor, vertical end faces. */
export const ROOF_DEFAULTS = {
  pitch: 35,
  thickness: 0.24,
  referenceHeight: 0,
  rise: "left",
  eaveCut: "vertical",
  topCut: "vertical",
} as const satisfies Partial<Roof>;

/** Elevation of the roof's storey floor above the project datum, never stored (A08). */
export function roofStoreyElevation(
  project: { storeys: readonly StoreyHeight[]; groundStoreyId: string; groundDatum?: number },
  storeyId: string,
): number | null {
  return (
    resolveStoreyLevels(project.storeys, project.groundStoreyId, project.groundDatum ?? 0).find(
      (l) => l.storeyId === storeyId,
    )?.elevation ?? null
  );
}
