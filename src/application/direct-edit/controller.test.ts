import test from "node:test";
import assert from "node:assert/strict";
import { createEditingState, editingReducer, previewEdit } from "./controller.ts";
import {
  createProject,
  addWall,
  addWindow,
  addLine,
  serializeProject,
  updateWall,
} from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";

const wall = { kind: "wall" as const, id: "wall" };
const initial = () =>
  createEditingState(
    addWindow(
      addWall(createProject("project", "storey"), {
        id: "wall",
        start: { x: 0, y: 0 },
        end: { x: 3, y: 0 },
        thickness: 0.36,
        height: 2.8,
      }),
      { id: "window", wallId: "wall", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 },
    ),
  );
const begin = () =>
  editingReducer(initial(), { type: "begin", target: wall, action: "move", index: null });

test("repeated previews preserve history and model; one confirmation has one reversible commit", () => {
  const state = begin();
  const before = serializeProject(state.history.present);
  for (let i = 1; i <= 40; i++) {
    const preview = previewEdit(state.session!, state.history.present, wall, { x: i, y: 2 });
    assert.deepEqual(preview.storey.walls[0]!.start, { x: i, y: 2 });
  }
  assert.equal(serializeProject(state.history.present), before);
  assert.equal(state.history.past.length, 0);
  const moved = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 4, y: 2 },
  });
  assert.equal(moved.error, "");
  assert.equal(moved.session, null);
  assert.equal(moved.history.past.length, 1);
  assert.deepEqual(moved.history.present.storey.windows, state.history.present.storey.windows);
  assert.equal(serializeProject(editingReducer(moved, { type: "undo" }).history.present), before);
  assert.deepEqual(
    editingReducer(editingReducer(moved, { type: "undo" }), { type: "redo" }).history.present,
    moved.history.present,
  );
});

test("cancel closes the interaction without changing history and rejects delayed confirmation", () => {
  const state = begin();
  const cancelled = editingReducer(state, { type: "cancel" });
  assert.equal(cancelled.history, state.history);
  assert.equal(cancelled.session, null);
  const late = editingReducer(cancelled, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 2, y: 0 },
  });
  assert.equal(late.history, state.history);
  assert.notEqual(late.error, "");
});

test("selection change, stale session and changed model cannot commit", () => {
  const state = begin();
  for (const selection of [
    null,
    { kind: "wall" as const, id: "other" },
    { kind: "line" as const, id: "wall" },
  ]) {
    const rejected = editingReducer(state, {
      type: "confirm",
      session: state.session!,
      selection,
      point: { x: 1, y: 0 },
    });
    assert.equal(rejected.history, state.history);
    assert.notEqual(rejected.error, "");
  }
  const restarted = editingReducer(state, {
    type: "begin",
    target: wall,
    action: "move",
    index: null,
  });
  assert.equal(
    editingReducer(restarted, {
      type: "confirm",
      session: state.session!,
      selection: wall,
      point: { x: 1, y: 0 },
    }).history,
    state.history,
  );
  const changed = editingReducer(state, {
    type: "project",
    project: updateWall(state.history.present, "wall", { height: 3 }),
  });
  assert.equal(changed.session, null);
  assert.throws(() => previewEdit(state.session!, changed.history.present, wall, { x: 1, y: 0 }));
  assert.equal(
    editingReducer(changed, {
      type: "confirm",
      session: state.session!,
      selection: wall,
      point: { x: 1, y: 0 },
    }).history,
    changed.history,
  );
});

test("invalid pointer is atomic and recoverable; no-op preserves redo history", () => {
  const state = begin();
  const invalid = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: NaN, y: 0 },
  });
  assert.equal(invalid.history, state.history);
  assert.equal(invalid.session, state.session);
  const moved = editingReducer(invalid, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 1, y: 0 },
  });
  assert.equal(moved.error, "");
  const undone = editingReducer(moved, { type: "undo" });
  const again = editingReducer(undone, {
    type: "begin",
    target: wall,
    action: "move",
    index: null,
  });
  const noop = editingReducer(again, {
    type: "confirm",
    session: again.session!,
    selection: wall,
    point: again.session!.anchor,
  });
  assert.equal(noop.history, undone.history);
  assert.equal(noop.history.future.length, 1);
});

test("invalid starts and window-invalid point edits leave the committed model intact", () => {
  const state = initial();
  const bad = editingReducer(state, {
    type: "begin",
    target: { kind: "wall", id: "missing" },
    action: "move",
    index: null,
  });
  assert.equal(bad.history, state.history);
  assert.equal(bad.session, null);
  assert.notEqual(bad.error, "");
  const point = editingReducer(state, {
    type: "begin",
    target: wall,
    action: "point",
    index: 1,
    anchor: { x: 3, y: 0 },
  });
  const invalid = editingReducer(point, {
    type: "confirm",
    session: point.session!,
    selection: wall,
    point: { x: 0.5, y: 0 },
  });
  assert.equal(invalid.history, state.history);
  assert.notEqual(invalid.error, "");
});

test("line movement uses the same lifecycle, retaining ID and style through JSON", () => {
  const base = initial();
  const project = addLine(base.history.present, {
    id: "line",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 3 },
    ],
    ...defaultLineAppearance,
  });
  const target = { kind: "line" as const, id: "line" };
  const state = editingReducer(createEditingState(project), {
    type: "begin",
    target,
    action: "move",
    index: null,
  });
  const moved = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: { x: 4, y: 2 },
  });
  const line = moved.history.present.storey.lines![0]!;
  assert.deepEqual(line, {
    ...project.storey.lines![0],
    points: [
      { x: 4, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 5 },
    ],
  });
  assert.deepEqual(readProjectFile(serializeProject(moved.history.present)), moved.history.present);
  assert.deepEqual(editingReducer(moved, { type: "undo" }).history.present, project);
});

test("confirmed wall movement survives file, solid geometry and IFC adapters", async () => {
  const state = begin();
  const moved = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 4, y: 2 },
  });
  const restored = readProjectFile(serializeProject(moved.history.present));
  assert.deepEqual(buildSolid(restored).min, [4, 1.82, 0]);
  assert.deepEqual(buildSolid(restored).max, [7, 2.18, 2.8]);
  assert.equal(restored.storey.windows[0]!.position, 0.5);
  const ifc = await exportIfc(restored, new Date("2026-10-02T00:00:00Z"));
  assert.ok(ifc.includes("IFCCARTESIANPOINT((4.,2.,0.))"));
  assert.ok(ifc.includes("IFCLENGTHMEASURE(3.)"));
});

test("history navigation cancels pending work and duplicate confirmation cannot add another step", () => {
  const state = begin();
  assert.equal(editingReducer(state, { type: "undo" }).session, null);
  assert.equal(editingReducer(state, { type: "redo" }).session, null);
  const event = {
    type: "confirm" as const,
    session: state.session!,
    selection: wall,
    point: { x: 1, y: 2 },
  };
  const once = editingReducer(state, event);
  assert.equal(editingReducer(once, event).history, once.history);
});
