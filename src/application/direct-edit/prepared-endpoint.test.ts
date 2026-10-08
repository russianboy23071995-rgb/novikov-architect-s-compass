import test from "node:test";
import assert from "node:assert/strict";
import { tPairFixture } from "../../../benchmarks/t-pair-fixture.ts";
import { createEditingState, editingReducer, previewEdit } from "./controller.ts";
import { editAtPointer } from "../../lib/bim/direct-edit.ts";
const target = { kind: "wall" as const, id: "wall-1" };
function begin() {
  const state = createEditingState(tPairFixture());
  return editingReducer(state, {
    type: "begin",
    target,
    action: "point",
    index: 1,
    anchor: { x: 6, y: 0 },
  });
}
test("shared preview matches full pointer operation and fully checked confirmation", () => {
  const s = begin(),
    session = s.session!;
  for (const point of [
    { x: 8, y: 0 },
    { x: 2, y: 0 },
    { x: 8, y: 0.2 },
  ])
    assert.deepEqual(
      previewEdit(session, s.history.present, target, point),
      editAtPointer(session, s.history.present, point),
    );
  const result = editingReducer(s, {
    type: "confirm",
    session,
    selection: target,
    point: { x: 8, y: 0 },
  });
  assert.equal(result.error, "");
  assert.equal(result.history.past.length, 1);
  assert.deepEqual(editingReducer(result, { type: "undo" }).history.present, s.history.present);
});
test("cancelled, replaced, stale and changed-selection sessions cannot publish", () => {
  const s = begin(),
    session = s.session!,
    point = { x: 8, y: 0 };
  previewEdit(session, s.history.present, target, point);
  const cancel = editingReducer(s, { type: "cancel" });
  assert.equal(cancel.history, s.history);
  assert.ok(editingReducer(cancel, { type: "confirm", session, selection: target, point }).error);
  assert.throws(() => previewEdit(session, { ...s.history.present }, target, point));
  assert.throws(() =>
    previewEdit(session, s.history.present, { kind: "wall", id: "wall-2" }, point),
  );
  const other = editingReducer(s, {
    type: "begin",
    target,
    action: "point",
    index: 1,
    anchor: { x: 6, y: 0 },
  });
  assert.ok(editingReducer(other, { type: "confirm", session, selection: target, point }).error);
});
test("non-axis corner anchors and other grips retain exact pointer semantics", () => {
  const s = begin();
  for (const [index, anchor] of [
    [0, { x: 0, y: 0 }],
    [1, { x: 6, y: 0.18 }],
  ] as const) {
    const started = editingReducer(s, { type: "begin", target, action: "point", index, anchor });
    const session = started.session!,
      point = { x: anchor.x + 1, y: anchor.y };
    assert.deepEqual(
      previewEdit(session, s.history.present, target, point),
      editAtPointer(session, s.history.present, point),
    );
  }
});
