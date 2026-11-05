import test from "node:test";
import assert from "node:assert/strict";
import { tamperedState } from "./tampered-state.ts";
import { lineEdgeFixture } from "./line-edge-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import {
  previewEdit,
  createEditingState,
  editingReducer,
} from "../src/application/direct-edit/controller.ts";
import { editAtPointer, type EditSession } from "../src/application/direct-edit/session.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
import { MAX_LINE_POINTS } from "../src/domain/project/schema.ts";

test("insertion matches full action, patches and plans for both windings and concavity", () => {
  for (const reverse of [false, true])
    for (const index of [0, 4]) {
      const base = lineEdgeFixture(3, 4);
      const styled = storeyOf(base).lines![0]!;
      styled.style = "custom";
      styled.color = "#334155";
      styled.repeatLength = 1.5;
      styled.pattern = {
        id: "p",
        name: "Fixed",
        dashes: [],
        color: "#334155",
        colorEditable: false,
        period: 1,
        segments: [{ start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }],
      };
      const ring = [
        { x: 0, y: 0 },
        { x: 4, y: 0 },
        { x: 4, y: 3 },
        { x: 2, y: 1 },
        { x: 0, y: 3 },
      ];
      if (reverse) ring.reverse();
      storeyOf(base).lines![0]!.points = [...ring, { ...ring[0]! }];
      const session: EditSession = {
        base,
        target: { kind: "line", id: "l" },
        action: "insert",
        index,
        anchor: { x: 20, y: 30 },
      };
      const prepared = prepareDirectEditPreview(session)!;
      const a = ring[index]!,
        b = ring[(index + 1) % ring.length]!;
      for (const point of [
        { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
        { x: 2, y: -1 },
        { x: 2, y: 4 },
        a,
        { x: NaN, y: 0 },
        { x: Infinity, y: 0 },
      ]) {
        let full: ReturnType<typeof editAtPointer> | undefined;
        try {
          full = editAtPointer(session, base, point);
        } catch {
          /* compare rejection */
        }
        if (!full) {
          assert.throws(() => prepared.evaluate(base, session.target, point));
          continue;
        }
        const result = prepared.materialize!(base, session.target, point);
        assert.deepEqual(result, full);
        assert.deepEqual(previewEdit(session, base, session.target, point), full);
        assert.deepEqual(storeyOf(prepared.evaluate(base, session.target, point).geometry).lines, [
          storeyOf(full).lines![0],
        ]);
        assert.deepEqual(
          derivePlanScene(result, () => true, base.hatchPatterns),
          derivePlanScene(full, () => true, base.hatchPatterns),
        );
        assert.deepEqual(storeyOf(result).hatches[0]!.pattern, storeyOf(base).hatches[0]!.pattern);
      }
      assert.throws(() => prepared.evaluate({ ...base }, session.target, { x: 2, y: 0 }));
      assert.throws(() => prepared.evaluate(base, null, { x: 2, y: 0 }));
    }
});

test("insertion preserves the schema point limit at its exact boundary", () => {
  for (const vertices of [MAX_LINE_POINTS - 2, MAX_LINE_POINTS - 1]) {
    const base = lineEdgeFixture(1, vertices),
      ring = storeyOf(base).lines![0]!.points;
    const point = { x: (ring[0]!.x + ring[1]!.x) / 2, y: (ring[0]!.y + ring[1]!.y) / 2 };
    const session: EditSession = {
      base,
      target: { kind: "line", id: "l" },
      action: "insert",
      index: 0,
      anchor: point,
    };
    if (vertices === MAX_LINE_POINTS - 1) {
      assert.throws(() => editAtPointer(session, base, point));
      assert.throws(() => prepareDirectEditPreview(session));
    } else {
      const result = prepareDirectEditPreview(session)!.materialize!(base, session.target, point);
      assert.equal(storeyOf(result).lines![0]!.points.length, MAX_LINE_POINTS);
      assert.deepEqual(result, editAtPointer(session, base, point));
    }
  }
});

test("insertion cancel, full commit guard and single undo remain intact", () => {
  let state = createEditingState(lineEdgeFixture(2, 4));
  const base = state.history.present,
    target = { kind: "line" as const, id: "l" },
    anchor = { x: 5, y: 5 };
  state = editingReducer(state, { type: "begin", target, action: "insert", index: 0, anchor });
  assert.ok(state.session);
  const session = state.session,
    point = { x: 6, y: 6 };
  const preview = previewEdit(session, base, target, point);
  assert.equal(editingReducer(state, { type: "cancel" }).history.present, base);
  const placed = editingReducer(state, { type: "confirm", session, selection: target, point });
  assert.equal(placed.error, "");
  assert.equal(placed.history.past.length, 1);
  assert.deepEqual(placed.history.present, preview);
  assert.deepEqual(editingReducer(placed, { type: "undo" }).history.present, base);
  assert.throws(() => (storeyOf(base).hatches[1]!.points[0]!.x = NaN), TypeError);
  const tampered = tamperedState(state, (p) => (storeyOf(p).hatches[1]!.points[0]!.x = NaN));
  const failed = editingReducer(tampered.state, {
    type: "confirm",
    session: tampered.session,
    selection: target,
    point,
  });
  assert.ok(failed.error);
  assert.equal(failed.history.past.length, 0);
});

test("insertion rejects open paths and the duplicate closing grip", () => {
  const base = lineEdgeFixture(1, 4),
    target = { kind: "line" as const, id: "l" };
  const session: EditSession = { base, target, action: "insert", index: 4, anchor: { x: 0, y: 0 } };
  assert.throws(() => prepareDirectEditPreview(session));
  storeyOf(base).lines![0]!.points.pop();
  assert.throws(() => prepareDirectEditPreview({ ...session, index: 0 }));
});
