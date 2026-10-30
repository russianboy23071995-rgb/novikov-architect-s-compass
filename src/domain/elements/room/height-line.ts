import { z } from "zod";
import { validateLineStyle, type LineStyleDefinition } from "../line/style.ts";

export const MAX_ROOM_HEIGHT_LINES = 10;
export const MIN_ROOM_HEIGHT_LINE = 0.1;
export const MAX_ROOM_HEIGHT_LINE = 10;

/** Lower reference of a height line: the finished floor (raw floor plus the optional floor
 * build-up) or the raw floor (OK Rohfußboden). */
export const HEIGHT_LINE_LOWER = ["finishedFloor", "rawFloor"] as const;
/** Upper reference: the underside of slab or roof (clear height) or their outer face
 * (Außenkante Dachhaut / OK Decke), e.g. for a storey proof under a roof. */
export const HEIGHT_LINE_UPPER = ["underside", "outerSkin"] as const;
export type HeightLineLower = (typeof HEIGHT_LINE_LOWER)[number];
export type HeightLineUpper = (typeof HEIGHT_LINE_UPPER)[number];

const point = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
/** Embedded copy of a line style from the settings library, like custom drawing lines, so a
 * project file shows the same line on any computer. */
const heightLineStyleSchema = z
  .object({
    id: z.string().trim().min(1),
    name: z.string().trim().min(1).max(80),
    dashes: z.array(z.number().finite()).max(32),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    colorEditable: z.boolean().optional(),
    period: z.number().finite().positive().max(32000),
    segments: z
      .array(z.object({ start: point, end: point }).strict())
      .min(1)
      .max(128),
  })
  .strict()
  .superRefine((style, ctx) => {
    try {
      validateLineStyle(style as LineStyleDefinition);
    } catch (error) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: (error as Error).message });
    }
  });

/** One height line of a room (schema 34, docs/ROOM_ELEMENT.md, R3b). */
export const heightLineSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    height: z.number().finite().min(MIN_ROOM_HEIGHT_LINE).max(MAX_ROOM_HEIGHT_LINE),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    style: heightLineStyleSchema,
    lower: z.enum(HEIGHT_LINE_LOWER),
    upper: z.enum(HEIGHT_LINE_UPPER),
  })
  .strict()
  .superRefine((line, ctx) => {
    if (
      line.style.colorEditable === false &&
      line.color.toLowerCase() !== line.style.color.toLowerCase()
    )
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["color"],
        message: "Diese Linienart hat eine feste Farbe.",
      });
  });
export type HeightLine = z.infer<typeof heightLineSchema>;
export type HeightLineStyle = HeightLine["style"];

export const heightLineListSchema = z
  .array(heightLineSchema)
  .max(MAX_ROOM_HEIGHT_LINES)
  .refine((lines) => new Set(lines.map((l) => l.id)).size === lines.length, {
    message: "Jede Höhenlinie braucht eine eigene ID.",
  });

/** The built-in dashed style (same definition as the settings library). */
export const DEFAULT_HEIGHT_LINE_STYLE: HeightLineStyle = {
  id: "dashed",
  name: "Gestrichelt",
  dashes: [8, 5],
  color: "#334155",
  period: 13,
  segments: [{ start: { x: 0, y: 0 }, end: { x: 8, y: 0 } }],
};
export const DEFAULT_HEIGHT_LINE_COLOR = "#0369a1";

/** A clear-height line (finished floor to underside) with the default look. */
export function clearHeightLine(id: string, height: number): HeightLine {
  return {
    id,
    height,
    color: DEFAULT_HEIGHT_LINE_COLOR,
    style: structuredClone(DEFAULT_HEIGHT_LINE_STYLE),
    lower: "finishedFloor",
    upper: "underside",
  };
}

/** Defaults 1,00 and 2,00 m clear height (user decision 29.10.2026); not stored in rooms. */
export function defaultHeightLines(): HeightLine[] {
  return [clearHeightLine("h1", 1), clearHeightLine("h2", 2)];
}

/** Height lines of a room: its own list, or the defaults when it stores none. */
export function roomHeightLines(room: { heightLines?: readonly HeightLine[] | undefined }) {
  return room.heightLines ?? defaultHeightLines();
}

/** True when the list equals the defaults, so a room need not store it. */
export function isDefaultHeightLineList(lines: readonly HeightLine[]): boolean {
  return JSON.stringify(lines) === JSON.stringify(defaultHeightLines());
}

/** German labels for the references. */
export const HEIGHT_LINE_LOWER_LABELS: Record<HeightLineLower, string> = {
  finishedFloor: "OK Fußboden",
  rawFloor: "OK Rohfußboden",
};
export const HEIGHT_LINE_UPPER_LABELS: Record<HeightLineUpper, string> = {
  underside: "Unterseite (lichte Höhe)",
  outerSkin: "Außenkante Dachhaut",
};
