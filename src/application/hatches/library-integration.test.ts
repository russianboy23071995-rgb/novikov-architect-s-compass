import test from "node:test";
import assert from "node:assert/strict";
import {
  createPatternHistory,
  createLibraryHatchPattern,
  editHatchPattern,
  undoHatchPattern,
  redoHatchPattern,
} from "./pattern-history.ts";
import { loadPatternLibrary } from "./pattern-library.ts";
import { removePatternLine } from "./pattern-draft.ts";
import { validateHatchPattern } from "../../domain/elements/hatch/pattern.ts";
import { createProject, serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { createDrawing } from "../drawing/actions.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { previewHatch } from "./actions.ts";

const definition = {
  id: "p",
  name: "Original",
  width: 1,
  height: 1,
  lines: [{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }],
};
function memory() {
  let raw: string | null = null;
  return {
    read: () => raw,
    write: (value: string) => {
      raw = value;
    },
  };
}
function fixture() {
  let p = createProject("project", "storey");
  for (const [index, id] of ["h1", "h2"].entries())
    p = createDrawing(p, p, id, {
      kind: "hatch",
      points: [
        { x: index * 4, y: 0 },
        { x: index * 4 + 3, y: 0 },
        { x: index * 4 + 3, y: 2 },
        { x: index * 4, y: 2 },
      ],
      fill: { color: "#112233", opacity: 0.5 },
      patternDefinition: definition,
    });
  return p;
}

test("library creation participates in Undo/Redo and rejects duplicates/quota failures without writes", () => {
  const storage = memory(),
    initial = createPatternHistory(storage);
  const created = createLibraryHatchPattern(storage, initial, definition);
  assert.equal(created.past.length, 1);
  const undone = undoHatchPattern(storage, created);
  assert.equal(undone.present.records.length, 0);
  const redone = redoHatchPattern(storage, undone);
  assert.equal(redone.present.records[0]!.definition.id, "p");
  assert.equal(redone.present.records[0]!.revision, 3);
  const raw = storage.read();
  assert.throws(() => createLibraryHatchPattern(storage, redone, definition));
  assert.throws(
    () =>
      createLibraryHatchPattern(
        {
          read: storage.read,
          write: () => {
            throw new Error("quota");
          },
        },
        redone,
        { ...definition, id: "new" },
      ),
    /quota/,
  );
  assert.equal(storage.read(), raw);
  assert.equal(redone.past.length, 1);
});

test("global edits update all applications and cancel stale previews without adding a model step", () => {
  const storage = memory();
  let library = createLibraryHatchPattern(storage, createPatternHistory(storage), definition);
  let state = createEditingState(fixture());
  state = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: library.present.records,
  });
  const changed = previewHatch(state.history.present, state.history.present, {
    kind: "update",
    projectId: "project",
    id: "h1",
    changes: { fill: { color: "#112233", opacity: 0.8 } },
  });
  state = editingReducer(state, {
    type: "project",
    project: changed,
    patternRecords: library.present.records,
  });
  state = editingReducer(state, { type: "undo", patternRecords: library.present.records });
  state = editingReducer(state, {
    type: "begin",
    target: { kind: "hatch", id: "h1" },
    action: "move",
    index: null,
  });
  assert.ok(state.session);
  const { past, future, present } = state.history;
  library = editHatchPattern(storage, library, "p", 1, {
    ...definition,
    name: "Aktuell",
    lines: [{ start: { x: 0, y: 1 }, end: { x: 1, y: 0 } }],
  });
  state = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: library.present.records,
  });
  assert.equal(state.history.past, past);
  assert.equal(state.history.future, future);
  assert.equal(state.session, null);
  assert.deepEqual(state.history.present.storey, present.storey);
  assert.equal(state.history.present.hatchPatterns.length, 1);
  assert.equal(state.history.present.hatchPatterns[0]!.revision, 2);
  assert.equal(state.history.present.hatchPatterns[0]!.name, "Aktuell");
  const redone = editingReducer(state, { type: "redo", patternRecords: library.present.records });
  assert.equal(redone.history.present.storey.hatches[0]!.fill.opacity, 0.8);
  assert.equal(redone.history.present.hatchPatterns[0]!.name, "Aktuell");
  assert.deepEqual(
    readProjectFile(serializeProject(redone.history.present)),
    redone.history.present,
  );
});

test("library Undo/Redo updates active patterns while model Undo only restores geometry/appearance", () => {
  const storage = memory();
  let library = createLibraryHatchPattern(storage, createPatternHistory(storage), definition);
  let state = createEditingState(fixture());
  library = editHatchPattern(storage, library, "p", 1, { ...definition, name: "Edited" });
  state = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: library.present.records,
  });
  library = undoHatchPattern(storage, library);
  state = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: library.present.records,
  });
  assert.equal(state.history.present.hatchPatterns[0]!.name, "Original");
  assert.equal(state.history.present.hatchPatterns[0]!.revision, 3);
  assert.equal(state.history.past.length, 0);
  library = redoHatchPattern(storage, library);
  state = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: library.present.records,
  });
  assert.equal(state.history.present.hatchPatterns[0]!.revision, 4);
  assert.equal(state.history.present.hatchPatterns[0]!.name, "Edited");
  const before = storage.read();
  state = editingReducer(state, {
    type: "undo",
    patternRecords: loadPatternLibrary(storage).records,
  });
  assert.equal(storage.read(), before);
  // Undo creation removes the catalog entry; used project content remains portable.
  library = undoHatchPattern(storage, library);
  state = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: library.present.records,
  });
  library = undoHatchPattern(storage, library);
  assert.equal(library.present.records.length, 0);
  state = editingReducer(state, { type: "patterns-changed", patternRecords: [] });
  assert.equal(state.history.present.hatchPatterns[0]!.name, "Original");
});

test("pinned drafts cannot overwrite newer content after Undo or an external publication", () => {
  const storage = memory();
  const pinned = createLibraryHatchPattern(storage, createPatternHistory(storage), definition);
  const other = editHatchPattern(storage, createPatternHistory(storage), "p", 1, {
    ...definition,
    name: "Other",
  });
  const raw = storage.read();
  assert.throws(
    () => editHatchPattern(storage, pinned, "p", 1, { ...definition, name: "Stale" }),
    /Neu laden/,
  );
  assert.equal(storage.read(), raw);
  const undo = undoHatchPattern(storage, other);
  assert.throws(
    () => editHatchPattern(storage, undo, "p", 2, { ...definition, name: "Stale" }),
    /Revision/,
  );
  assert.equal(loadPatternLibrary(storage).records[0]!.revision, 3);
});

test("missing, conflicting and invalid publications retain the valid project and its model stacks", () => {
  const p = fixture();
  let state = editingReducer(createEditingState(p), {
    type: "patterns-changed",
    patternRecords: [{ definition, revision: 5 }],
  });
  const before = state;
  state = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: [{ definition: { ...definition, name: "Conflict" }, revision: 5 }],
  });
  assert.equal(state.history.present, before.history.present);
  assert.match(state.error, /Musterkonflikt/);
  const invalid = editingReducer(state, {
    type: "patterns-changed",
    patternRecords: [{ definition, revision: 0 }],
  });
  assert.equal(invalid.history, state.history);
  assert.ok(invalid.error);
  const missing = editingReducer(before, {
    type: "patterns-changed",
    patternRecords: [],
    patternLibraryError: "Bibliothek unlesbar",
  });
  assert.equal(missing.history, before.history);
  assert.equal(missing.error, "Bibliothek unlesbar");
  const unchanged = editingReducer(before, {
    type: "patterns-changed",
    patternRecords: [{ definition, revision: 1 }],
  });
  assert.equal(unchanged, before);
});

test("removing a draft line is reversible without altering the stored definition", () => {
  const draft = {
    ...definition,
    lines: [...definition.lines, { start: { x: 0, y: 1 }, end: { x: 1, y: 0 } }],
  };
  const before = structuredClone(draft),
    next = removePatternLine(draft, 0);
  assert.deepEqual(next.lines, [draft.lines[1]]);
  assert.deepEqual(draft, before);
  assert.throws(() => removePatternLine(draft, -1));
  assert.throws(() => removePatternLine(draft, 2));
  assert.throws(() => removePatternLine(draft, 0.5));
  assert.throws(
    () => validateHatchPattern({ ...removePatternLine(next, 0), id: "p", name: "Empty" }),
    /mindestens eine/,
  );
});
