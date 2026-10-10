import { ensureDocumentFolder } from "./documents.ts";
import { beginSelectionMove, previewSelectionMove } from "../selection/move.ts";
import { createDrawing } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { resolveWorkingView } from "./working-context.ts";
import { createLayerDisplay } from "../../rendering/viewport/layer-display.ts";
import { createVisibleToolSourceQuery } from "../tools/snapping.ts";
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
  assert.equal(migrated.schemaVersion, 20);
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

test("captured view framing and folder survive project history and file roundtrip", () => {
  const base = createExampleProject();
  let p = changeDrawingDocument(base, base, { kind: "create-folder", id: "folder", name: "Pläne" });
  const framing = { center: { x: 7, y: -2 }, width: 8, height: 4, pixelsPerMetre: 200 };
  p = changeDrawingDocument(p, p, {
    kind: "create",
    id: "detail",
    modelViewId: "source",
    name: "Detail",
    denominator: 50,
    folderId: "folder",
    framing,
  });
  assert.deepEqual(p.storey, base.storey);
  assert.deepEqual(p.drawingDocuments![0]!.framing, framing);
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
  const renamed = changeDrawingDocument(p, p, {
    kind: "rename-folder",
    id: "folder",
    name: "Ausführung",
  });
  const history = commitProject(createHistory(p), renamed);
  assert.equal(undoProject(history).present.documentFolders![0]!.name, "Pläne");
  assert.equal(redoProject(undoProject(history)).present.documentFolders![0]!.name, "Ausführung");
  for (const invalid of [
    { width: 0 },
    { height: -1 },
    { pixelsPerMetre: Infinity },
    { center: { x: Infinity, y: 0 } },
  ])
    assert.throws(() =>
      validateProject({
        ...p,
        drawingDocuments: [{ ...p.drawingDocuments![0], framing: { ...framing, ...invalid } }],
      }),
    );
  assert.throws(() => validateProject({ ...p, documentFolders: [] }));
  assert.throws(() =>
    changeDrawingDocument(p, p, { kind: "create-folder", id: "wall-1", name: "duplicate" }),
  );
  assert.throws(() =>
    changeDrawingDocument(base, p, { kind: "create-folder", id: "stale", name: "stale" }),
  );
});

test("schema 17 migration keeps existing documents without inventing crop or folders", () => {
  const legacy = { ...create(createExampleProject()), schemaVersion: 17 };
  const migrated = readProjectFile(JSON.stringify(legacy));
  assert.equal(migrated.schemaVersion, 20);
  assert.deepEqual(migrated.drawingDocuments, legacy.drawingDocuments);
  assert.equal(migrated.documentFolders, undefined);
  assert.throws(() => readProjectFile(JSON.stringify({ ...legacy, documentFolders: [] })));
  assert.throws(() =>
    readProjectFile(
      JSON.stringify({
        ...legacy,
        drawingDocuments: [{ ...legacy.drawingDocuments![0], folderId: "unknown" }],
      }),
    ),
  );
});

test("drawings created in documents are shared in display, picking, snapping and editing", () => {
  const base = create(create(createExampleProject()), "doc-b");
  const view = documentBinding(base, "doc-a");
  const line = createDrawing(
    base,
    base,
    "annotation-line",
    {
      kind: "line",
      lineKind: "line",
      points: [
        { x: 10, y: 10 },
        { x: 12, y: 10 },
      ],
      appearance: defaultLineAppearance,
    },
    view,
  );
  const p = createDrawing(
    line,
    line,
    "annotation-hatch",
    {
      kind: "hatch",
      points: [
        { x: 20, y: 20 },
        { x: 22, y: 20 },
        { x: 20, y: 22 },
      ],
      fill: { color: "#123456", opacity: 0.5 },
    },
    view,
  );
  assert.equal("documentId" in p.storey.lines![0]!, false);
  assert.equal("documentId" in p.storey.hatches[0]!, false);
  for (const [context, visible] of [
    [resolveWorkingView(p), true],
    [resolveDocumentView(p, documentBinding(p, "doc-b")), true],
    [resolveDocumentView(p, view), true],
  ] as const) {
    const policy = context.visibility;
    const display = createLayerDisplay(p, policy, policy.context);
    assert.equal(
      display.plan.lines.some((l) => l.id === "annotation-line"),
      visible,
    );
    assert.equal(
      display.plan.hatches.some((h) => h.id === "annotation-hatch"),
      visible,
    );
    assert.equal(display.canPick(p, policy.context, "annotation-line"), visible);
    const query = createVisibleToolSourceQuery(p, policy, policy.context, null);
    assert.equal(
      query({ x: 10, y: 10 }, 100, 10, []).some((r) => r.entityId === "annotation-line"),
      visible,
    );
    assert.equal(display.plan.walls.length, 1);
  }
  const changed = updateWall(p, "wall-1", { height: 3.5 });
  for (const id of ["doc-a", "doc-b"]) {
    const c = resolveDocumentView(changed, documentBinding(changed, id));
    assert.equal(
      createLayerDisplay(changed, c.visibility, c.visibility.context).plan.walls[0]!.height,
      3.5,
    );
  }
  const policy = resolveDocumentView(p, view).visibility;
  const targets = [
    { kind: "line" as const, id: "annotation-line" },
    { kind: "hatch" as const, id: "annotation-hatch" },
  ];
  const session = beginSelectionMove(p, targets, { x: 0, y: 0 }, policy);
  const moved = previewSelectionMove(session, p, targets, { x: 1, y: 2 }, policy);
  assert.equal("documentId" in moved.storey.lines![0]!, false);
  assert.equal("documentId" in moved.storey.hatches[0]!, false);
  assert.deepEqual(moved.storey.lines![0]!.points[0], { x: 11, y: 12 });
  assert.doesNotThrow(() =>
    beginSelectionMove(p, targets, { x: 0, y: 0 }, resolveWorkingView(p).visibility),
  );
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
  const history = commitProject(createHistory(base), p);
  assert.deepEqual(undoProject(history).present.storey, base.storey);
  assert.deepEqual(redoProject(undoProject(history)).present.storey, p.storey);
  const deleted = changeDrawingDocument(p, p, { kind: "delete", id: "doc-a" });
  assert.deepEqual(deleted.storey, p.storey);
  const hidden = changeLayerVisibility(
    p,
    p,
    emptyVisibilityHistory(),
    { kind: "hide-all" },
    { kind: "drawing-document", documentId: "doc-a" },
  ).project;
  const hiddenContext = resolveDocumentView(hidden, documentBinding(hidden, "doc-a"));
  assert.equal(
    createLayerDisplay(hidden, hiddenContext.visibility, hiddenContext.visibility.context).plan
      .lines.length,
    0,
  );
  const working = resolveWorkingView(hidden);
  assert.equal(
    createLayerDisplay(hidden, working.visibility, working.visibility.context).plan.lines.length,
    1,
  );
});

test("drawing creation rejects foreign/stale contexts and keeps shared geometry", () => {
  const base = create(createExampleProject());
  const request = {
    kind: "line" as const,
    lineKind: "line" as const,
    points: [
      { x: 0, y: 3 },
      { x: 2, y: 3 },
    ],
    appearance: defaultLineAppearance,
  };
  assert.throws(() =>
    createDrawing(base, base, "a", request, {
      kind: "drawing-document",
      projectId: base.id,
      documentId: "missing",
    }),
  );
  assert.throws(() =>
    createDrawing(base, base, "a", request, {
      ...documentBinding(base, "doc-a"),
      projectId: "other",
    }),
  );
  assert.throws(() =>
    createDrawing(base, { ...base }, "a", request, documentBinding(base, "doc-a")),
  );
  const scoped = createDrawing(base, base, "a", request, documentBinding(base, "doc-a"));
  assert.doesNotThrow(() => validateProject({ ...scoped, drawingDocuments: [] }));
  assert.deepEqual(
    readProjectFile(JSON.stringify({ ...scoped, schemaVersion: 18 })).storey,
    scoped.storey,
  );
  const legacy = readProjectFile(JSON.stringify({ ...base, schemaVersion: 18 }));
  assert.equal(legacy.schemaVersion, 20);
  assert.deepEqual(legacy.storey, base.storey);
  const wall = createDrawing(
    base,
    base,
    "shared-wall",
    { kind: "wall", start: { x: 0, y: 5 }, end: { x: 3, y: 5 }, thickness: 0.3, height: 3 },
    documentBinding(base, "doc-a"),
  );
  assert.equal("documentId" in wall.storey.walls.at(-1)!, false);
  assert.throws(() =>
    validateProject({
      ...wall,
      storey: {
        ...wall.storey,
        walls: wall.storey.walls.map((w) => ({ ...w, documentId: "doc-a" })),
      },
    }),
  );
});

test("v19 migration promotes former local lines and hatches without loss or duplication", () => {
  const base = create(createExampleProject());
  const line = createDrawing(base, base, "old-line", {
    kind: "line",
    lineKind: "line",
    points: [
      { x: 1, y: 2 },
      { x: 3, y: 4 },
    ],
    appearance: defaultLineAppearance,
  });
  const p = createDrawing(line, line, "old-hatch", {
    kind: "hatch",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 0, y: 2 },
    ],
    fill: { color: "#aabbcc", opacity: 0.4 },
  });
  const legacy = {
    ...p,
    schemaVersion: 19,
    storey: {
      ...p.storey,
      lines: p.storey.lines!.map((l) => ({ ...l, documentId: "doc-a" })),
      hatches: p.storey.hatches.map((h) => ({ ...h, documentId: "doc-a" })),
    },
  };
  const migrated = readProjectFile(JSON.stringify(legacy));
  assert.deepEqual(migrated, p);
  assert.deepEqual(readProjectFile(serializeProject(migrated)), p);
  const context = resolveWorkingView(migrated);
  const display = createLayerDisplay(migrated, context.visibility, context.visibility.context);
  assert.equal(display.plan.lines.length, 1);
  assert.equal(display.plan.hatches.length, 1);
  assert.throws(() => readProjectFile(JSON.stringify({ ...legacy, drawingDocuments: [] })));
  assert.throws(() => readProjectFile(JSON.stringify({ ...legacy, schemaVersion: 20 })));
});

test("folder assignment preserves document definition and geometry, roundtrips and uses project history", () => {
  const p = create(createExampleProject());
  const base = changeDrawingDocument(p, p, { kind: "create-folder", id: "folder", name: "Pläne" });
  const moved = changeDrawingDocument(base, base, {
    kind: "assign-folder",
    id: "doc-a",
    folderId: "folder",
  });
  assert.deepEqual(moved.storey, base.storey);
  assert.deepEqual(moved.drawingDocuments![0], {
    ...base.drawingDocuments![0],
    folderId: "folder",
  });
  assert.deepEqual(readProjectFile(serializeProject(moved)), moved);
  const history = commitProject(createHistory(base), moved);
  assert.deepEqual(undoProject(history).present.drawingDocuments, base.drawingDocuments);
  assert.deepEqual(
    redoProject(undoProject(history)).present.drawingDocuments,
    moved.drawingDocuments,
  );
  const unfiled = changeDrawingDocument(moved, moved, {
    kind: "assign-folder",
    id: "doc-a",
    folderId: null,
  });
  assert.deepEqual(unfiled.drawingDocuments, base.drawingDocuments);
  assert.throws(() =>
    changeDrawingDocument(base, base, { kind: "assign-folder", id: "doc-a", folderId: "unknown" }),
  );
  assert.throws(() =>
    changeDrawingDocument(base, base, { kind: "assign-folder", id: "missing", folderId: "folder" }),
  );
  assert.throws(() =>
    changeDrawingDocument(base, moved, { kind: "assign-folder", id: "doc-a", folderId: "folder" }),
  );
});

test("document settings are atomic, preserve view and model and reject invalid or stale targets", () => {
  const p = create(createExampleProject());
  const base = changeDrawingDocument(p, p, { kind: "create-folder", id: "folder", name: "Pläne" });
  const action = {
    kind: "settings" as const,
    id: "doc-a",
    name: "Plan",
    denominator: 50,
    folderId: "folder",
  };
  const next = changeDrawingDocument(base, base, action);
  assert.deepEqual(next.drawingDocuments![0], {
    ...base.drawingDocuments![0],
    name: "Plan",
    denominator: 50,
    folderId: "folder",
  });
  assert.deepEqual(next.storey, base.storey);
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  const history = commitProject(createHistory(base), next);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)).present, next);
  for (const invalid of [
    { ...action, name: "" },
    { ...action, denominator: 0 },
    { ...action, folderId: "missing" },
    { ...action, id: "missing" },
  ])
    assert.throws(() => changeDrawingDocument(base, base, invalid));
  assert.throws(() => changeDrawingDocument(base, next, action));
});

test("only empty document folders can be deleted without affecting model or documents", () => {
  const p = create(createExampleProject());
  const base = changeDrawingDocument(p, p, { kind: "create-folder", id: "folder", name: "Pläne" });
  const next = changeDrawingDocument(base, base, { kind: "delete-folder", id: "folder" });
  assert.deepEqual(next.documentFolders, p.documentFolders ?? []);
  assert.deepEqual(next.drawingDocuments, base.drawingDocuments);
  assert.deepEqual(next.storey, base.storey);
  assert.deepEqual(undoProject(commitProject(createHistory(base), next)).present, base);
  const occupied = changeDrawingDocument(base, base, {
    kind: "assign-folder",
    id: "doc-a",
    folderId: "folder",
  });
  assert.throws(() =>
    changeDrawingDocument(occupied, occupied, { kind: "delete-folder", id: "folder" }),
  );
  assert.throws(() => changeDrawingDocument(base, base, { kind: "delete-folder", id: "missing" }));
});

test("application startup supplies one empty folder without rewriting legacy parsing or existing folders", () => {
  const base = createExampleProject();
  const next = ensureDocumentFolder(base);
  assert.equal(next.documentFolders?.length, 1);
  assert.deepEqual(next.storey, base.storey);
  assert.equal(ensureDocumentFolder(next), next);
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  const collision = ensureDocumentFolder({ ...base, id: "document-folder-default" });
  assert.notEqual(collision.documentFolders![0]!.id, collision.id);
});

test("Abbildsammlung always exists alongside custom folders and cannot be removed", () => {
  const base = createExampleProject();
  const custom = changeDrawingDocument(base, base, {
    kind: "create-folder",
    id: "custom",
    name: "Eigene Pläne",
  });
  const next = ensureDocumentFolder(custom);
  const standard = next.documentFolders!.find((f) => f.name === "Abbildsammlung")!;
  assert.equal(next.documentFolders!.length, 2);
  assert.equal(ensureDocumentFolder(next), next);
  assert.throws(() =>
    changeDrawingDocument(next, next, { kind: "delete-folder", id: standard.id }),
  );
  assert.throws(() =>
    changeDrawingDocument(next, next, { kind: "rename-folder", id: standard.id, name: "Anders" }),
  );
  const old = changeDrawingDocument(base, base, {
    kind: "create-folder",
    id: "document-folder-default",
    name: "Abbilder",
  });
  const updated = ensureDocumentFolder(old);
  assert.deepEqual(updated.documentFolders, [
    { id: "document-folder-default", name: "Abbildsammlung" },
  ]);
});
