/**
 * Line weights on paper (docs/PDF_EXPORT.md, P2): millimetres for one screen pixel of the drawing,
 * per pen the plan and section graphics name with `data-pen`. Relative weights inside a graphic
 * stay, a 1,75 px section cut comes out at 0,5 mm. Lines with their own pen width carry none.
 */
export const PDF_PENS = {
  cut: 0.5,
  view: 0.25,
  symbol: 0.18,
  fine: 0.13,
  section: 0.286,
} as const;
export type PdfPen = keyof typeof PDF_PENS;

const MM_PER_PIXEL = 25.4 / 96;

/** Factor on a width at 96 dpi; 1 without a known pen. */
export function penFactor(pen: string | null | undefined): number {
  const mm = pen && pen in PDF_PENS ? PDF_PENS[pen as PdfPen] : null;
  return mm === null ? 1 : mm / MM_PER_PIXEL;
}
