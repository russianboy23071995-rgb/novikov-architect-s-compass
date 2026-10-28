import { z } from "zod";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { resolveStoreyLevels, type StoreyHeight } from "../../storeys/heights.ts";

export const MAX_SLAB_POINTS = 10000;

/** Floor slab of a storey (schema 29, user decisions 28.10.2026).
 * A slab placed in a storey is that storey's ceiling: its top lies on the raw floor level of the
 * storey above (OK Rohfußboden, the storey's upperElevation) plus topOffset. The top is the
 * slab's reference; changing the thickness keeps the top and moves the underside.
 * points: simple outline in model metres, any winding, no holes yet.
 * Heights are derived from the storey levels only; no elevation is stored.
 */
export const slabSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    points: z
      .array(z.object({ x: z.number().finite(), y: z.number().finite() }).strict())
      .min(3)
      .max(MAX_SLAB_POINTS),
    thickness: z.number().finite().positive(),
    topOffset: z.number().finite(),
  })
  .strict()
  .superRefine((slab, ctx) => {
    const result = validateSimplePolygon(slab.points);
    if (!result.valid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points"],
        message: `Ungültiger Deckenumriss: ${result.reason} (${result.indices.join(", ")})`,
      });
  });
export type Slab = z.infer<typeof slabSchema>;

/** 0,20 m like the former raw slab assumption of the wall height binding. */
export const SLAB_DEFAULTS = { thickness: 0.2, topOffset: 0 } as const satisfies Partial<Slab>;

/** Top and underside above the project datum, or null while the storey height is unknown. */
export function slabLevels(
  slab: Pick<Slab, "thickness" | "topOffset">,
  upperElevation: number | null,
): { top: number; bottom: number } | null {
  if (upperElevation === null) return null;
  const top = upperElevation + slab.topOffset;
  return { top, bottom: top - slab.thickness };
}

/** Levels of a slab in its storey, from the project's storey sequence (never stored). */
export function storeySlabLevels(
  project: { storeys: readonly StoreyHeight[]; groundStoreyId: string; groundDatum?: number },
  storeyId: string,
  slab: Pick<Slab, "thickness" | "topOffset">,
) {
  const level = resolveStoreyLevels(
    project.storeys,
    project.groundStoreyId,
    project.groundDatum ?? 0,
  ).find((l) => l.storeyId === storeyId);
  return slabLevels(slab, level?.upperElevation ?? null);
}

/** Plan area in square metres. */
export function slabArea(slab: Pick<Slab, "points">): number {
  const result = validateSimplePolygon(slab.points);
  return result.valid ? Math.abs(result.signedArea) : 0;
}
