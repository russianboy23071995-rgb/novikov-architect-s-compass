import test from "node:test";
import assert from "node:assert/strict";
import { evaluateInteraction, confirmInteraction } from "./interaction.ts";
import { drawingInteraction, editInteraction } from "./adapters.ts";
import { createDrawing, defaultDrawingWall } from "../drawing/actions.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { createProject, addWall, addLine, updateWall } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
const origin = { x: 0, y: 0 };
test("same lifecycle evaluates and commits both drawing adapters exactly once", () => {
  for (const kind of ["wall", "line"] as const) {
    const base = createProject("p", "s");
    let state = createEditingState(base);
    let count = 0,
      cancelled = false;
    const tool = drawingInteraction(
      base,
      base,
      origin,
      (point) => {
        count++;
        const project = createDrawing(
          base,
          base,
          "element",
          kind === "wall"
            ? { kind, start: origin, end: point, ...defaultDrawingWall }
            : {
                kind,
                lineKind: "line",
                points: [origin, point],
                appearance: defaultLineAppearance,
              },
        );
        state = editingReducer(state, { type: "project", project });
      },
      () => {
        cancelled = true;
      },
    );
    assert.equal(evaluateInteraction(tool, "", "", null).value, null);
    assert.equal(evaluateInteraction(tool, "566", "2", null).value, null);
    assert.equal(count, 0);
    const preview = evaluateInteraction(tool, "90", "3", null);
    assert.deepEqual(preview.value?.point, { x: 0, y: 3 });
    assert.equal(state.history.past.length, 0);
    confirmInteraction(tool, preview.value!.point);
    assert.equal(count, 1);
    assert.equal(state.history.past.length, 1);
    assert.deepEqual(editingReducer(state, { type: "undo" }).history.present, base);
    tool.cancel();
    assert.equal(cancelled, true);
  }
});
test("shared interaction preserves point/element and constrained-action semantics", () => {
  const base = addLine(
    addWall(createProject("p", "s"), {
      id: "wall",
      start: origin,
      end: { x: 3, y: 0 },
      ...defaultDrawingWall,
    }),
    { id: "line", kind: "line", points: [origin, { x: 3, y: 0 }], ...defaultLineAppearance },
  );
  for (const kind of ["wall", "line"] as const)
    for (const action of ["point", "move", "stretch", "axis", "x", "y"] as const) {
      const target = { kind, id: kind };
      let state = editingReducer(createEditingState(base), {
        type: "begin",
        target,
        action,
        index: 1,
        anchor: { x: 3, y: 0 },
      });
      const session = state.session!;
      const adapter = editInteraction(
        session,
        state.history.present,
        target,
        (point) => {
          state = editingReducer(state, { type: "confirm", session, selection: target, point });
        },
        () => {
          state = editingReducer(state, { type: "cancel" });
        },
      );
      assert.equal(adapter.click, action === "move" ? "direction" : "confirm");
      const preview = evaluateInteraction(adapter, "90", "1", null);
      assert.ok(preview.value, preview.error);
      assert.equal(state.history.past.length, 0);
      confirmInteraction(adapter, preview.value!.point);
      assert.equal(state.error, "");
      assert.equal(state.history.past.length, 1);
      assert.deepEqual(editingReducer(state, { type: "undo" }).history.present, base);
    }
});
test("invalid or stale confirmation never reaches mutation callback", () => {
  const base = addWall(createProject("p", "s"), {
    id: "wall",
    start: origin,
    end: { x: 3, y: 0 },
    ...defaultDrawingWall,
  });
  let calls = 0;
  const draw = drawingInteraction(
    base,
    base,
    origin,
    () => {
      calls++;
    },
    () => {},
  );
  assert.throws(() => confirmInteraction(draw, origin));
  assert.equal(calls, 0);
  const stale = drawingInteraction(
    base,
    updateWall(base, "wall", { height: 3 }),
    origin,
    () => {
      calls++;
    },
    () => {},
  );
  assert.throws(() => confirmInteraction(stale, { x: 1, y: 0 }), /Modell/);
  const target = { kind: "wall" as const, id: "wall" };
  const state = editingReducer(createEditingState(base), {
    type: "begin",
    target,
    action: "move",
    index: null,
  });
  const edit = editInteraction(
    state.session!,
    state.history.present,
    null,
    () => {
      calls++;
    },
    () => {},
  );
  assert.throws(() => confirmInteraction(edit, { x: 1, y: 0 }), /Auswahl/);
  assert.equal(calls, 0);
});

test("successive polyline segments reuse drawing interaction without commits until one final action", () => {
  const base = createProject("p", "s");
  let state = createEditingState(base);
  const points = [{ x: 0, y: 0 }];
  for (const [angle, length, expected] of [
    ["0", "3", { x: 3, y: 0 }],
    ["90", "2", { x: 3, y: 2 }],
    ["180", "1", { x: 2, y: 2 }],
  ] as const) {
    const start = points.at(-1)!;
    const tool = drawingInteraction(
      base,
      base,
      start,
      (point) => points.push(point),
      () => {
        points.length = 0;
      },
    );
    assert.equal(tool.identity, start);
    assert.equal(evaluateInteraction(tool, "", "", null).value, null);
    assert.equal(evaluateInteraction(tool, "0", "0", null).value, null);
    assert.equal(evaluateInteraction(tool, "566", "1", null).value, null);
    const result = evaluateInteraction(tool, angle, length, null);
    assert.deepEqual(result.value?.point, expected);
    confirmInteraction(tool, result.value!.point);
    assert.equal(state.history.past.length, 0);
    assert.equal(state.history.present.storey.lines?.length ?? 0, 0);
  }
  const next = createDrawing(base, base, "poly", {
    kind: "line",
    lineKind: "polyline",
    points,
    appearance: defaultLineAppearance,
  });
  state = editingReducer(state, { type: "project", project: next });
  assert.equal(state.history.past.length, 1);
  assert.equal(state.history.present.storey.lines![0]!.points.length, 4);
  assert.deepEqual(editingReducer(state, { type: "undo" }).history.present, base);
  const restored = editingReducer(editingReducer(state, { type: "undo" }), { type: "redo" });
  assert.deepEqual(restored.history.present, next);
});
test("cancelling a polyline draft leaves no model element or history entry", () => {
  const base = createProject("p", "s"),
    state = createEditingState(base);
  let points = [origin, { x: 2, y: 0 }];
  const tool = drawingInteraction(
    base,
    base,
    points.at(-1)!,
    (point) => points.push(point),
    () => {
      points = [];
    },
  );
  tool.cancel();
  assert.equal(points.length, 0);
  assert.equal(state.history.past.length, 0);
  assert.equal(state.history.present.storey.lines?.length ?? 0, 0);
});

test("history and project replacement invalidate the old edit session, even after undo to its original model", () => {
  const base = addWall(createProject("original", "storey"), {
    id: "wall",
    start: origin,
    end: { x: 3, y: 0 },
    ...defaultDrawingWall,
  });
  const target = { kind: "wall" as const, id: "wall" };
  let state = editingReducer(createEditingState(base), {
    type: "project",
    project: updateWall(base, "wall", { height: 3 }),
  });
  state = editingReducer(state, { type: "begin", target, action: "point", index: 1 });
  const oldSession = state.session!;
  const replacement = addWall(createProject("replacement", "storey"), {
    id: "wall",
    start: origin,
    end: { x: 5, y: 0 },
    ...defaultDrawingWall,
  });
  for (const event of [
    { type: "undo" as const },
    { type: "redo" as const },
    { type: "project" as const, project: replacement },
    { type: "undo" as const },
  ]) {
    state = editingReducer(state, event);
    assert.equal(state.session, null);
    const before = state.history;
    const attempted = editingReducer(state, {
      type: "confirm",
      session: oldSession,
      selection: target,
      point: { x: 4, y: 1 },
    });
    assert.equal(attempted.history, before);
    assert.match(attempted.error, /nicht mehr aktiv/);
  }
});
test("new project rejects old polyline draft while replacement undo restores only committed model", () => {
  const base = createProject("original", "s");
  const loaded = createProject("loaded", "s");
  const points = [origin, { x: 2, y: 0 }, { x: 2, y: 2 }];
  assert.throws(
    () =>
      createDrawing(base, loaded, "old-poly", {
        kind: "line",
        lineKind: "polyline",
        points,
        appearance: defaultLineAppearance,
      }),
    /Modell/,
  );
  let state = createEditingState(base);
  state = editingReducer(state, { type: "project", project: loaded });
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, base);
  assert.equal(state.history.present.storey.lines?.length ?? 0, 0);
  assert.equal(state.session, null);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, loaded);
});
