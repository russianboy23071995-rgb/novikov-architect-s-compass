import { validatePatternDraft } from "../../domain/elements/hatch/pattern.ts";
import type { PatternDraft, PatternLine } from "../../domain/elements/hatch/pattern.ts";
export { validatePatternDraft, MAX_PATTERN_LINES } from "../../domain/elements/hatch/pattern.ts";
export type { PatternDraft, PatternLine } from "../../domain/elements/hatch/pattern.ts";
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
export function removePatternLine(draft: PatternDraft, index: number): PatternDraft {
  if (!Number.isInteger(index) || index < 0 || index >= draft.lines.length)
    throw new Error("Musterlinie existiert nicht.");
  const next = { ...draft, lines: draft.lines.filter((_, i) => i !== index) };
  validatePatternDraft(next);
  return next;
}
