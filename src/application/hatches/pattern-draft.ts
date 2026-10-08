import type { Point2 } from "../../geometry/primitives/point.ts";
export type PatternLine = { start: Point2; end: Point2 };
export type PatternDraft = { width: number; height: number; lines: readonly PatternLine[] };
export const MAX_PATTERN_LINES = 256;
export function validatePatternDraft(draft: PatternDraft): void {
  if (![draft.width, draft.height].every((v) => Number.isFinite(v) && v >= 0.001 && v <= 100))
    throw new Error("Zellmaße müssen zwischen 0,001 und 100 m liegen.");
  if (draft.lines.length > MAX_PATTERN_LINES) throw new Error("Maximal 256 Musterlinien.");
  for (const line of draft.lines) {
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
export function appendPatternLine(draft: PatternDraft, line: PatternLine): PatternDraft {
  const next = {
    ...draft,
    lines: [...draft.lines, { start: { ...line.start }, end: { ...line.end } }],
  };
  validatePatternDraft(next);
  return next;
}
export function resizePatternCell(
  draft: PatternDraft,
  width: number,
  height: number,
): PatternDraft {
  const next = { ...draft, width, height };
  validatePatternDraft(next);
  return next;
}
