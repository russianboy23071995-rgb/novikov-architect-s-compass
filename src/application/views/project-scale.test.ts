import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  updateWall,
  serializeProject,
  validateProject,
} from "../../lib/bim/model.ts";
import {
  readProjectFile,
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../../lib/bim/history.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { changeProjectScale, projectScaleContext } from "./project-scale.ts";

function fixture() {
  return addWall(createProject("p", "s"), {
    id: "wall",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
}
test("stored scale round-trip preserves geometry and semantic ownership; old files default to 100", () => {
  const base = fixture(),
    before = serializeProject(base);
  const view = projectScaleContext(base).view;
  for (const denominator of [50, 100, 200, 500, 1000, 2500, 5000, 1234.5]) {
    const next = changeProjectScale(base, view, denominator);
    const loaded = readProjectFile(serializeProject(next));
    assert.equal(projectScaleContext(loaded).denominator, denominator);
    assert.deepEqual(loaded.storey, base.storey);
    assert.equal(changeProjectScale(next, view, denominator), next);
  }
  assert.equal(serializeProject(base), before);
  const old = { ...base, schemaVersion: 14 };
  const migrated = readProjectFile(JSON.stringify(old));
  assert.equal(migrated.schemaVersion, 18);
  assert.equal(projectScaleContext(migrated).denominator, 100);
  assert.deepEqual(migrated.storey, base.storey);
  assert.throws(() => validateProject(old));
  assert.throws(() => readProjectFile(JSON.stringify({ ...old, workingViews: [] })));
});
test("view settings reject invalid, duplicate, unknown or foreign contexts at action/file boundaries", () => {
  const base = fixture(),
    view = projectScaleContext(base).view;
  for (const denominator of [0, -1, NaN, Infinity]) {
    assert.throws(() => changeProjectScale(base, view, denominator));
    assert.throws(() =>
      readProjectFile(
        JSON.stringify({
          ...base,
          workingViews: [{ kind: "working-plan", storeyId: "s", denominator }],
        }),
      ),
    );
  }
  for (const wrong of [
    { ...view, projectId: "other" },
    { ...view, storeyId: "other" },
  ])
    assert.throws(() => changeProjectScale(base, wrong, 50));
  const entry = { kind: "working-plan", storeyId: "s", denominator: 50 };
  for (const workingViews of [
    [entry, entry],
    [{ ...entry, storeyId: "missing" }],
    [{ ...entry, kind: "pane" }],
    [{ ...entry, zoom: 3 }],
  ])
    assert.throws(() => readProjectFile(JSON.stringify({ ...base, workingViews })));
});
test("scale change preserves undo and redo branches and current scale survives both directions", () => {
  const base = fixture(),
    view = projectScaleContext(base).view;
  let history = createHistory(base);
  history = commitProject(history, changeProjectScale(history.present, view, 50));
  assert.equal(history.past.length, 0);
  history = commitProject(history, updateWall(history.present, "wall", { height: 4 }));
  history = undoProject(history);
  assert.equal(history.present.storey.walls[0]!.height, 2.8);
  const past = history.past,
    future = history.future;
  history = commitProject(history, changeProjectScale(history.present, view, 2500));
  assert.equal(history.past, past);
  assert.equal(history.future, future);
  history = redoProject(history);
  assert.equal(history.present.storey.walls[0]!.height, 4);
  assert.equal(projectScaleContext(history.present).denominator, 2500);
  history = undoProject(history);
  assert.equal(projectScaleContext(history.present).denominator, 2500);
  assert.equal(history.present.storey.walls[0]!.height, 2.8);
});
test("application reducer loads the stored value even with reused project ID and rejects stale view events", () => {
  const base = fixture(),
    view = projectScaleContext(base).view;
  let state = createEditingState(base);
  state = editingReducer(state, { type: "view-scale", view, denominator: 5000 });
  assert.equal(state.error, "");
  assert.equal(state.history.past.length, 0);
  assert.equal(projectScaleContext(state.history.present).denominator, 5000);
  const rejected = editingReducer(state, {
    type: "view-scale",
    view: { ...view, projectId: "other" },
    denominator: 50,
  });
  assert.equal(rejected.history, state.history);
  assert.ok(rejected.error);
  state = editingReducer(state, {
    type: "load-project",
    project: changeProjectScale(base, view, 200),
  });
  assert.equal(state.error, "");
  assert.equal(projectScaleContext(state.history.present).denominator, 200);
  const other = createProject("other", "other-storey");
  state = editingReducer(state, { type: "load-project", project: other });
  assert.equal(projectScaleContext(state.history.present).denominator, 100);
});
