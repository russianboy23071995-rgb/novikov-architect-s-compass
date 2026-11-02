import { z } from "zod";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();

/**
 * A drawing placed on a layout (schema 50, docs/ZEICHNUNG.md, ZW1): a drawing document shown on
 * the paper at its own scale. `position` is where the document's frame centre lies on the paper
 * (paper metres, 1:1); the size follows from the document's frame and scale and is fixed here.
 * `mask` crops it: a rectangle relative to `position`, its four edges dragged by hand.
 */
export const placedDrawingSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    documentId: z.string().trim().min(1),
    position: point,
    mask: z
      .object({ x0: finite, y0: finite, x1: finite, y1: finite })
      .strict()
      .refine((m) => m.x1 - m.x0 > 1e-6 && m.y1 - m.y0 > 1e-6, "Die Maske braucht eine Fläche."),
  })
  .strict();
export type PlacedDrawing = z.infer<typeof placedDrawingSchema>;
export type DrawingMask = PlacedDrawing["mask"];

/** Paper size of a document frame at its scale, centred on the placement point (metres). */
export function frameMask(
  frame: { width: number; height: number },
  denominator: number,
): DrawingMask {
  const w = frame.width / denominator / 2,
    h = frame.height / denominator / 2;
  return { x0: -w, y0: -h, x1: w, y1: h };
}

/** The mask on the paper: its corners in paper metres. */
export function maskOnPaper(drawing: Pick<PlacedDrawing, "position" | "mask">) {
  const { position: p, mask: m } = drawing;
  return [
    { x: p.x + m.x0, y: p.y + m.y0 },
    { x: p.x + m.x1, y: p.y + m.y0 },
    { x: p.x + m.x1, y: p.y + m.y1 },
    { x: p.x + m.x0, y: p.y + m.y1 },
  ];
}
