import { z } from "zod";
const id = z.string().trim().min(1);
export const modelViewSchema = z
  .object({
    id,
    kind: z.literal("floor-plan"),
    storeyId: id,
  })
  .strict();
export const drawingDocumentSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(120),
    modelViewId: id,
    denominator: z.number().finite().positive(),
    hiddenLayerIds: z.array(id),
  })
  .strict();
export type DrawingDocument = z.infer<typeof drawingDocumentSchema>;
