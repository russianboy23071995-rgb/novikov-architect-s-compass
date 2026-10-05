import { z } from "zod";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";

/** A model-space 2D filled contour; metres, no volume, holes or pattern definition yet. */
export const hatchSchema = z
  .object({
    id: z.string().trim().min(1),
    kind: z.literal("hatch"),
    layerId: z.string().trim().min(1),
    points: z
      .array(z.object({ x: z.number().finite(), y: z.number().finite() }).strict())
      .min(3)
      .max(10000),
    fill: z
      .object({
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
        opacity: z.number().finite().min(0).max(1),
      })
      .strict(),
  })
  .strict()
  .superRefine((hatch, ctx) => {
    const result = validateSimplePolygon(hatch.points);
    if (!result.valid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points"],
        message: `Invalid hatch contour: ${result.reason} (${result.indices.join(", ")})`,
      });
  });
export type Hatch = z.infer<typeof hatchSchema>;
