import test from "node:test";
import assert from "node:assert/strict";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
  HISTORY_LIMIT,
  PROJECT_FILE_LIMIT,
} from "./history.ts";
import { serializeProject, updateWall, addWindow, createProject } from "./model.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";

test("JSON file round-trip preserves IDs and remains editable", () => {
  const p = createExampleProject();
  const restored = readProjectFile(serializeProject(p));
  assert.deepEqual(restored, p);
  assert.notEqual(restored, p);
  assert.equal(updateWall(restored, "wall-1", { height: 4 }).storey.walls[0]!.height, 4);
});
test("undo and redo restore complete snapshots including hosted windows", () => {
  const p = createExampleProject();
  const h = createHistory(p);
  const next = commitProject(h, updateWall(p, "wall-1", { end: { x: 6, y: 0 } }));
  assert.deepEqual(undoProject(next).present, p);
  assert.deepEqual(redoProject(undoProject(next)).present, next.present);
  assert.equal(next.present.storey.windows[0]!.position, 0.5);
  assert.equal(h.present.storey.walls[0]!.end.x, 3);
});
test("creation is reversible without changing stable IDs", () => {
  const p = createExampleProject();
  const next = addWindow(p, { ...p.storey.windows[0]!, id: "window-2" });
  const h = commitProject(createHistory(p), next);
  assert.equal(undoProject(h).present.storey.windows.length, 1);
  assert.equal(redoProject(undoProject(h)).present.storey.windows[1]!.id, "window-2");
});
test("new edit after undo discards redo branch; no-op does not", () => {
  const h = createHistory(createExampleProject());
  const changed = commitProject(h, updateWall(h.present, "wall-1", { height: 4 }));
  const undone = undoProject(changed);
  assert.equal(commitProject(undone, undone.present), undone);
  const branch = commitProject(undone, updateWall(undone.present, "wall-1", { height: 5 }));
  assert.equal(branch.future.length, 0);
  assert.equal(redoProject(branch), branch);
});
test("file replacement is one undoable change, including an empty project", () => {
  const h = createHistory(createExampleProject());
  const loaded = commitProject(
    h,
    readProjectFile(serializeProject(createProject("other", "floor"))),
  );
  assert.equal(loaded.present.id, "other");
  assert.deepEqual(undoProject(loaded).present, h.present);
  assert.equal(redoProject(undoProject(loaded)).present.id, "other");
});
test("invalid files and geometry reject without modifying history", () => {
  const h = createHistory(createExampleProject());
  const before = serializeProject(h.present);
  for (const text of [
    "oops",
    "{}",
    before.replace('"schemaVersion":4', '"schemaVersion":99'),
    before.replace('"unit":"m"', '"unit":"cm"'),
    before.replace('"width":1.2', '"width":99'),
  ])
    assert.throws(() => readProjectFile(text));
  assert.throws(() => commitProject(h, { ...h.present, unit: "cm" } as never));
  assert.equal(serializeProject(h.present), before);
  assert.equal(h.past.length, 0);
  assert.throws(() => readProjectFile(" ".repeat(PROJECT_FILE_LIMIT + 1)), /10 MB/);
});
test("history is bounded and initial/last navigation is a no-op", () => {
  let h = createHistory(createExampleProject());
  assert.equal(undoProject(h), h);
  assert.equal(redoProject(h), h);
  for (let i = 0; i < 120; i++)
    h = commitProject(h, updateWall(h.present, "wall-1", { height: 3 + i }));
  assert.equal(h.past.length, HISTORY_LIMIT);
  for (let i = 0; i < HISTORY_LIMIT; i++) h = undoProject(h);
  assert.equal(h.past.length, 0);
  assert.equal(h.future.length, HISTORY_LIMIT);
});
test("caller mutation cannot change initial or committed snapshots", () => {
  const p = createExampleProject();
  const h = createHistory(p);
  p.storey.walls[0]!.height = 99;
  assert.equal(h.present.storey.walls[0]!.height, 2.8);
  const input = updateWall(h.present, "wall-1", { height: 4 });
  const next = commitProject(h, input);
  input.storey.walls[0]!.height = 100;
  assert.equal(next.present.storey.walls[0]!.height, 4);
});
