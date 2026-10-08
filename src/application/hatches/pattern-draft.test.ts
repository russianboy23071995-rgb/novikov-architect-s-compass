import { test } from "node:test";
import assert from "node:assert/strict";
import {
  appendPatternLine,
  resizePatternCell,
  validatePatternDraft,
  MAX_PATTERN_LINES,
} from "./pattern-draft.ts";
test("pattern draft owns new coordinates without mutating its source", () => {
  const draft = { width: 1, height: 1, lines: [] };
  const line = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } };
  const next = appendPatternLine(draft, line);
  line.end.x = 0.5;
  assert.equal(next.lines[0]!.end.x, 1);
  assert.equal(draft.lines.length, 0);
});
test("pattern validation rejects invalid dimensions, points and zero lines", () => {
  for (const width of [0, NaN, Infinity, -1, 101])
    assert.throws(() => validatePatternDraft({ width, height: 1, lines: [] }));
  for (const end of [
    { x: 2, y: 0 },
    { x: NaN, y: 0 },
    { x: 0, y: 0 },
  ])
    assert.throws(() =>
      appendPatternLine({ width: 1, height: 1, lines: [] }, { start: { x: 0, y: 0 }, end }),
    );
});
test("cell resize retains geometry and rejects clipping and oversized drafts", () => {
  const draft = appendPatternLine(
    { width: 1, height: 1, lines: [] },
    { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } },
  );
  assert.equal(resizePatternCell(draft, 2, 3).lines, draft.lines);
  assert.throws(() => resizePatternCell(draft, 0.5, 1));
  assert.throws(() =>
    validatePatternDraft({ ...draft, lines: Array(MAX_PATTERN_LINES + 1).fill(draft.lines[0]) }),
  );
});
