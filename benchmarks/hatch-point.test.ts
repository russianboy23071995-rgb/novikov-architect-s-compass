import test from "node:test";
import assert from "node:assert/strict";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import {
  previewEdit,
  createEditingState,
  editingReducer,
} from "../src/application/direct-edit/controller.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";

function session(base: ReturnType<typeof hatchPointFixture>, index: number): EditSession {
  return {
    base,
    target: { kind: "hatch", id: "h0" },
    action: "point",
    index,
    anchor: { ...storeyOf(base).hatches[0]!.points[index]! },
  };
}
test("shared hatch point preview matches full project, plan and pattern at every grip", () => {
  for (const vertices of [4, 129, 500]) {
    const base = hatchPointFixture(3, vertices);
    for (const index of [0, 1, vertices - 1]) {
      const edit = session(base, index),
        prepared = prepareDirectEditPreview(edit)!;
      assert.ok(prepared?.materialize);
      for (const delta of [0, 0.01, -0.01]) {
        const point = { x: edit.anchor.x + delta, y: edit.anchor.y + delta };
        const full = editAtPointer(edit, base, point);
        const patch = prepared.evaluate(base, edit.target, point);
        assert.deepEqual(patch.replacedIds, ["h0"]);
        assert.deepEqual(storeyOf(patch.geometry).hatches, [storeyOf(full).hatches[0]]);
        const materialized = previewEdit(edit, base, edit.target, point);
        assert.deepEqual(materialized, full);
        assert.deepEqual(
          derivePlanScene(materialized, () => true, base.hatchPatterns),
          derivePlanScene(full, () => true, base.hatchPatterns),
        );
        assert.deepEqual(
          storeyOf(patch.geometry).hatches[0]!.pattern,
          storeyOf(base).hatches[0]!.pattern,
        );
      }
      const first = previewEdit(edit, base, edit.target, edit.anchor);
      const second = previewEdit(edit, base, edit.target, {
        x: edit.anchor.x + 0.01,
        y: edit.anchor.y,
      });
      assert.equal(storeyOf(first).hatches[1], storeyOf(second).hatches[1]);
      assert.equal(first.storeys[1], second.storeys[1]);
    }
  }
});
test("invalid contours, stale contexts and unsupported gestures retain full-path semantics", () => {
  const base = hatchPointFixture(2, 4),
    edit = session(base, 0);
  const prepared = prepareDirectEditPreview(edit)!;
  for (const point of [
    { x: NaN, y: 0 },
    { x: Infinity, y: 0 },
    storeyOf(base).hatches[0]!.points[1]!,
    { x: -20, y: 0 },
  ]) {
    let failed = false;
    try {
      editAtPointer(edit, base, point);
    } catch {
      failed = true;
    }
    if (failed) assert.throws(() => prepared.evaluate(base, edit.target, point));
    else
      assert.deepEqual(
        prepared.materialize!(base, edit.target, point),
        editAtPointer(edit, base, point),
      );
  }
  assert.throws(() => prepared.evaluate({ ...base }, edit.target, edit.anchor));
  assert.throws(() => prepared.evaluate(base, { kind: "hatch", id: "h1" }, edit.anchor));
  assert.throws(() => prepareDirectEditPreview({ ...edit, index: 99 }));
  assert.equal(prepareDirectEditPreview({ ...edit, action: "offset" }), null);
});
test("hatch preview is disposable and placement retains full validation and one undo", () => {
  let state = createEditingState(hatchPointFixture(3, 100));
  const base = state.history.present;
  state = editingReducer(state, {
    type: "begin",
    target: { kind: "hatch", id: "h0" },
    action: "point",
    index: 0,
  });
  assert.ok(state.session);
  const edit = state.session,
    point = { x: edit.anchor.x + 0.1, y: edit.anchor.y };
  previewEdit(edit, base, edit.target, point);
  assert.equal(state.history.past.length, 0);
  const cancelled = editingReducer(state, { type: "cancel" });
  assert.equal(cancelled.history.present, base);
  const placed = editingReducer(state, {
    type: "confirm",
    session: edit,
    selection: edit.target,
    point,
  });
  assert.equal(placed.error, "");
  assert.equal(placed.history.past.length, 1);
  assert.deepEqual(placed.history.present, editAtPointer(edit, base, point));
  assert.deepEqual(editingReducer(placed, { type: "undo" }).history.present, base);
  storeyOf(base).hatches[1]!.points[0]!.x = NaN;
  const invalid = editingReducer(state, {
    type: "confirm",
    session: edit,
    selection: edit.target,
    point,
  });
  assert.ok(invalid.error);
  assert.equal(invalid.history.past.length, 0);
});

test("incremental hatch points match full validation for concavity, crossings and large coordinates", () => {
  let seed = 907;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (const offset of [0, 1e9]) {
    const base = hatchPointFixture(2, 40);
    storeyOf(base).hatches[0]!.points = Array.from({ length: 40 }, (_, i) => {
      const angle = (i * Math.PI) / 20,
        radius = i % 2 ? 7 : 10;
      return { x: offset + radius * Math.cos(angle), y: offset + radius * Math.sin(angle) };
    });
    for (const index of [0, 1, 17, 39]) {
      const edit = session(base, index);
      // Non-vertex origins must preserve offset arithmetic, not assign pointer directly.
      edit.anchor = { x: edit.anchor.x + 0.3, y: edit.anchor.y - 0.7 };
      const prepared = prepareDirectEditPreview(edit)!;
      const targets = Array.from({ length: 35 }, () => ({
        x: offset + random() * 30 - 15,
        y: offset + random() * 30 - 15,
      }));
      targets.push(edit.anchor, { x: 1e308, y: -1e308 });
      for (const point of targets) {
        let full: ReturnType<typeof editAtPointer> | undefined;
        try {
          full = editAtPointer(edit, base, point);
        } catch {
          /* Expected invalid geometry. */
        }
        if (!full) assert.throws(() => prepared.evaluate(base, edit.target, point));
        else assert.deepEqual(prepared.materialize!(base, edit.target, point), full);
      }
    }
  }
});

test("prepared contour owns its baseline and returned previews cannot corrupt later targets", () => {
  const base = hatchPointFixture(2, 129),
    edit = session(base, 0);
  const prepared = prepareDirectEditPreview(edit)!;
  const expected = editAtPointer(edit, base, { x: 10.1, y: 0 });
  const patch = prepared.evaluate(base, edit.target, { x: 10.1, y: 0 });
  assert.throws(() => {
    storeyOf(patch.geometry).hatches[0]!.points[1]!.x = NaN;
  });
  assert.throws(() => {
    storeyOf(patch.geometry).hatches[0]!.fill.color = "#ffffff";
  });
  edit.anchor.x = 500;
  storeyOf(base).hatches[0]!.points[5]!.x = NaN;
  assert.deepEqual(
    prepared.materialize!(base, { kind: "hatch", id: "h0" }, { x: 10.1, y: 0 }),
    expected,
  );
});
