/**
 * Display settings of the pictograms (docs/WERKZEUGLEISTE.md, WL4): size, colours and duotone
 * face. A presentation preference of this browser, never part of a project and no undo step.
 * Applied as CSS variables on the document root, read by Pictogram.tsx and styles.css.
 */
export type PictogramSettings = {
  /** Factor on the base sizes (rail 24 px, constructions 22 px, navigator 18 px). */
  scale: number;
  /** Active colour on light and on dark surfaces. */
  activeLight: string;
  activeDark: string;
  /** Inactive line colour; null follows the text colour. */
  line: string | null;
  /** Opacity of the duotone face of inactive pictograms. */
  duotone: number;
};

export const PICTOGRAM_SCALE = { min: 0.75, max: 1.25, step: 0.05 } as const;
export const PICTOGRAM_DUOTONE = { min: 0, max: 0.5, step: 0.05 } as const;
/** The values of the package (farben.json), with the darker turquoise it advises for light
 * surfaces. */
export const DEFAULT_PICTOGRAM_SETTINGS: PictogramSettings = {
  scale: 1,
  activeLight: "#0e9aa0",
  activeDark: "#42d9df",
  line: null,
  duotone: 0.2,
};

const HEX = /^#[0-9a-f]{6}$/i;
const clamp = (value: unknown, range: { min: number; max: number }, fallback: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(range.max, Math.max(range.min, value))
    : fallback;
const colour = (value: unknown, fallback: string) =>
  typeof value === "string" && HEX.test(value) ? value.toLowerCase() : fallback;

/** Stored value back to settings; anything unknown falls back to the default. */
export function parsePictogramSettings(raw: unknown): PictogramSettings {
  const d = DEFAULT_PICTOGRAM_SETTINGS;
  if (!raw || typeof raw !== "object") return d;
  const v = raw as Record<string, unknown>;
  return {
    scale: clamp(v["scale"], PICTOGRAM_SCALE, d.scale),
    activeLight: colour(v["activeLight"], d.activeLight),
    activeDark: colour(v["activeDark"], d.activeDark),
    line: v["line"] === null || v["line"] === undefined ? null : colour(v["line"], "") || null,
    duotone: clamp(v["duotone"], PICTOGRAM_DUOTONE, d.duotone),
  };
}

/** The CSS variables of the settings; a null value removes the variable (default applies). */
export function pictogramVariables(s: PictogramSettings): Record<string, string | null> {
  return {
    "--pikto-scale": String(s.scale),
    "--pikto-aktiv-hell": s.activeLight,
    "--pikto-aktiv-dunkel": s.activeDark,
    "--pikto-linie": s.line,
    "--pikto-duoton": String(s.duotone),
  };
}
