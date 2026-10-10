import { z } from "zod";
const id = z.string().trim().min(1);
export const modelViewSchema = z
  .object({
    id,
    kind: z.literal("floor-plan"),
    storeyId: id,
  })
  .strict();
export const drawingDocumentV17Schema = z
  .object({
    id,
    name: z.string().trim().min(1).max(120),
    modelViewId: id,
    denominator: z.number().finite().positive(),
    hiddenLayerIds: z.array(id),
  })
  .strict();

export const framingSchema = z
  .object({
    center: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
    width: z.number().finite().positive(),
    height: z.number().finite().positive(),
    pixelsPerMetre: z.number().finite().min(0.1).max(10000),
  })
  .strict()
  .superRefine((v, ctx) => {
    if (
      ![
        v.center.x - v.width / 2,
        v.center.x + v.width / 2,
        v.center.y - v.height / 2,
        v.center.y + v.height / 2,
      ].every(Number.isFinite)
    )
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Ungültiger Abbildbereich." });
  });
export type DocumentFraming = z.infer<typeof framingSchema>;
export const documentFolderSchema = z
  .object({ id, name: z.string().trim().min(1).max(120) })
  .strict();
export const drawingDocumentSchema = drawingDocumentV17Schema.extend({
  framing: framingSchema.optional(),
  folderId: id.optional(),
});
export type DrawingDocument = z.infer<typeof drawingDocumentSchema>;
