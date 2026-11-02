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

/** The four mask edges a drawing is cropped by (ZW3). */
export const MASK_EDGES = ["left", "right", "bottom", "top"] as const;
export type MaskEdge = (typeof MASK_EDGES)[number];
/** Smallest mask: 5 × 5 mm on the paper. */
export const MIN_MASK = 0.005;
const EPSILON = 1e-9;

/** Grip of an edge: its midpoint on the paper. */
export function maskEdgeGrip(drawing: Pick<PlacedDrawing, "position" | "mask">, edge: MaskEdge) {
  const { position: p, mask: m } = drawing;
  const cx = (m.x0 + m.x1) / 2,
    cy = (m.y0 + m.y1) / 2;
  const local =
    edge === "left"
      ? { x: m.x0, y: cy }
      : edge === "right"
        ? { x: m.x1, y: cy }
        : edge === "bottom"
          ? { x: cx, y: m.y0 }
          : { x: cx, y: m.y1 };
  return { x: p.x + local.x, y: p.y + local.y };
}

/**
 * Moves one edge to `value` (relative to the drawing's position, along the edge's normal),
 * kept inside the document frame `limit` and at least MIN_MASK from the opposite edge.
 */
export function dragMaskEdge(
  mask: DrawingMask,
  edge: MaskEdge,
  value: number,
  limit: DrawingMask,
): DrawingMask {
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  if (edge === "left") return { ...mask, x0: clamp(value, limit.x0, mask.x1 - MIN_MASK) };
  if (edge === "right") return { ...mask, x1: clamp(value, mask.x0 + MIN_MASK, limit.x1) };
  if (edge === "bottom") return { ...mask, y0: clamp(value, limit.y0, mask.y1 - MIN_MASK) };
  return { ...mask, y1: clamp(value, mask.y0 + MIN_MASK, limit.y1) };
}

/** Why a mask is refused for this frame, or null when it fits. */
export function maskProblem(mask: DrawingMask, limit: DrawingMask): string | null {
  if (mask.x1 - mask.x0 < MIN_MASK - EPSILON || mask.y1 - mask.y0 < MIN_MASK - EPSILON)
    return "Die Maske braucht mindestens 5 × 5 mm.";
  if (
    mask.x0 < limit.x0 - EPSILON ||
    mask.y0 < limit.y0 - EPSILON ||
    mask.x1 > limit.x1 + EPSILON ||
    mask.y1 > limit.y1 + EPSILON
  )
    return "Die Maske reicht höchstens bis zum Ausschnitt des Abbilds.";
  return null;
}

/** How far each edge is cropped in from the frame (paper metres, 0 = full frame). */
export function maskCrop(mask: DrawingMask, limit: DrawingMask): Record<MaskEdge, number> {
  return {
    left: mask.x0 - limit.x0,
    right: limit.x1 - mask.x1,
    bottom: mask.y0 - limit.y0,
    top: limit.y1 - mask.y1,
  };
}

/** The mask for crops from the frame's edges (the inverse of `maskCrop`). */
export function maskFromCrop(limit: DrawingMask, crop: Record<MaskEdge, number>): DrawingMask {
  return {
    x0: limit.x0 + crop.left,
    x1: limit.x1 - crop.right,
    y0: limit.y0 + crop.bottom,
    y1: limit.y1 - crop.top,
  };
}
