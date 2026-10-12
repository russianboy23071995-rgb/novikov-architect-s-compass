import type { Point2 } from "../../../geometry/primitives/point.ts";
export type PatternLine = { start: Point2; end: Point2 };
export type PatternDraft = { width: number; height: number; lines: readonly PatternLine[] };
export const MAX_PATTERN_LINES = 256;
export function validatePatternDraft(draft: PatternDraft): void {
  if (!draft || !Array.isArray(draft.lines)) throw new Error("Ungültiger Musterentwurf.");
  if (![draft.width, draft.height].every((v) => Number.isFinite(v) && v >= 0.001 && v <= 100))
    throw new Error("Zellmaße müssen zwischen 0,001 und 100 m liegen.");
  if (draft.lines.length > MAX_PATTERN_LINES) throw new Error("Maximal 256 Musterlinien.");
  for (const line of draft.lines) {
    if (!line?.start || !line?.end) throw new Error("Ungültige Musterlinie.");
    for (const p of [line.start, line.end])
      if (
        ![p.x, p.y].every(Number.isFinite) ||
        p.x < 0 ||
        p.y < 0 ||
        p.x > draft.width ||
        p.y > draft.height
      )
        throw new Error("Musterlinien müssen innerhalb der Zelle liegen.");
    if (Math.hypot(line.end.x - line.start.x, line.end.y - line.start.y) < 1e-8)
      throw new Error("Eine Musterlinie benötigt zwei verschiedene Punkte.");
  }
}

export type HatchPatternDefinition = PatternDraft & { id: string; name: string };
export function validateHatchPattern(pattern: HatchPatternDefinition): HatchPatternDefinition {
  if (
    !pattern ||
    typeof pattern.id !== "string" ||
    !pattern.id.trim() ||
    pattern.id.length > 128 ||
    typeof pattern.name !== "string" ||
    !pattern.name.trim() ||
    pattern.name.trim().length > 80
  )
    throw new Error("Muster benötigt ID und Namen (maximal 80 Zeichen).");
  validatePatternDraft(pattern);
  if (!pattern.lines.length) throw new Error("Ein Muster benötigt mindestens eine Linie.");
  return {
    id: pattern.id,
    name: pattern.name.trim(),
    width: pattern.width,
    height: pattern.height,
    lines: pattern.lines.map((line) => ({ start: { ...line.start }, end: { ...line.end } })),
  };
}
