import test from "node:test";
import assert from "node:assert/strict";
import { createProject, serializeProject, validateProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { createDrawing } from "../drawing/actions.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { resolveProjectHatchPatterns, resolveHatchPatternRevisions } from "./pattern-resolution.ts";
import { previewHatch } from "./actions.ts";

const definition = {
  id: "p",
  name: "Original",
  width: 0.2,
  height: 0.2,
  lines: [{ start: { x: 0, y: 0 }, end: { x: 0.2, y: 0.2 } }],
};
const available = [{ definition: { ...definition, name: "Aktuell" }, revision: 7 }];
function fixture() {
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
    patternDefinition: definition,
  });
}

test("schema 11 preserves unknown provenance; schema 12 revisions roundtrip without a library", () => {
  const p = fixture(),
    old = { ...p, schemaVersion: 11 };
  const migrated = readProjectFile(JSON.stringify(old));
  assert.equal(migrated.schemaVersion, 17);
  assert.equal(migrated.hatchPatterns[0]!.revision, undefined);
  assert.deepEqual(migrated.storey, p.storey);
  const updated = resolveProjectHatchPatterns(migrated, migrated, available).project;
  assert.equal(updated.hatchPatterns[0]!.revision, 7);
  assert.deepEqual(readProjectFile(serializeProject(updated)), updated);
  assert.throws(() =>
    resolveHatchPatternRevisions(
      updated,
      updated,
      [{ definition: available[0]!.definition, revision: 1 }],
      available,
    ),
  );
  assert.equal(resolveProjectHatchPatterns(updated, updated, []).project, updated);
  assert.throws(() => readProjectFile(JSON.stringify({ ...updated, schemaVersion: 11 })));
  assert.throws(() => validateProject(old));
});

test("load event adopts current library in one project Undo step and leaves source owned", () => {
  const base = createProject("empty", "storey"),
    source = fixture(),
    before = structuredClone(source);
  const state = editingReducer(createEditingState(base), {
    type: "load-project",
    project: source,
    patternRecords: available,
  });
  assert.equal(state.history.past.length, 1);
  assert.equal(state.history.present.hatchPatterns[0]!.name, "Aktuell");
  assert.deepEqual(source, before);
  const undone = editingReducer(state, { type: "undo", patternRecords: available });
  assert.deepEqual(undone.history.present, base);
  assert.equal(
    editingReducer(undone, { type: "redo", patternRecords: available }).history.present
      .hatchPatterns[0]!.revision,
    7,
  );
});

test("model Undo/Redo restores appearance but retains newer global content without an extra step", () => {
  const p = fixture();
  const changed = previewHatch(p, p, {
    kind: "update",
    projectId: p.id,
    id: "h",
    changes: { fill: { color: "#112233", opacity: 0.8 } },
  });
  const state = editingReducer(createEditingState(p), {
    type: "project",
    project: changed,
    patternRecords: available,
  });
  assert.equal(state.history.past.length, 1);
  const undo = editingReducer(state, { type: "undo", patternRecords: [] });
  assert.equal(undo.history.present.storey.hatches[0]!.fill.opacity, 0.5);
  assert.equal(undo.history.present.hatchPatterns[0]!.revision, 7);
  assert.equal(undo.history.past.length, 0);
  const redo = editingReducer(undo, { type: "redo", patternRecords: available });
  assert.equal(redo.history.present.storey.hatches[0]!.fill.opacity, 0.8);
  assert.equal(redo.history.present.hatchPatterns[0]!.revision, 7);
  // Metadata does not make otherwise identical assignment content conflict.
  assert.doesNotThrow(() =>
    previewHatch(redo.history.present, redo.history.present, {
      kind: "update",
      projectId: p.id,
      id: "h",
      changes: {},
      patternDefinition: available[0]!.definition,
    }),
  );
});

test("known conflicts retain embedded rendering and report; missing/older libraries never downgrade", () => {
  const p = fixture(),
    known = resolveProjectHatchPatterns(p, p, available).project;
  const older = resolveProjectHatchPatterns(known, known, [{ definition, revision: 1 }]);
  assert.equal(older.project, known);
  const state = editingReducer(createEditingState(createProject("other", "s")), {
    type: "load-project",
    project: known,
    patternRecords: [{ definition: { ...definition, name: "Konflikt" }, revision: 7 }],
  });
  assert.match(state.error, /Musterkonflikt/);
  assert.equal(state.history.present.hatchPatterns[0]!.name, "Aktuell");
  const unavailable = editingReducer(createEditingState(p), {
    type: "load-project",
    project: known,
    patternRecords: [],
    patternLibraryError: "Bibliothek defekt",
  });
  assert.equal(unavailable.history.present.hatchPatterns[0]!.revision, 7);
  assert.equal(unavailable.error, "Bibliothek defekt");
});

test("invalid persisted revisions and invalid action catalogs reject atomically", () => {
  const p = fixture();
  for (const revision of [0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "7", null])
    assert.throws(() =>
      readProjectFile(JSON.stringify({ ...p, hatchPatterns: [{ ...definition, revision }] })),
    );
  const initial = createEditingState(p);
  const rejected = editingReducer(initial, {
    type: "load-project",
    project: p,
    patternRecords: [{ definition, revision: 0 }],
  });
  assert.equal(rejected.history, initial.history);
  assert.ok(rejected.error);
  assert.throws(() => resolveProjectHatchPatterns(p, { ...p }, available));
});
