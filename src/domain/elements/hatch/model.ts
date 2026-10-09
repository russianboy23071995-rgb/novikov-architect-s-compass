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
export const solidHatchSchema = hatchBaseSchema
  .extend({ background: paintSchema, contour: paintSchema })
  .superRefine(validateContour);
const legacyPatternApplicationSchema = z
  .object({
    patternId: z.string().trim().min(1),
    mode: z.literal("model"),
    origin: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
  })
  .strict();
export const hatchV12Schema = hatchBaseSchema
  .extend({
    background: paintSchema,
    contour: paintSchema,
    pattern: legacyPatternApplicationSchema.nullable().optional(),
  })
  .superRefine(validateContour);
export const patternRotationSchema = z.number().finite().min(0).max(360);
export const hatchV15ApplicationSchema = legacyPatternApplicationSchema.extend({
  // Degrees counter-clockwise around the application origin; omission means 0.
  rotation: patternRotationSchema.optional(),
});
export const hatchV15Schema = hatchBaseSchema
  .extend({
    background: paintSchema,
    contour: paintSchema,
    pattern: hatchV15ApplicationSchema.nullable().optional(),
  })
  .superRefine(validateContour);
export type Hatch = z.infer<typeof hatchSchema>;

export const hatchPatternSizeSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("model"),
      modelWidthMetres: z.number().finite().positive().optional(),
    })
    .strict(),
  z.object({ mode: z.literal("paper"), paperWidthMetres: z.number().finite().positive() }).strict(),
]);
export type HatchPatternSize = z.infer<typeof hatchPatternSizeSchema>;
const commonApplication = hatchV15ApplicationSchema.omit({ mode: true });
export const hatchPatternApplicationSchema = z.union([
  commonApplication.extend({
    mode: z.literal("model"),
    modelWidthMetres: z.number().finite().positive().optional(),
  }),
  commonApplication.extend({
    mode: z.literal("paper"),
    paperWidthMetres: z.number().finite().positive(),
  }),
]);
export const hatchSchema = hatchBaseSchema
  .extend({
    background: paintSchema,
    contour: paintSchema,
    pattern: hatchPatternApplicationSchema.nullable().optional(),
  })
  .superRefine(validateContour);
