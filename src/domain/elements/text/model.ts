import { z } from "zod";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);

/** Font families of the first stage: system families, nothing shipped (docs/TEXT.md, T1). */
export const TEXT_FONTS = ["sans", "serif", "mono"] as const;
export const TEXT_FONT_LABELS: Record<(typeof TEXT_FONTS)[number], string> = {
  sans: "Serifenlos",
  serif: "Mit Serifen",
  mono: "Nicht proportional",
};
export const TEXT_FONT_CSS: Record<(typeof TEXT_FONTS)[number], string> = {
  sans: '"Segoe UI", Arial, sans-serif',
  serif: '"Times New Roman", Georgia, serif',
  mono: 'Consolas, "Courier New", monospace',
};

/**
 * Text (schema 39, docs/TEXT.md, L12): a 2D annotation. `size` is the letter height either on
 * paper in millimetres (follows the output scale, like dimension chains) or in the model in
 * metres (fixed in the model). `position` is the insertion point; `align` and `anchor` say where
 * the text block sits relative to it; `rotation` in degrees counterclockwise.
 */
export const textSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    position: point,
    content: z
      .string()
      .max(5000)
      .refine((s) => s.trim().length > 0, "Ein Text braucht Inhalt."),
    font: z.enum(TEXT_FONTS),
    size: z.object({ unit: z.enum(["paper", "model"]), value: finite.positive() }).strict(),
    align: z.enum(["left", "center", "right"]),
    anchor: z.enum(["top", "middle", "bottom"]),
    rotation: finite,
    color: hex,
    // T2 (docs/TEXT.md): type style and decoration, all optional.
    bold: z.boolean().optional(),
    italic: z.boolean().optional(),
    underline: z.boolean().optional(),
    /** Filled box behind the text; padding as a multiple of the letter height. */
    background: z
      .object({ color: hex, padding: finite.min(0).max(5) })
      .strict()
      .optional(),
    /** Frame around the text box; width in paper millimetres. */
    frame: z
      .object({ color: hex, width: finite.positive().max(5) })
      .strict()
      .optional(),
    /** Halo around the letters (keeps text readable over hatches); width × letter height. */
    halo: z
      .object({ color: hex, width: finite.positive().max(1) })
      .strict()
      .optional(),
  })
  .strict();
export type PlanText = z.infer<typeof textSchema>;

export const TEXT_DEFAULTS = {
  font: "sans",
  size: { unit: "paper", value: 2.5 },
  align: "left",
  anchor: "bottom",
  rotation: 0,
  color: "#000000",
} as const satisfies Omit<PlanText, "id" | "layerId" | "position" | "content">;

/** Line spacing as a multiple of the letter height. */
export const TEXT_LINE_HEIGHT = 1.25;

/** Letter height in model metres at the given output scale (1:denominator). */
export function textHeight(text: Pick<PlanText, "size">, denominator: number): number {
  return text.size.unit === "paper" ? (text.size.value / 1000) * denominator : text.size.value;
}

export function textLines(text: Pick<PlanText, "content">): string[] {
  return text.content.split(/\r?\n/);
}

/**
 * Approximate block of the text in plan coordinates (counterclockwise corners): used for
 * selection and hit testing. The width estimate is 0,6 letter heights per character.
 */
export function textBox(
  text: Pick<PlanText, "position" | "content" | "size" | "align" | "anchor" | "rotation">,
  denominator: number,
): { x: number; y: number }[] {
  const h = textHeight(text, denominator);
  const lines = textLines(text);
  const width = Math.max(...lines.map((l) => l.length), 1) * h * 0.6;
  const height = h * (1 + (lines.length - 1) * TEXT_LINE_HEIGHT);
  const left = text.align === "left" ? 0 : text.align === "center" ? -width / 2 : -width;
  const bottom = text.anchor === "bottom" ? 0 : text.anchor === "middle" ? -height / 2 : -height;
  const angle = (text.rotation * Math.PI) / 180;
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  return [
    [left, bottom],
    [left + width, bottom],
    [left + width, bottom + height],
    [left, bottom + height],
  ].map(([u, v]) => ({
    x: text.position.x + u! * cos - v! * sin,
    y: text.position.y + u! * sin + v! * cos,
  }));
}

/** The same visible height in the other unit at 1:denominator (paper mm ↔ model m). */
export function convertTextSize(
  size: PlanText["size"],
  unit: PlanText["size"]["unit"],
  denominator: number,
): PlanText["size"] {
  if (size.unit === unit) return size;
  const metres = size.unit === "paper" ? (size.value / 1000) * denominator : size.value;
  const value = unit === "paper" ? (metres * 1000) / denominator : metres;
  return { unit, value: Math.round(value * 10000) / 10000 };
}

/** Decoration defaults when switched on (docs/TEXT.md, T2). */
export const TEXT_DECORATION_DEFAULTS = {
  background: { color: "#ffffff", padding: 0.3 },
  frame: { color: "#000000", width: 0.25 },
  halo: { color: "#ffffff", width: 0.15 },
} as const;

/**
 * Text block of the given width (model metres) widened by `padding` on every side; corners
 * counterclockwise in plan coordinates. The renderer passes measured widths; without them
 * textBox estimates.
 */
export function textBlock(
  text: Pick<PlanText, "position" | "content" | "size" | "align" | "anchor" | "rotation">,
  denominator: number,
  width: number,
  padding = 0,
): { x: number; y: number }[] {
  const h = textHeight(text, denominator);
  const lines = textLines(text);
  const height = h * (1 + (lines.length - 1) * TEXT_LINE_HEIGHT);
  const left = text.align === "left" ? 0 : text.align === "center" ? -width / 2 : -width;
  const bottom = text.anchor === "bottom" ? 0 : text.anchor === "middle" ? -height / 2 : -height;
  // Descenders of the last line lie below the baseline: about 0,25 letter heights.
  const descent = h * 0.25;
  const angle = (text.rotation * Math.PI) / 180;
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  return [
    [left - padding, bottom - descent - padding],
    [left + width + padding, bottom - descent - padding],
    [left + width + padding, bottom + height + padding],
    [left - padding, bottom + height + padding],
  ].map(([u, v]) => ({
    x: text.position.x + u! * cos - v! * sin,
    y: text.position.y + u! * sin + v! * cos,
  }));
}
