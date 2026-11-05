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
import { boundedOffsetTarget, offsetDirection } from "../src/application/direct-edit/offset.ts";
import { editAtPointer, type EditSession } from "../src/application/direct-edit/session.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
const rectangle = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 2 },
  { x: 0, y: 2 },
];

test("prepared offsets exactly match full contours, minimum cap, patterns and plans", () => {
  for (const size of [1, 1e-5])
    for (const offset of [0, 1e6])
      for (const reverse of [false, true]) {
        const base = hatchPointFixture(3, 4);
        let ring = rectangle.map((p) => ({ x: p.x * size + offset, y: p.y * size - offset }));
        if (reverse) ring = ring.reverse();
        storeyOf(base).hatches[0]!.points = ring;
        storeyOf(base).hatches[0]!.pattern = {
          patternId: "pattern",
          mode: "paper",
          paperWidthMetres: 0.002,
          origin: { x: 7, y: 8 },
          rotation: 45,
        };
        const session: EditSession = {
          base,
          target: { kind: "hatch", id: "h0" },
          action: "offset",
          index: null,
          anchor: { ...ring[0]! },
        };
        const prepared = prepareDirectEditPreview(session)!;
        const normal = offsetDirection(session);
        for (const distance of [0, -100 * size, -0.2 * size, 0.5 * size, -100 * size, 0]) {
          const raw = {
            x: session.anchor.x + normal.x * distance,
            y: session.anchor.y + normal.y * distance,
          };
          for (const point of [raw, boundedOffsetTarget(session, raw)]) {
            let full: ReturnType<typeof editAtPointer> | undefined;
            try {
              full = editAtPointer(session, base, point);
            } catch {
              /* numerical rejection must agree */
            }
            if (!full) {
              assert.throws(() => prepared.evaluate(base, session.target, point));
              continue;
            }
            const result = prepared.materialize!(base, session.target, point);
            assert.deepEqual(result, full);
            assert.deepEqual(previewEdit(session, base, session.target, point), full);
            assert.deepEqual(
              storeyOf(prepared.evaluate(base, session.target, point).geometry).hatches,
              [storeyOf(full).hatches[0]],
            );
            assert.deepEqual(
              derivePlanScene(result, () => true, base.hatchPatterns),
              derivePlanScene(full, () => true, base.hatchPatterns),
            );
            assert.deepEqual(
              storeyOf(result).hatches[0]!.pattern,
              storeyOf(base).hatches[0]!.pattern,
            );
          }
        }
      }
});
test("offset preparation rejects unsupported shapes and preserves context/numerical guards", () => {
  const base = hatchPointFixture(2, 500),
    session: EditSession = {
      base,
      target: { kind: "hatch", id: "h0" },
      action: "offset",
      index: 499,
      anchor: { x: 0, y: 0 },
    };
  const prepared = prepareDirectEditPreview(session)!;
  for (const point of [
    { x: NaN, y: 0 },
    { x: Infinity, y: 0 },
    { x: 1e308, y: 1e308 },
  ]) {
    assert.throws(() => editAtPointer(session, base, point));
    assert.throws(() => prepared.evaluate(base, session.target, point));
  }
  assert.throws(() => prepared.evaluate({ ...base }, session.target, { x: 0, y: 0 }));
  assert.throws(() => prepared.evaluate(base, { kind: "hatch", id: "h1" }, { x: 0, y: 0 }));
  assert.throws(() => prepareDirectEditPreview({ ...session, index: 500 }));
  const concave = hatchPointFixture(1, 4);
  storeyOf(concave).hatches[0]!.points = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 2, y: 1 },
    { x: 0, y: 3 },
  ];
  const invalid = { ...session, base: concave, index: 0 };
  assert.throws(() => editAtPointer(invalid, concave, { x: 0, y: 0 }));
  assert.throws(() => prepareDirectEditPreview(invalid));
});
test("offset commit remains full and atomic on another storey with cancel/undo", () => {
  const project = hatchPointFixture(2, 4);
  project.storeys[1]!.hatches.push(project.storeys[0]!.hatches.shift()!);
  project.storeys.forEach((s) => {
    s.height = 3;
  });
  project.workingStoreyId = project.storeys[1]!.id;
  let state = createEditingState(project);
  const base = state.history.present,
    target = { kind: "hatch" as const, id: "h0" };
  state = editingReducer(state, {
    type: "begin",
    target,
    action: "offset",
    index: 0,
    anchor: { x: 5, y: 5 },
  });
  assert.ok(state.session);
  const session = state.session,
    point = { x: 6, y: 6 };
  const preview = previewEdit(session, base, target, point);
  assert.equal(state.history.past.length, 0);
  assert.equal(editingReducer(state, { type: "cancel" }).history.present, base);
  const placed = editingReducer(state, { type: "confirm", session, selection: target, point });
  assert.equal(placed.error, "");
  assert.equal(placed.history.past.length, 1);
  assert.deepEqual(placed.history.present, preview);
  assert.deepEqual(editingReducer(placed, { type: "undo" }).history.present, base);
  assert.throws(() => (base.storeys[0]!.hatches[0]!.points[0]!.x = NaN), TypeError);
  const tampered = tamperedState(state, (p) => (p.storeys[0]!.hatches[0]!.points[0]!.x = NaN));
  const failed = editingReducer(tampered.state, {
    type: "confirm",
    session: tampered.session,
    selection: target,
    point,
  });
  assert.ok(failed.error);
  assert.equal(failed.history.past.length, 0);
});
