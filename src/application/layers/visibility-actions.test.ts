import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { updateWall, serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { createLayerVisibilityPolicy } from "./visibility.ts";
import { createLayerDisplay } from "../../rendering/viewport/layer-display.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { changeLayerVisibility, emptyVisibilityHistory } from "./visibility-actions.ts";
import { previewLayerManagement } from "./actions.ts";

const hide = (state: ReturnType<typeof createEditingState>, visible = false) =>
  editingReducer(state, {
    type: "visibility",
    base: state.history.present,
    action: { kind: "set", layerId: state.history.present.defaultLayerIds.wall, visible },
  });
const palette = (state: ReturnType<typeof createEditingState>, kind: "undo" | "redo") =>
  editingReducer(state, { type: "visibility", base: state.history.present, action: { kind } });

test("model undo/redo and palette undo/redo remain independent, including an existing model redo", () => {
  const start = createEditingState(createExampleProject());
  const moved = editingReducer(start, {
    type: "project",
    project: updateWall(start.history.present, "wall-1", { end: { x: 6, y: 0 } }),
  });
  const hidden = hide(moved);
  assert.equal(hidden.history.past.length, 1);
  const undone = editingReducer(hidden, { type: "undo" });
  assert.equal(undone.history.present.storey.walls[0]!.end.x, 3);
  assert.deepEqual(undone.history.present.bimVisibility.hiddenLayerIds, [
    undone.history.present.defaultLayerIds.wall,
  ]);
  const shown = palette(undone, "undo");
  assert.deepEqual(shown.history.present.bimVisibility.hiddenLayerIds, []);
  assert.equal(shown.history.future, undone.history.future);
  const redone = editingReducer(shown, { type: "redo" });
  assert.equal(redone.history.present.storey.walls[0]!.end.x, 6);
  assert.deepEqual(redone.history.present.bimVisibility.hiddenLayerIds, []);
  const hiddenAgain = palette(redone, "redo");
  assert.equal(hiddenAgain.history.present.storey.walls[0]!.end.x, 6);
  assert.equal(hiddenAgain.history.present.bimVisibility.hiddenLayerIds.length, 1);
  assert.equal(hide(hiddenAgain), hiddenAgain); // no-op leaves both histories untouched
});

test("visibility cancels a pending preview and rejects its late commit; model and IFC stay complete", async () => {
  const initial = createEditingState(createExampleProject());
  const edit = editingReducer(initial, {
    type: "begin",
    target: { kind: "wall", id: "wall-1" },
    action: "move",
    index: 0,
  });
  const hidden = hide(edit);
  assert.equal(hidden.session, null);
  assert.equal(hidden.history.past.length, 0);
  assert.deepEqual(hidden.history.present.storey, edit.history.present.storey);
  const late = editingReducer(hidden, {
    type: "confirm",
    session: edit.session!,
    selection: { kind: "wall", id: "wall-1" },
    point: { x: 5, y: 5 },
  });
  assert.equal(late.history, hidden.history);
  const p = hidden.history.present;
  const visibility = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: p.bimVisibility.hiddenLayerIds,
  });
  const display = createLayerDisplay(p, visibility, visibility.context);
  assert.equal(display.plan.walls.length, 0);
  assert.equal(display.plan.windows.length, 0);
  assert.equal(display.surfaces.faces.length, 0);
  const date = new Date("2026-10-05T12:00:00Z");
  assert.equal(await exportIfc(p, date), await exportIfc(initial.history.present, date));
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(p))), p);
});

test("strict version-2 migration preserves geometry and membership and defaults visibility to all-visible", () => {
  const { bimVisibility, ...data } = createExampleProject();
  const { hatches, wallTJunctions, wallJoins, ...oldStorey } = data.storey;
  const v2 = {
    ...data,
    storey: { ...oldStorey, walls: oldStorey.walls.map(({ bodyOffset, ...wall }) => wall) },
    schemaVersion: 2,
  };
  const migrated = loadProjectData(v2);
  assert.equal(migrated.schemaVersion, 8);
  assert.deepEqual(migrated.storey, {
    ...oldStorey,
    hatches: [],
    wallJoins: [],
    wallTJunctions: [],
  });
  assert.deepEqual(migrated.bimVisibility, { hiddenLayerIds: [] });
  assert.equal(v2.schemaVersion, 2);
  assert.throws(() => loadProjectData({ ...v2, bimVisibility }));
  assert.throws(() =>
    loadProjectData({ ...v2, defaultLayerIds: { ...v2.defaultLayerIds, wall: "unknown" } }),
  );
  assert.throws(() =>
    loadProjectData({ ...migrated, bimVisibility: { hiddenLayerIds: ["missing"] } }),
  );
  assert.throws(() =>
    loadProjectData({
      ...migrated,
      bimVisibility: {
        hiddenLayerIds: [migrated.defaultLayerIds.wall, migrated.defaultLayerIds.wall],
      },
    }),
  );
  assert.throws(() => loadProjectData({ ...data, schemaVersion: 3 }));
});

test("palette actions reject stale/unknown targets; loading resets only the palette history", () => {
  const state = hide(createEditingState(createExampleProject()));
  const p = state.history.present;
  assert.throws(() =>
    changeLayerVisibility(structuredClone(p), p, emptyVisibilityHistory(), {
      kind: "set",
      layerId: p.defaultLayerIds.wall,
      visible: true,
    }),
  );
  assert.throws(() =>
    changeLayerVisibility(p, p, emptyVisibilityHistory(), {
      kind: "set",
      layerId: "missing",
      visible: false,
    }),
  );
  const loaded = editingReducer(state, { type: "load-project", project: createExampleProject() });
  assert.deepEqual(loaded.visibilityHistory, emptyVisibilityHistory());
  assert.equal(loaded.history.past.length, state.history.past.length);
  assert.deepEqual(loaded.history.present.bimVisibility.hiddenLayerIds, []);
  assert.equal(palette(loaded, "undo"), loaded);
});

test("deleting an empty hidden layer cleans references; independent palette undo cannot resurrect it", () => {
  const p = createExampleProject();
  const custom = previewLayerManagement(p, p, { kind: "create", id: "custom", name: "Test" });
  const hidden = changeLayerVisibility(custom, custom, emptyVisibilityHistory(), {
    kind: "set",
    layerId: "custom",
    visible: false,
  });
  const removed = previewLayerManagement(hidden.project, hidden.project, {
    kind: "delete",
    id: "custom",
  });
  assert.deepEqual(removed.bimVisibility.hiddenLayerIds, []);
  const undone = changeLayerVisibility(removed, removed, hidden.history, { kind: "undo" });
  const redone = changeLayerVisibility(undone.project, undone.project, undone.history, {
    kind: "redo",
  });
  assert.deepEqual(redone.project.bimVisibility.hiddenLayerIds, []);
  assert.ok(!redone.project.layers.some((l) => l.id === "custom"));
});

test("toolbar operations change the complete layer catalogue atomically in palette history", () => {
  const p = createExampleProject();
  const allIds = p.layers.map((l) => l.id);
  const apply = (
    state: ReturnType<typeof createEditingState>,
    action: import("./visibility-actions.ts").VisibilityAction,
  ) => editingReducer(state, { type: "visibility", base: state.history.present, action });
  const initial = createEditingState(p);
  const hidden = apply(initial, { kind: "hide-selected", layerId: p.defaultLayerIds.wall });
  assert.deepEqual(hidden.history.present.bimVisibility.hiddenLayerIds, [p.defaultLayerIds.wall]);
  assert.equal(hidden.history.past.length, 0);
  assert.equal(hidden.visibilityHistory!.past.length, 1);
  assert.equal(apply(hidden, { kind: "hide-selected", layerId: p.defaultLayerIds.wall }), hidden);
  assert.deepEqual(palette(hidden, "undo").history.present.bimVisibility.hiddenLayerIds, []);
  const others = apply(hidden, { kind: "hide-others", layerId: p.defaultLayerIds.wall });
  assert.deepEqual(
    others.history.present.bimVisibility.hiddenLayerIds,
    allIds.filter((id) => id !== p.defaultLayerIds.wall),
  );
  assert.equal(others.visibilityHistory!.past.length, 2);
  const all = apply(others, { kind: "hide-all" });
  assert.deepEqual(all.history.present.bimVisibility.hiddenLayerIds, allIds);
  assert.equal(all.visibilityHistory!.past.length, 3); // one entry, not one per layer
  assert.deepEqual(
    palette(all, "undo").history.present.bimVisibility,
    others.history.present.bimVisibility,
  );
  assert.equal(apply(all, { kind: "hide-all" }), all);
  const inverse = apply(all, { kind: "invert" });
  assert.deepEqual(inverse.history.present.bimVisibility.hiddenLayerIds, []);
  const partial = apply(others, { kind: "invert" });
  assert.deepEqual(partial.history.present.bimVisibility.hiddenLayerIds, [p.defaultLayerIds.wall]);
  assert.deepEqual(
    apply(partial, { kind: "invert" }).history.present.bimVisibility,
    others.history.present.bimVisibility,
  );
  assert.deepEqual(all.history.present.storey, p.storey);
});

test("toolbar operations reject unknown layer IDs and stale project bindings", () => {
  const p = createExampleProject();
  for (const kind of ["hide-selected", "hide-others"] as const) {
    assert.throws(() =>
      changeLayerVisibility(p, p, emptyVisibilityHistory(), { kind, layerId: "missing" }),
    );
    assert.throws(() =>
      changeLayerVisibility(structuredClone(p), p, emptyVisibilityHistory(), {
        kind,
        layerId: p.defaultLayerIds.wall,
      }),
    );
  }
  for (const kind of ["hide-all", "invert"] as const)
    assert.throws(() =>
      changeLayerVisibility(structuredClone(p), p, emptyVisibilityHistory(), { kind }),
    );
});
