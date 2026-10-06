import { z } from "zod";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";

/** A model-space 2D filled contour; metres, no volume, holes or pattern definition yet. */
const hatchBaseSchema = z
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
  .strict();

const validateContour = (hatch: { points: { x: number; y: number }[] }, ctx: z.RefinementCtx) => {
  const result = validateSimplePolygon(hatch.points);
  if (!result.valid)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["points"],
      message: `Invalid hatch contour: ${result.reason} (${result.indices.join(", ")})`,
    });
};

export const legacyHatchSchema = hatchBaseSchema.superRefine(validateContour);
const paintSchema = z
  .object({ visible: z.boolean(), color: z.string().regex(/^#[0-9a-fA-F]{6}$/) })
  .strict();
export const defaultHatchAppearance = {
  background: { visible: false, color: "#ffffff" },
  contour: { visible: false, color: "#64748b" },
};
export const hatchSchema = hatchBaseSchema
  .extend({ background: paintSchema, contour: paintSchema })
  .superRefine(validateContour);
export type Hatch = z.infer<typeof hatchSchema>;
