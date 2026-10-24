import { storeyOf } from "../../domain/storeys/access.ts";
import { PROJECT_MIN_READ_VERSION, PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
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
import {
  serializeProject,
  updateWall,
  addWindow,
  createProject,
  validateProject,
} from "./model.ts";
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";

test("JSON file round-trip preserves IDs and remains editable", () => {
  const p = createExampleProject();
  const restored = readProjectFile(serializeProject(p));
  assert.deepEqual(restored, p);
  assert.notEqual(restored, p);
  assert.equal(storeyOf(updateWall(restored, "wall-1", { height: 4 })).walls[0]!.height, 4);
});
test("undo and redo restore complete snapshots including hosted windows", () => {
  const p = createExampleProject();
  const h = createHistory(p);
  const next = commitProject(h, updateWall(p, "wall-1", { end: { x: 6, y: 0 } }));
  assert.deepEqual(undoProject(next).present, p);
  assert.deepEqual(redoProject(undoProject(next)).present, next.present);
  assert.equal(storeyOf(next.present).windows[0]!.position, 0.5);
  assert.equal(storeyOf(h.present).walls[0]!.end.x, 3);
});
test("creation is reversible without changing stable IDs", () => {
  const p = createExampleProject();
  const next = addWindow(p, { ...storeyOf(p).windows[0]!, id: "window-2" });
  const h = commitProject(createHistory(p), next);
  assert.equal(storeyOf(undoProject(h).present).windows.length, 1);
  assert.equal(storeyOf(redoProject(undoProject(h)).present).windows[1]!.id, "window-2");
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
    before.replace('"schemaVersion":26', '"schemaVersion":99'),
    before.replace('"unit":"m"', '"unit":"cm"'),
    before.replace('"width":1.2', '"width":99'),
  ])
    assert.throws(() => readProjectFile(text));
  assert.throws(() => commitProject(h, { ...h.present, unit: "cm" } as never));
  assert.equal(serializeProject(h.present), before);
  assert.equal(h.past.length, 0);
  assert.throws(() => readProjectFile(" ".repeat(PROJECT_FILE_LIMIT + 1)), /128 MiB/);
});

test("file error names the current format contract used by model and loader", () => {
  const project = createExampleProject();
  assert.equal(project.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(readProjectFile(serializeProject(project)), project);
  assert.throws(
    () => readProjectFile("{}"),
    new RegExp(`Version ${PROJECT_MIN_READ_VERSION} bis ${PROJECT_SCHEMA_VERSION}, Meter`),
  );
  assert.throws(() =>
    readProjectFile(JSON.stringify({ ...project, schemaVersion: PROJECT_SCHEMA_VERSION + 1 })),
  );
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
  storeyOf(p).walls[0]!.height = 99;
  assert.equal(storeyOf(h.present).walls[0]!.height, 2.8);
  const input = updateWall(h.present, "wall-1", { height: 4 });
  const next = commitProject(h, input);
  storeyOf(input).walls[0]!.height = 100;
  assert.equal(storeyOf(next.present).walls[0]!.height, 4);
});

test("normalized no-op preserves the exact history and redo branch", () => {
  const initial = createHistory(createExampleProject());
  const undone = undoProject(
    commitProject(initial, updateWall(initial.present, "wall-1", { height: 4 })),
  );
  const same = structuredClone(undone.present);
  same.id = ` ${same.id} `;
  same.layers[0]!.name = ` ${same.layers[0]!.name} `;
  assert.equal(commitProject(undone, same), undone);
  assert.equal(storeyOf(redoProject(undone).present).walls[0]!.height, 4);
});

test("visibility-only commit preserves model undo/redo including image assets", () => {
  const p = createExampleProject();
  p.assets.push({
    id: "asset",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "AAAA",
  });
  const initial = createHistory(p);
  const undone = undoProject(
    commitProject(initial, updateWall(initial.present, "wall-1", { height: 4 })),
  );
  const input = { ...undone.present, bimVisibility: { hiddenLayerIds: [p.defaultLayerIds.wall] } };
  const hidden = commitProject(undone, input);
  assert.equal(hidden.past, undone.past);
  assert.equal(hidden.future, undone.future);
  input.bimVisibility.hiddenLayerIds.length = 0;
  assert.deepEqual(hidden.present.bimVisibility.hiddenLayerIds, [p.defaultLayerIds.wall]);
  const redone = redoProject(hidden);
  assert.equal(storeyOf(redone.present).walls[0]!.height, 4);
  assert.deepEqual(redone.present.bimVisibility, hidden.present.bimVisibility);
  assert.deepEqual(readProjectFile(serializeProject(redone.present)), redone.present);
});

test("commit rechecks geometry and asset data even after an earlier successful commit", () => {
  const h = createHistory(createExampleProject());
  const input = structuredClone(h.present);
  input.assets.push({
    id: "asset",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "AAAA",
  });
  const committed = commitProject(h, input);
  input.assets[0]!.data = "AA?A";
  assert.throws(() => commitProject(committed, input), /base64/);
  const disconnected = structuredClone(committed.present);
  storeyOf(disconnected).wallJoins.push({
    first: { wallId: "wall-1", endpoint: 0 },
    second: { wallId: "missing", endpoint: 1 },
  });
  assert.throws(() => commitProject(committed, disconnected));
  assert.equal(committed.present.assets[0]!.data, "AAAA");
  assert.equal(committed.past.length, 1);
});

test("committed snapshots are frozen and share unchanged subtrees with the previous state", () => {
  const h = createHistory(createExampleProject());
  const input = addWindow(h.present, { ...storeyOf(h.present).windows[0]!, id: "window-2" });
  const next = commitProject(h, input);
  assert.ok(isOwnedProjectSnapshot(h.present) && isOwnedProjectSnapshot(next.present));
  assert.throws(() => (storeyOf(next.present).walls[0]!.height = 9), TypeError);
  // Exact content of the fully validated input, including serialized key order.
  assert.equal(serializeProject(next.present), serializeProject(validateProject(input)));
  assert.equal(storeyOf(next.present).walls, storeyOf(h.present).walls);
  assert.equal(next.present.layers, h.present.layers);
  assert.equal(storeyOf(next.present).windows[0], storeyOf(h.present).windows[0]);
  assert.notEqual(storeyOf(next.present).windows, storeyOf(h.present).windows);
  assert.equal(undoProject(next).present, h.present);
});

test("a present without owned provenance keeps the full previous-state validation", () => {
  const h = createHistory(createExampleProject());
  const input = updateWall(h.present, "wall-1", { height: 4 });
  const foreign = structuredClone(h.present);
  storeyOf(foreign).walls[0]!.height = -1;
  assert.throws(() => commitProject({ ...h, present: foreign }, input));
  assert.equal(commitProject(h, input).past.length, 1);
});

test("commit retains the UTF-8 file-size boundary without touching history on rejection", () => {
  const h = createHistory(createExampleProject());
  const input = structuredClone(h.present);
  // String length is below the limit; its UTF-8 representation exceeds it.
  input.layers[0]!.name = "\u00e4".repeat(PROJECT_FILE_LIMIT / 2);
  assert.ok(JSON.stringify(input).length < PROJECT_FILE_LIMIT);
  assert.throws(() => commitProject(h, input), /128 MiB/);
  assert.throws(() => serializeProject(input), /128 MiB/);
  assert.equal(h.past.length, 0);
  assert.equal(h.future.length, 0);
  assert.notEqual(h.present.layers[0]!.name, input.layers[0]!.name);
});
