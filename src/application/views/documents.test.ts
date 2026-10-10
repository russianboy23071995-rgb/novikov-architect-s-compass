import assert from "node:assert/strict";
import test from "node:test";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { changeDrawingDocument, documentBinding } from "./documents.ts";
import { resolveDocumentView, assertWorkingViewCurrent } from "./working-context.ts";
import { changeProjectScale, projectScaleContext } from "./project-scale.ts";
import {
  changeLayerVisibility,
  emptyVisibilityHistory,
  documentVisibilityKey,
} from "../layers/visibility-actions.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import {
  readProjectFile,
  commitProject,
  createHistory,
  undoProject,
  redoProject,
} from "../../lib/bim/history.ts";
import {
  updateWall,
  serializeProject,
  validateProject,
  type Project,
} from "../../lib/bim/model.ts";
import { resolveModelLength } from "../../domain/views/display-size.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
const create = (p: Project, id = "doc-a", denominator = 50) =>
  changeDrawingDocument(p, p, {
    kind: "create",
    id,
    modelViewId: `view-${id}`,
    name: id,
    denominator,
  });

test("two documents share one source model, copy initial visibility and resolve independent scales", async () => {
  const base = createExampleProject();
  const hidden = changeLayerVisibility(base, base, emptyVisibilityHistory(), {
    kind: "hide-all",
  }).project;
  const a = create(hidden),
    p = create(a, "doc-b", 200);
  assert.equal(p.modelViews!.length, 1);
  assert.equal(p.drawingDocuments!.length, 2);
  assert.deepEqual(p.storey, base.storey);
  assert.deepEqual(p.drawingDocuments![0]!.hiddenLayerIds, hidden.bimVisibility.hiddenLayerIds);
  const shown = changeLayerVisibility(
    p,
    p,
    emptyVisibilityHistory(),
    { kind: "invert" },
    { kind: "drawing-document", documentId: "doc-a" },
  ).project;
  const contextA = resolveDocumentView(shown, documentBinding(shown, "doc-a"));
  const contextB = resolveDocumentView(shown, documentBinding(shown, "doc-b"));
  assert.equal(
    contextA.visibility.evaluate(shown, contextA.visibility.context, "window-1").eligible,
    true,
  );
  assert.equal(
    contextB.visibility.evaluate(shown, contextB.visibility.context, "window-1").eligible,
    false,
  );
  assert.deepEqual(shown.bimVisibility, hidden.bimVisibility);
  assert.equal(resolveModelLength({ mode: "paper", metres: 0.002 }, contextA.scale), 0.1);
  assert.equal(resolveModelLength({ mode: "paper", metres: 0.002 }, contextB.scale), 0.4);
  const scaled = changeProjectScale(shown, projectScaleContext(shown).view, 1000);
  assert.equal(resolveDocumentView(scaled, documentBinding(scaled, "doc-a")).scale.denominator, 50);
  const modified = updateWall(scaled, "wall-1", { height: 4 });
  assertWorkingViewCurrent(
    resolveDocumentView(modified, documentBinding(modified, "doc-a")),
    modified,
  );
  assert.throws(() => assertWorkingViewCurrent(contextA, modified));
  assert.deepEqual(readProjectFile(serializeProject(modified)), modified);
  assert.equal(await exportIfc(p, new Date(0)), await exportIfc(hidden, new Date(0)));
});

test("document lifecycle uses project undo; visibility does not rewind with model undo", () => {
  let state = createEditingState(createExampleProject());
  state = editingReducer(state, {
    type: "document",
    base: state.history.present,
    action: { kind: "create", id: "a", modelViewId: "v", name: "A", denominator: 50 },
  });
  assert.equal(state.error, "");
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, {
    type: "project",
    project: updateWall(state.history.present, "wall-1", { height: 4 }),
  });
  const scope = { kind: "drawing-document" as const, documentId: "a" };
  state = editingReducer(state, {
    type: "visibility",
    base: state.history.present,
    scope,
    action: { kind: "hide-all" },
  });
  assert.equal(state.history.past.length, 2);
  const filter = state.history.present.drawingDocuments![0]!.hiddenLayerIds;
  state = editingReducer(state, { type: "undo", patternRecords: [] });
  assert.equal(state.history.present.storey.walls[0]!.height, 2.8);
  assert.deepEqual(state.history.present.drawingDocuments![0]!.hiddenLayerIds, filter);
  state = editingReducer(state, { type: "redo", patternRecords: [] });
  assert.equal(state.history.present.storey.walls[0]!.height, 4);
  state = editingReducer(state, {
    type: "document",
    base: state.history.present,
    action: { kind: "delete", id: "a" },
  });
  assert.equal(state.history.present.drawingDocuments!.length, 0);
  state = editingReducer(state, { type: "undo", patternRecords: [] });
  assert.deepEqual(state.history.present.drawingDocuments![0]!.hiddenLayerIds, filter);
  state = editingReducer(state, {
    type: "visibility",
    base: state.history.present,
    scope,
    action: { kind: "undo" },
  });
  assert.deepEqual(state.history.present.drawingDocuments![0]!.hiddenLayerIds, []);
  const back = editingReducer(editingReducer(state, { type: "undo" }), { type: "undo" });
  assert.equal(back.history.present.drawingDocuments, undefined);
  const again = editingReducer(back, { type: "redo" });
  assert.equal(again.history.present.drawingDocuments!.length, 1);
});

test("palette undo is scoped; loading clears palette history and stale actions are rejected", () => {
  let state = createEditingState(create(create(createExampleProject()), "doc-b", 200));
  for (const id of ["doc-a", "doc-b"])
    state = editingReducer(state, {
      type: "visibility",
      base: state.history.present,
      scope: { kind: "drawing-document", documentId: id },
      action: { kind: "hide-all" },
    });
  state = editingReducer(state, {
    type: "visibility",
    base: state.history.present,
    scope: { kind: "drawing-document", documentId: "doc-a" },
    action: { kind: "undo" },
  });
  assert.deepEqual(state.history.present.drawingDocuments![0]!.hiddenLayerIds, []);
  assert.ok(state.history.present.drawingDocuments![1]!.hiddenLayerIds.length);
  assert.ok(
    state.documentVisibilityHistories![documentVisibilityKey(state.history.present, "doc-a")]!
      .future.length,
  );
  const base = state.history.present;
  const loaded = editingReducer(state, {
    type: "load-project",
    project: readProjectFile(serializeProject(base)),
  });
  assert.deepEqual(loaded.documentVisibilityHistories, {});
  assert.throws(() =>
    changeDrawingDocument(base, readProjectFile(serializeProject(base)), {
      kind: "delete",
      id: "doc-a",
    }),
  );
  assert.throws(() =>
    changeLayerVisibility(
      base,
      base,
      emptyVisibilityHistory(),
      { kind: "hide-all" },
      { kind: "drawing-document", documentId: "missing" },
    ),
  );
});

test("strict document input rejects bad references, duplicate IDs, invalid names and scales atomically", () => {
  const p = create(createExampleProject()),
    before = serializeProject(p),
    d = p.drawingDocuments![0]!;
  for (const changes of [
    { name: " " },
    { denominator: 0 },
    { denominator: Infinity },
    { modelViewId: "missing" },
    { hiddenLayerIds: ["missing"] },
    { hiddenLayerIds: [p.layers[0]!.id, p.layers[0]!.id] },
  ])
    assert.throws(() => validateProject({ ...p, drawingDocuments: [{ ...d, ...changes }] }));
  assert.throws(() => validateProject({ ...p, drawingDocuments: [d, d] }));
  assert.throws(() =>
    validateProject({ ...p, modelViews: [{ ...p.modelViews![0], storeyId: "missing" }] }),
  );
  assert.throws(() => create(p, "wall-1"));
  assert.throws(() =>
    resolveDocumentView(p, { kind: "drawing-document", projectId: "other", documentId: d.id }),
  );
  assert.throws(() =>
    resolveDocumentView(p, { kind: "drawing-document", projectId: p.id, documentId: "missing" }),
  );
  assert.equal(serializeProject(p), before);
});

test("schema 16 migration preserves working state without inventing documents", () => {
  const old = { ...createExampleProject(), schemaVersion: 16 };
  const migrated = readProjectFile(JSON.stringify(old));
  assert.equal(migrated.schemaVersion, 17);
  assert.equal(migrated.drawingDocuments, undefined);
  assert.equal(migrated.modelViews, undefined);
  assert.deepEqual(migrated.storey, old.storey);
  assert.throws(() => readProjectFile(JSON.stringify({ ...old, drawingDocuments: [] })));
  assert.throws(() => validateProject(old));
});

test("renaming and document scale use validated project history, with no geometry mutation", () => {
  let history = createHistory(create(createExampleProject()));
  const before = history.present.storey;
  history = commitProject(
    history,
    changeDrawingDocument(history.present, history.present, {
      kind: "rename",
      id: "doc-a",
      name: "Plan A",
    }),
  );
  history = commitProject(
    history,
    changeDrawingDocument(history.present, history.present, {
      kind: "scale",
      id: "doc-a",
      denominator: 200,
    }),
  );
  assert.deepEqual(history.present.storey, before);
  assert.equal(undoProject(history).present.drawingDocuments![0]!.denominator, 50);
  assert.equal(redoProject(undoProject(history)).present.drawingDocuments![0]!.denominator, 200);
});
