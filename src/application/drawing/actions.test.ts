import test from "node:test";
import assert from "node:assert/strict";
import { createDrawing, previewDrawingInput, defaultDrawingWall } from "./actions.ts";
import { createProject, serializeProject, wallLength } from "../../lib/bim/model.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
test("shared drawing creates exact wall dimensions with one history step and matching JSON/solid", () => {
  const base = createProject("p", "s"),
    start = { x: 0, y: 0 };
  const target = previewDrawingInput(base, base, start, { x: 9, y: 9 }, "0", "3,00").point;
  assert.deepEqual(target, { x: 3, y: 0 });
  const request = { kind: "wall" as const, start, end: target, ...defaultDrawingWall };
  const preview = createDrawing(base, base, "w", request);
  assert.equal(base.storey.walls.length, 0);
  assert.equal(wallLength(preview.storey.walls[0]!), 3);
  const solid = buildSolid(preview);
  assert.deepEqual(solid.min, [0, -0.18, 0]);
  assert.deepEqual(solid.max, [3, 0.18, 2.8]);
  let state = createEditingState(base);
  assert.equal(editingReducer(state, { type: "cancel" }).history.past.length, 0);
  state = editingReducer(state, { type: "project", project: preview });
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, base);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, preview);
  assert.deepEqual(readProjectFile(serializeProject(preview)), preview);
});
test("drawing validation rejects stale context, zero length, invalid angles and wall dimensions", () => {
  const base = createProject("p", "s"),
    o = { x: 0, y: 0 };
  for (const angle of ["566", "-1", "NaN"])
    assert.throws(() => previewDrawingInput(base, base, o, null, angle, "3"));
  assert.throws(() => previewDrawingInput(base, base, o, null, "0", "0"));
  const request = { kind: "wall" as const, start: o, end: { x: 3, y: 0 }, ...defaultDrawingWall };
  assert.throws(() => createDrawing(base, createProject("p", "s"), "w", request), /Modell/);
  for (const patch of [{ height: 0 }, { thickness: -1 }, { end: o }])
    assert.throws(() => createDrawing(base, base, "w", { ...request, ...patch }));
  assert.throws(
    () => previewDrawingInput(base, createProject("p", "s"), o, null, "0", "3"),
    /Modell/,
  );
  const result = previewDrawingInput(base, base, o, null, "45", "3");
  assert.ok(Math.abs(Math.hypot(result.point.x, result.point.y) - 3) < 1e-12);
});
test("shared creation retains line and polyline appearance and validates stale requests", () => {
  const base = createProject("p", "s");
  for (const lineKind of ["line", "polyline"] as const) {
    const request = {
      kind: "line" as const,
      lineKind,
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
      ],
      appearance: defaultLineAppearance,
    };
    const next = createDrawing(base, base, "l", request);
    assert.equal(next.storey.lines![0]!.kind, lineKind);
    assert.equal(next.storey.lines![0]!.penWidth, 0.25);
    assert.throws(() => createDrawing(base, next, "l2", request), /Modell/);
  }
});
