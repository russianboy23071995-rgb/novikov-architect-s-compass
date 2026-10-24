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
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject, type DrawingLine } from "../src/lib/bim/model.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
function fixture(points: DrawingLine["points"], custom = false) {
  const base = hatchPointFixture(2, 4);
  storeyOf(base).lines = [
    {
      id: "l",
      kind: points.length === 2 ? "line" : "polyline",
      layerId: base.defaultLayerIds.line,
      points,
      color: "#334155",
      penWidth: 0.2,
      style: custom ? "custom" : "solid",
      ...(custom
        ? {
            repeatLength: 1.5,
            pattern: {
              id: "p",
              name: "Fixed",
              dashes: [],
              color: "#334155",
              colorEditable: false,
              period: 1,
              segments: [{ start: { x: 0, y: 0 }, end: { x: 1, y: 0 } }],
            },
          }
        : {}),
    },
  ];
  return validateProject(base);
}

test("prepared drawing stretch matches full path at every concave/closing grip and rejects invalid context", () => {
  for (const kind of ["line", "hatch"] as const)
    for (const offset of [0, 1e9]) {
      const points = [
        { x: 0, y: 0 },
        { x: 3, y: 1 },
        { x: 3, y: 4 },
        { x: 1.5, y: 2 },
        { x: 0, y: 4 },
      ].map((p) => ({ x: p.x + offset, y: p.y - offset }));
      const input = fixture([...points, { ...points[0]! }], true);
      storeyOf(input).hatches[0]!.points = points;
      const base = validateProject(input);
      const target = { kind, id: kind === "line" ? "l" : "h0" };
      const contour = kind === "line" ? storeyOf(base).lines![0]!.points : points;
      for (let index = 0; index < contour.length; index++) {
        const anchor = { x: contour[index]!.x + 0.125, y: contour[index]!.y - 0.25 };
        const session: EditSession = { base, target, action: "stretch", index, anchor };
        const prepared = prepareDirectEditPreview(session)!;
        assert.ok(prepared);
        for (const delta of [-0.03, 0, 0.03]) {
          const point = { x: anchor.x + delta, y: anchor.y + delta * 0.7 };
          const full = editAtPointer(session, base, point);
          assert.deepEqual(prepared.materialize!(base, target, point), full);
          assert.deepEqual(previewEdit(session, base, target, point), full);
          const collection = kind === "line" ? "lines" : "hatches";
          const actual = storeyOf(prepared.evaluate(base, target, point).geometry)[collection]!;
          assert.deepEqual(actual, [storeyOf(full)[collection]!.find((v) => v.id === target.id)]);
        }
        const neighbour = contour[index === 0 ? 1 : index - 1]!;
        const crossing = {
          x: anchor.x - 2 * (contour[index]!.x - neighbour.x),
          y: anchor.y - 2 * (contour[index]!.y - neighbour.y),
        };
        assert.throws(() => editAtPointer(session, base, crossing));
        assert.throws(() => prepared.evaluate(base, target, crossing));
        assert.throws(() => prepared.materialize!(base, target, crossing));
        assert.throws(() => prepared.evaluate({ ...base }, target, anchor));
        assert.throws(() => prepared.evaluate(base, { ...target, id: "missing" }, anchor));
        assert.throws(() => prepared.evaluate(base, target, { x: NaN, y: 0 }));
      }
    }
});
test("prepared line points match full action and scene including both closing grips and custom styles", () => {
  for (const custom of [false, true])
    for (const offset of [0, 1e9])
      for (const shape of [
        [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
        ],
        [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 2, y: 2 },
        ],
        [
          { x: 0, y: 0 },
          { x: 3, y: 0 },
          { x: 3, y: 3 },
          { x: 0, y: 0 },
        ],
      ])
        for (let index = 0; index < shape.length; index++) {
          const base = fixture(
              shape.map((p) => ({ x: p.x + offset, y: p.y - offset })),
              custom,
            ),
            line = storeyOf(base).lines![0]!;
          const anchor = { x: line.points[index]!.x + 0.125, y: line.points[index]!.y };
          const session: EditSession = {
            base,
            target: { kind: "line", id: "l" },
            action: "point",
            index,
            anchor,
          };
          const prepared = prepareDirectEditPreview(session)!;
          for (const delta of [
            { x: 0, y: 0 },
            { x: 0.3, y: 1 },
            { x: -4, y: 2 },
          ]) {
            const point = { x: anchor.x + delta.x, y: anchor.y + delta.y };
            const full = editAtPointer(session, base, point),
              result = prepared.materialize!(base, session.target, point);
            assert.deepEqual(result, full);
            assert.deepEqual(previewEdit(session, base, session.target, point), full);
            assert.deepEqual(
              derivePlanScene(result, () => true),
              derivePlanScene(full, () => true),
            );
            assert.deepEqual(
              storeyOf(prepared.evaluate(base, session.target, point).geometry).lines,
              storeyOf(full).lines,
            );
            assert.deepEqual(storeyOf(result).lines![0]!.pattern, line.pattern);
          }
        }
});
test("line preview rejects collapsed/nonfinite targets and stale context, owns input and output", () => {
  const base = fixture([
    { x: 0, y: 0 },
    { x: 3, y: 0 },
  ]);
  const session: EditSession = {
    base,
    target: { kind: "line", id: "l" },
    action: "point",
    index: 0,
    anchor: { x: 0, y: 0 },
  };
  const prepared = prepareDirectEditPreview(session)!;
  for (const point of [
    { x: 3, y: 0 },
    { x: NaN, y: 0 },
    { x: Infinity, y: 0 },
    { x: Number.MAX_VALUE, y: Number.MAX_VALUE },
  ]) {
    assert.throws(() => editAtPointer(session, base, point));
    assert.throws(() => prepared.evaluate(base, session.target, point));
  }
  assert.throws(() => prepared.evaluate({ ...base }, session.target, { x: 1, y: 1 }));
  assert.throws(() => prepared.evaluate(base, null, { x: 1, y: 1 }));
  for (const index of [null, -1, 2, 0.5])
    assert.throws(() => prepareDirectEditPreview({ ...session, index }));
  const expected = prepared.materialize!(base, session.target, { x: 1, y: 1 });
  assert.throws(() => {
    storeyOf(expected).lines![0]!.points[0]!.x = 999;
  });
  storeyOf(base).lines![0]!.points[0]!.x = 100;
  assert.deepEqual(prepared.materialize!(base, session.target, { x: 1, y: 1 }), expected);
});
test("line commit validates unmodified elements, cancel and one undo on active upper storey", () => {
  const project = fixture(
    [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 0 },
    ],
    true,
  );
  project.storeys[1]!.lines = project.storeys[0]!.lines;
  project.storeys[0]!.lines = [];
  project.storeys.forEach((s) => {
    s.height = 3;
  });
  project.workingStoreyId = project.storeys[1]!.id;
  let state = createEditingState(project);
  const base = state.history.present,
    target = { kind: "line" as const, id: "l" };
  state = editingReducer(state, {
    type: "begin",
    target,
    action: "point",
    index: 3,
    anchor: { x: 0, y: 0 },
  });
  assert.ok(state.session);
  const session = state.session,
    point = { x: 1, y: 0 };
  const preview = previewEdit(session, base, target, point);
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
