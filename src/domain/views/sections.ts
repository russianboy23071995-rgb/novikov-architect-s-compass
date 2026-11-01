import { z } from "zod";

/**
 * Section (docs/SCHNITT.md, SC2): a cut line in plan that belongs to the building, not to a
 * storey, so it is drawn in any plan and shown in all of them. `look` is the viewing side
 * relative to the line from start to end. Name and mark (Kennung, e.g. "A" for "A-A") are free;
 * a repeated mark is reported, never refused.
 */
export const SECTION_LOOKS = ["left", "right"] as const;
export type SectionLook = (typeof SECTION_LOOKS)[number];

const point = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();

/**
 * Size of the section symbol in plan (SC4): letter height of the mark in paper mm (follows the
 * output scale) or model m; arrows and end strokes follow it. Never a screen size.
 */
export const sectionSymbolSizeSchema = z
  .object({ unit: z.enum(["paper", "model"]), value: z.number().finite().positive().max(1000) })
  .strict();
export type SectionSymbolSize = z.infer<typeof sectionSymbolSizeSchema>;
export const SECTION_SYMBOL_SIZE: SectionSymbolSize = { unit: "paper", value: 5 };

/** Letter height of the mark in model metres at 1:denominator. */
export function sectionSymbolHeight(
  size: SectionSymbolSize = SECTION_SYMBOL_SIZE,
  denominator: number,
): number {
  return size.unit === "paper" ? (size.value / 1000) * denominator : size.value;
}

/** The same visible size in the other unit at 1:denominator (paper mm ↔ model m). */
export function convertSectionSymbolSize(
  size: SectionSymbolSize,
  unit: SectionSymbolSize["unit"],
  denominator: number,
): SectionSymbolSize {
  if (size.unit === unit) return size;
  const metres = sectionSymbolHeight(size, denominator);
  const value = unit === "paper" ? (metres * 1000) / denominator : metres;
  return { unit, value: Math.round(value * 10000) / 10000 };
}

export const sectionSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().trim().min(1).max(120),
    mark: z.string().trim().min(1).max(12),
    start: point,
    end: point,
    look: z.enum(SECTION_LOOKS),
    symbolSize: sectionSymbolSizeSchema.optional(),
  })
  .strict()
  .refine((s) => Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y) > 1e-6, {
    message: "Die Schnittlinie braucht zwei verschiedene Punkte.",
  });
export type Section = z.infer<typeof sectionSchema>;

/** Mark sequences for new sections: A, B, … Z, AA, AB, … or 1, 2, 3, … */
export const SECTION_MARK_KINDS = ["letters", "numbers"] as const;
export type SectionMarkKind = (typeof SECTION_MARK_KINDS)[number];
export const SECTION_MARK_KIND_LABELS: Record<SectionMarkKind, string> = {
  letters: "Buchstaben A, B, C …",
  numbers: "Zahlen 1, 2, 3 …",
};

const letterMark = (n: number): string => {
  let mark = "";
  for (let k = n + 1; k > 0; k = Math.floor((k - 1) / 26))
    mark = String.fromCharCode(65 + ((k - 1) % 26)) + mark;
  return mark;
};

/** The first mark of the sequence that no section uses yet. */
export function nextSectionMark(sections: readonly Section[], kind: SectionMarkKind): string {
  const used = new Set(sections.map((s) => s.mark));
  for (let n = 0; ; n++) {
    const mark = kind === "letters" ? letterMark(n) : String(n + 1);
    if (!used.has(mark)) return mark;
  }
}

/** Default name of a section with this mark. */
export const sectionName = (prefix: string, mark: string) => `${prefix} ${mark}-${mark}`;

/** Marks used by more than one section (reported in the element window). */
export function repeatedSectionMarks(sections: readonly Section[]): Set<string> {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const s of sections) (seen.has(s.mark) ? repeated : seen).add(s.mark);
  return repeated;
}

/** Unit direction of the line and unit normal towards the viewing side. */
export function sectionFrame(section: Pick<Section, "start" | "end" | "look">) {
  const dx = section.end.x - section.start.x;
  const dy = section.end.y - section.start.y;
  const length = Math.hypot(dx, dy);
  const d = { x: dx / length, y: dy / length };
  const σ = section.look === "left" ? 1 : -1;
  return { d, view: { x: -d.y * σ, y: d.x * σ }, length };
}

/** Viewing side for a pointer: the side of the line it is on. */
export function sectionLookTo(
  start: { x: number; y: number },
  end: { x: number; y: number },
  point: { x: number; y: number },
): SectionLook {
  const cross = (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
  return cross >= 0 ? "left" : "right";
}
