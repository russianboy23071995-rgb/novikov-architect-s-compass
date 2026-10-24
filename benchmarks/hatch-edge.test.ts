import test from "node:test";
import assert from "node:assert/strict";
import { tamperedState } from "./tampered-state.ts";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import {
  previewEdit,
  createEditingState,
  editingReducer,
} from "../src/application/direct-edit/controller.ts";
import { boundedEdgeTarget } from "../src/application/direct-edit/contour.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { contourEdge, prepareContourEdge } from "../src/geometry/polygons/edit-edge.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";

const shapes = [
  [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ],
  [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 0.01, y: 0.1 },
  ],
  [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 2, y: 1 },
    { x: 0, y: 3 },
  ],
];
test("prepared hatch sides match full operation and original cap through collapse and return", () => {
  for (const shape of shapes)
    for (const reversed of [false, true]) {
      const ring = reversed ? [...shape].reverse() : shape;
      for (const index of [0, ring.length - 1]) {
        const base = hatchPointFixture(3, 4);
        storeyOf(base).hatches[0]!.points = ring;
        const { a, b, normal } = contourEdge(ring, index),
          anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const session: EditSession = {
          base,
          target: { kind: "hatch", id: "h0" },
          action: "edge",
          index,
          anchor,
        };
        const prepared = prepareDirectEditPreview(session)!;
        const originalCap = prepareContourEdge(ring, index, anchor);
        for (const distance of [0, 0.01, 0.5, 100, -100, -0.01, 0.01]) {
          const point = { x: anchor.x + normal.x * distance, y: anchor.y + normal.y * distance };
          const bounded = boundedEdgeTarget(session, point);
          assert.deepEqual(bounded, originalCap(point));
          const full = editAtPointer(session, base, point);
          for (const input of [point, bounded]) {
            assert.deepEqual(prepared.materialize!(base, session.target, input), full);
            assert.deepEqual(previewEdit(session, base, session.target, input), full);
            const patch = prepared.evaluate(base, session.target, input);
            assert.deepEqual(storeyOf(patch.geometry).hatches, [storeyOf(full).hatches[0]]);
            assert.deepEqual(patch.replacedIds, ["h0"]);
          }
          assert.deepEqual(
            derivePlanScene(
              previewEdit(session, base, session.target, point),
              () => true,
              base.hatchPatterns,
            ),
            derivePlanScene(full, () => true, base.hatchPatterns),
          );
        }
      }
    }
});
test("side preview handles a large ring and rejects stale/nonfinite context", () => {
  const base = hatchPointFixture(2, 500),
    ring = storeyOf(base).hatches[0]!.points;
  const { a, b, normal } = contourEdge(ring, 499),
    anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const session: EditSession = {
    base,
    target: { kind: "hatch", id: "h0" },
    action: "edge",
    index: 499,
    anchor,
  };
  const prepared = prepareDirectEditPreview(session)!;
  for (const d of [-1, 0, 1]) {
    const point = { x: anchor.x + normal.x * d, y: anchor.y + normal.y * d };
    assert.deepEqual(
      prepared.materialize!(base, session.target, point),
      editAtPointer(session, base, point),
    );
  }
  assert.throws(() => prepared.evaluate({ ...base }, session.target, anchor));
  assert.throws(() => prepared.evaluate(base, { kind: "hatch", id: "h1" }, anchor));
  assert.throws(() => prepared.evaluate(base, session.target, { x: NaN, y: 0 }));
  assert.throws(() => prepared.evaluate(base, session.target, { x: Infinity, y: 0 }));
  assert.throws(() => prepareDirectEditPreview({ ...session, index: -1 }));
  // A previously warmed inference cap must match the owned preparation baseline.
  const revised = hatchPointFixture(1, 4);
  storeyOf(revised).hatches[0]!.points = shapes[0]!.map((p) => ({ ...p }));
  const revisedSession: EditSession = {
    base: revised,
    target: { kind: "hatch", id: "h0" },
    action: "edge",
    index: 0,
    anchor: { x: 2, y: 0 },
  };
  boundedEdgeTarget(revisedSession, { x: 2, y: 10 });
  storeyOf(revised).hatches[0]!.points[2]!.y = 2;
  storeyOf(revised).hatches[0]!.points[3]!.y = 2;
  const updated = prepareDirectEditPreview(revisedSession)!;
  const preview = updated.materialize!(revised, revisedSession.target, { x: 2, y: 10 });
  assert.deepEqual(preview, editAtPointer(revisedSession, revised, { x: 2, y: 10 }));
  const cappedY = storeyOf(preview).hatches[0]!.points[0]!.y;
  assert.ok(cappedY > 1.9 && cappedY < 2);
});
test("capped side placement is one full commit; cancel and undo preserve the original", () => {
  const project = hatchPointFixture(2, 4);
  storeyOf(project).hatches[0]!.points = shapes[0]!;
  let state = createEditingState(project);
  const base = state.history.present,
    target = { kind: "hatch" as const, id: "h0" };
  state = editingReducer(state, {
    type: "begin",
    target,
    action: "edge",
    index: 0,
    anchor: { x: 2, y: 0 },
  });
  assert.ok(state.session);
  const session = state.session,
    point = { x: 2, y: 100 };
  const preview = previewEdit(session, base, target, point);
  assert.equal(state.history.past.length, 0);
  assert.equal(editingReducer(state, { type: "cancel" }).history.present, base);
  const placed = editingReducer(state, { type: "confirm", session, selection: target, point });
  assert.equal(placed.error, "");
  assert.equal(placed.history.past.length, 1);
  assert.deepEqual(placed.history.present, preview);
  assert.deepEqual(editingReducer(placed, { type: "undo" }).history.present, base);
  assert.throws(() => (storeyOf(base).hatches[1]!.points[0]!.x = NaN), TypeError);
  const tampered = tamperedState(state, (p) => (storeyOf(p).hatches[1]!.points[0]!.x = NaN));
  const invalid = editingReducer(tampered.state, {
    type: "confirm",
    session: tampered.session,
    selection: target,
    point,
  });
  assert.ok(invalid.error);
  assert.equal(invalid.history.past.length, 0);
});
