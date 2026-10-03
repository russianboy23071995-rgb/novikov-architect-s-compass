import test from "node:test";
import assert from "node:assert/strict";
import { previewLineInput } from "./line-input.ts";
import { precisionTarget } from "../input/precision.ts";
import { createProject, addLine, serializeProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { readProjectFile } from "../../lib/bim/history.ts";

test("line input shares polar parsing, exact values and mouse direction", () => {
  const p = createProject("p", "s"),
    origin = { x: 1, y: 2 };
  assert.deepEqual(previewLineInput(p, p, origin, null, "90", "1,25").point, { x: 1, y: 3.25 });
  assert.deepEqual(previewLineInput(p, p, origin, { x: 9, y: 9 }, "90", "1,25").point, {
    x: 1,
    y: 3.25,
  });
  assert.deepEqual(previewLineInput(p, p, origin, { x: 1, y: 8 }, "", "2").point, { x: 1, y: 4 });
  assert.deepEqual(previewLineInput(p, p, origin, null, "360", "-2").point, { x: -1, y: 2 });
  assert.deepEqual(
    previewLineInput(p, p, origin, { x: 4, y: 6 }, "", ""),
    precisionTarget(origin, { x: 4, y: 6 }, "", ""),
  );
});
test("line input rejects invalid dimensions, angles, zero length and stale model", () => {
  const p = createProject("p", "s"),
    o = { x: 0, y: 0 };
  for (const angle of ["-1", "566", "360,01", "NaN", "abc"])
    assert.throws(() => previewLineInput(p, p, o, null, angle, "2"));
  for (const length of ["0", "Infinity", "abc"])
    assert.throws(() => previewLineInput(p, p, o, null, "0", length));
  assert.throws(() => previewLineInput(p, p, o, null, "", "2"));
  assert.throws(() => previewLineInput(p, createProject("p", "s"), o, null, "0", "2"), /Modell/);
});
test("line preview leaves model intact; commit, undo, redo and JSON share one line", () => {
  const p = createProject("p", "s"),
    origin = { x: 0, y: 0 };
  let state = createEditingState(p);
  const result = previewLineInput(p, p, origin, null, "45", "2");
  assert.equal(state.history.past.length, 0);
  state = editingReducer(state, { type: "cancel" });
  assert.deepEqual(state.history.present, p);
  const next = addLine(p, {
    id: "line",
    kind: "line",
    points: [origin, result.point],
    ...defaultLineAppearance,
  });
  state = editingReducer(state, { type: "project", project: next });
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, p);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, next);
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
});
