import { hslToHex } from "./color.ts";

/**
 * The standard palette of every colour field (docs/FARBEN.md, F1): nine rows of six tones from
 * dark to light. The third tone of a coloured row is its full colour; the two lightest are pale
 * tones for faces and hatches. Fixed in the program, not part of a project file.
 */
export type PaletteColor = { name: string; hex: string };
export type PaletteRow = { name: string; colors: PaletteColor[] };

/** Hue, saturation and lightness of the full colour (tone 3) of each coloured row. */
const HUES = [
  ["Rot", 0, 0.78, 0.5],
  ["Orange", 28, 0.9, 0.52],
  ["Gelb", 50, 0.95, 0.52],
  ["Grün", 125, 0.55, 0.4],
  ["Türkis", 182, 0.78, 0.36],
  ["Blau", 212, 0.72, 0.45],
  ["Violett", 275, 0.5, 0.47],
  ["Braun", 25, 0.48, 0.34],
] as const;

/** Lightness of the six tones from the full colour L: two darker, three lighter. */
const tones = (l: number) => [
  l * 0.45,
  l * 0.72,
  l,
  l + (1 - l) * 0.3,
  l + (1 - l) * 0.58,
  l + (1 - l) * 0.82,
];

const GREYS: PaletteColor[] = [
  { name: "Schwarz", hex: "#000000" },
  { name: "Grau 80 %", hex: "#333333" },
  { name: "Grau 60 %", hex: "#666666" },
  { name: "Grau 40 %", hex: "#999999" },
  { name: "Grau 20 %", hex: "#cccccc" },
  { name: "Weiß", hex: "#ffffff" },
];

export const STANDARD_PALETTE: readonly PaletteRow[] = [
  { name: "Schwarz bis Weiß", colors: GREYS },
  ...HUES.map(([name, h, s, l]) => ({
    name,
    colors: tones(l).map((lightness, i) => ({
      name: `${name} ${i + 1}`,
      hex: hslToHex(h, s, lightness),
    })),
  })),
];

/** Colours used last, newest first, without repeats (F2: „Zuletzt verwendet“). */
export const RECENT_COLORS = 8;
export function withRecent(list: readonly string[], hex: string): string[] {
  const colour = hex.toLowerCase();
  return [colour, ...list.filter((c) => c !== colour)].slice(0, RECENT_COLORS);
}

/** Own colours (F4: „Meine Farben“), oldest first, without repeats. */
export const OWN_COLORS = 16;
export function withOwn(list: readonly string[], hex: string): string[] {
  const colour = hex.toLowerCase();
  return list.includes(colour) ? [...list] : [...list, colour].slice(-OWN_COLORS);
}

/** A stored colour list back to valid colours; anything else is dropped. */
export function parseColorList(raw: unknown, max: number): string[] {
  if (!Array.isArray(raw)) return [];
  const colours = raw
    .filter((c): c is string => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c))
    .map((c) => c.toLowerCase());
  return [...new Set(colours)].slice(0, max);
}
