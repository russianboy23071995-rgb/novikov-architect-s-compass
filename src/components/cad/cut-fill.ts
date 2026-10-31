/**
 * Fill of cut elements in plan (walls, roof cuts at the 1 m cut plane): grey as before, black,
 * white or an own colour (user decision 31.10.2026, docs/SCHNITTDARSTELLUNG.md). Presentation
 * preference only; never part of the project.
 */
export type CutFillMode = "grey" | "black" | "white" | "custom";
export type CutFill = { mode: CutFillMode; color: string };

export const CUT_FILL_MODES: { mode: CutFillMode; label: string }[] = [
  { mode: "grey", label: "Grau" },
  { mode: "black", label: "Schwarz" },
  { mode: "white", label: "Weiß" },
  { mode: "custom", label: "Eigene Farbe" },
];

export const defaultCutFill: CutFill = { mode: "grey", color: "#7f8792" };

const HEX = /^#[0-9a-f]{6}$/i;

/** Stored value back to a cut fill; anything unknown falls back to the default. */
export function parseCutFill(value: unknown): CutFill {
  if (!value || typeof value !== "object") return defaultCutFill;
  const { mode, color } = value as Record<string, unknown>;
  if (!CUT_FILL_MODES.some((m) => m.mode === mode)) return defaultCutFill;
  return {
    mode: mode as CutFillMode,
    color: typeof color === "string" && HEX.test(color) ? color : defaultCutFill.color,
  };
}

/** SVG paint of a cut: grey keeps the earlier theme-aware look, white keeps the contour alone. */
export function cutPaint(fill: CutFill): { fill: string; fillOpacity: number } {
  switch (fill.mode) {
    case "black":
      return { fill: "#000000", fillOpacity: 1 };
    case "white":
      return { fill: "#ffffff", fillOpacity: 1 };
    case "custom":
      return { fill: fill.color, fillOpacity: 1 };
    default:
      return { fill: "var(--muted-foreground)", fillOpacity: 0.55 };
  }
}
