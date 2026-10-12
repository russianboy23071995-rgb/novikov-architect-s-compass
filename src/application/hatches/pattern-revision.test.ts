import { test } from "node:test";
import assert from "node:assert/strict";
import { loadPatternLibrary, loadHatchPatterns, saveHatchPattern } from "./pattern-library.ts";
import {
  createPatternHistory,
  editHatchPattern,
  undoHatchPattern,
  redoHatchPattern,
} from "./pattern-history.ts";
import { resolveHatchPatternRevisions } from "./pattern-resolution.ts";
import { validatePatternRevisions } from "../../domain/elements/hatch/revision.ts";
import { createProject, serializeProject } from "../../lib/bim/model.ts";
import { createDrawing } from "../drawing/actions.ts";
import { createHistory, commitProject, undoProject } from "../../lib/bim/history.ts";
const pattern = {
  id: "p",
  name: "Original",
  width: 1,
  height: 1,
  lines: [{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }],
};
function memory(raw: string | null = null) {
  return {
    read: () => raw,
    write: (value: string) => {
      raw = value;
    },
  };
}
function project() {
  const base = createProject("project", "storey");
  return createDrawing(base, base, "h", {
    kind: "hatch",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 2 },
      { x: 0, y: 2 },
    ],
    fill: { color: "#112233", opacity: 0.5 },
    patternDefinition: pattern,
  });
}
test("v1 library migration is read-only, saves v2 and preserves earlier definitions", () => {
  const raw = JSON.stringify({ version: 1, patterns: [pattern] });
  const store = memory(raw);
  assert.deepEqual(loadPatternLibrary(store), {
    clock: 1,
    records: [{ definition: pattern, revision: 1 }],
  });
  assert.equal(store.read(), raw);
  saveHatchPattern(store, { ...pattern, id: "other" });
  assert.equal(JSON.parse(store.read()!).version, 2);
  assert.deepEqual(loadHatchPatterns(store), [pattern, { ...pattern, id: "other" }]);
  assert.equal(loadPatternLibrary(store).records[1]!.revision, 2);
});
test("edit Undo Redo keep IDs and publish monotone revisions without project history", () => {
  const store = memory();
  saveHatchPattern(store, pattern);
  const model = createHistory(project()),
    before = serializeProject(model.present);
  let h = createPatternHistory(store);
  h = editHatchPattern(store, h, "p", 1, { ...pattern, name: "Changed" });
  assert.equal(h.present.records[0]!.revision, 2);
  h = undoHatchPattern(store, h);
  assert.equal(h.present.records[0]!.definition.name, "Original");
  assert.equal(h.present.records[0]!.revision, 3);
  h = redoHatchPattern(store, h);
  assert.equal(h.present.records[0]!.definition.name, "Changed");
  assert.equal(h.present.records[0]!.revision, 4);
  assert.equal(h.present.records[0]!.definition.id, "p");
  assert.equal(model.past.length, 0);
  assert.equal(serializeProject(model.present), before);
  assert.deepEqual(loadPatternLibrary(store), h.present);
});
test("stale edits, invalid targets and failed storage writes leave history and payload intact", () => {
  const store = memory();
  saveHatchPattern(store, pattern);
  const h = createPatternHistory(store),
    raw = store.read();
  assert.equal(editHatchPattern(store, h, "p", 1, pattern), h);
  assert.equal(store.read(), raw);
  assert.throws(() => editHatchPattern(store, h, "p", 9, { ...pattern, name: "Changed" }));
  assert.throws(() => editHatchPattern(store, h, "p", 1, { ...pattern, id: "different" }));
  assert.throws(() => editHatchPattern(store, h, "p", 1, { ...pattern, width: 0 }));
  const full = {
    read: store.read,
    write: () => {
      throw new Error("quota");
    },
  };
  assert.throws(() => editHatchPattern(full, h, "p", 1, { ...pattern, name: "Changed" }), /quota/);
  assert.equal(h.past.length, 0);
  assert.equal(store.read(), raw);
  saveHatchPattern(store, { ...pattern, id: "other" });
  assert.throws(() => undoHatchPattern(store, h), /Neu laden/);
});
test("bounded library history clears Redo after a new edit", () => {
  const store = memory();
  saveHatchPattern(store, pattern);
  let h = createPatternHistory(store);
  for (let i = 0; i < 25; i++)
    h = editHatchPattern(store, h, "p", h.present.records[0]!.revision, {
      ...pattern,
      name: `Edit ${i}`,
    });
  assert.equal(h.past.length, 20);
  h = undoHatchPattern(store, h);
  assert.equal(h.future.length, 1);
  h = editHatchPattern(store, h, "p", h.present.records[0]!.revision, {
    ...pattern,
    name: "New branch",
  });
  assert.equal(h.future.length, 0);
});
test("resolver updates every reference once, retains missing/older data and reports equal-revision conflict", () => {
  const one = project();
  const p = createDrawing(one, one, "other", {
    kind: "hatch",
    points: [
      { x: 4, y: 0 },
      { x: 6, y: 0 },
      { x: 6, y: 2 },
      { x: 4, y: 2 },
    ],
    fill: { color: "#112233", opacity: 0.5 },
    patternDefinition: pattern,
  });
  const embedded = [{ definition: pattern, revision: 1 }],
    newer = [{ definition: { ...pattern, name: "New" }, revision: 2 }];
  const result = resolveHatchPatternRevisions(p, p, embedded, newer);
  assert.deepEqual(result.updatedIds, ["p"]);
  assert.equal(result.project.hatchPatterns.length, 1);
  assert.equal(result.project.hatchPatterns[0]!.name, "New");
  assert.deepEqual(result.project.storey, p.storey);
  assert.equal(
    resolveHatchPatternRevisions(result.project, result.project, result.records, embedded).project,
    result.project,
  );
  const missing = resolveHatchPatternRevisions(p, p, embedded, []);
  assert.equal(missing.project, p);
  assert.deepEqual(missing.missingIds, ["p"]);
  const conflict = resolveHatchPatternRevisions(p, p, embedded, [
    { definition: { ...pattern, name: "Conflict" }, revision: 1 },
  ]);
  assert.equal(conflict.project, p);
  assert.deepEqual(conflict.conflicts, ["p"]);
  assert.throws(() => resolveHatchPatternRevisions(p, { ...p }, embedded, newer));
  assert.throws(() =>
    resolveHatchPatternRevisions(
      p,
      p,
      [{ definition: { ...pattern, name: "Wrong" }, revision: 1 }],
      newer,
    ),
  );
});
test("independent model Undo resolution does not rewind global pattern content", () => {
  const p = project();
  const moved = {
    ...p,
    storey: {
      ...p.storey,
      hatches: p.storey.hatches.map((h) => ({ ...h, fill: { ...h.fill, opacity: 0.7 } })),
    },
  };
  const undo = undoProject(commitProject(createHistory(p), moved)).present;
  const result = resolveHatchPatternRevisions(
    undo,
    undo,
    [{ definition: pattern, revision: 1 }],
    [{ definition: { ...pattern, name: "Global new" }, revision: 4 }],
  );
  assert.equal(result.project.hatchPatterns[0]!.name, "Global new");
  assert.equal(result.project.storey.hatches[0]!.fill.opacity, 0.5);
});
test("invalid revision metadata and unknown payloads are rejected without writes", () => {
  for (const revision of [0, -1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => validatePatternRevisions([{ definition: pattern, revision }]));
  for (const raw of [
    JSON.stringify({ version: 2, clock: 1, records: [{ definition: pattern, revision: 2 }] }),
    JSON.stringify({ version: 3, records: [] }),
  ]) {
    const store = memory(raw);
    assert.throws(() => loadPatternLibrary(store));
    assert.throws(() => saveHatchPattern(store, { ...pattern, id: "other" }));
    assert.equal(store.read(), raw);
  }
});
