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
