import test from "node:test";
import assert from "node:assert/strict";
import { prepareConvexOffset } from "../../geometry/polygons/offset.ts";
import {
  createProject,
  addLine,
  addWall,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";
import { previewHatch } from "../hatches/actions.ts";
import { createEditingState, editingReducer, previewEdit } from "./controller.ts";
import { previewNumericMove } from "./numeric.ts";
import { editOriginReference } from "./snapping.ts";
const ring = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 4, y: 2 },
  { x: 0, y: 2 },
];

test("parallel offset keeps a constant perpendicular distance in either winding, not scale", () => {
  const expected = [
    { x: -0.5, y: -0.5 },
    { x: 4.5, y: -0.5 },
    { x: 4.5, y: 2.5 },
    { x: -0.5, y: 2.5 },
  ];
  assert.deepEqual(prepareConvexOffset(ring).at(0.5), expected);
  assert.deepEqual(prepareConvexOffset([...ring].reverse()).at(0.5), [...expected].reverse());
  assert.deepEqual(prepareConvexOffset(ring).at(-0.5), [
    { x: 0.5, y: 0.5 },
    { x: 3.5, y: 0.5 },
    { x: 3.5, y: 1.5 },
    { x: 0.5, y: 1.5 },
  ]);
  assert.deepEqual(prepareConvexOffset(ring).at(0), ring);
  const translated = ring.map((p) => ({ x: p.x + 1e6, y: p.y - 1e6 }));
  assert.deepEqual(
    prepareConvexOffset(translated).at(0.5),
    expected.map((p) => ({ x: p.x + 1e6, y: p.y - 1e6 })),
  );
});

test("collapse, inversion, concavity, crossings and non-finite offsets reject without poisoning preparation", () => {
  const prepared = prepareConvexOffset(ring);
  for (const d of [-1, -2, -100, NaN, Infinity]) assert.throws(() => prepared.at(d));
  assert.deepEqual(prepared.at(0), ring);
  for (const points of [
    ring.slice(0, 2),
    [ring[0]!, ring[2]!, ring[1]!, ring[3]!],
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 2, y: 1 },
      { x: 4, y: 2 },
      { x: 0, y: 2 },
    ],
  ])
    assert.throws(() => prepareConvexOffset(points));
  // An acute triangle must stop at its first disappearing edge.
  const triangle = prepareConvexOffset([
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 0, y: 2 },
  ]);
  assert.throws(() => triangle.at(-1));
  assert.equal(triangle.at(0.1).length, 3);
});

for (const kind of ["hatch", "line"] as const)
  test(`${kind}: shared offset preview, precision, origin, history and file roundtrip`, () => {
    let project = createProject("p", "s");
    project =
      kind === "hatch"
        ? previewHatch(project, project, {
            projectId: project.id,
            kind: "create",
            hatch: {
              id: "shape",
              points: ring,
              fill: { color: "#123456", opacity: 0.4 },
              contour: { visible: true, color: "#654321" },
            },
          })
        : addLine(project, {
            id: "shape",
            kind: "polyline",
            points: [...ring, ring[0]!],
            color: "#123456",
            penWidth: 0.25,
            style: "dashed",
          });
    const target = { kind, id: "shape" };
    const initial = createEditingState(project);
    const editing = editingReducer(initial, {
      type: "begin",
      target,
      action: "offset",
      index: 0,
      anchor: { x: 2, y: 0 },
    });
    const session = editing.session!;
    assert.ok(session);
    assert.deepEqual(editOriginReference(session).point, { x: 2, y: 0 });
    const result = previewNumericMove(session, editing.history.present, target, "0,5");
    assert.deepEqual(result.point, { x: 2, y: -0.5 });
    assert.equal(editing.history.past.length, 0);
    assert.throws(() => previewNumericMove(session, editing.history.present, target, "-1"));
    assert.throws(() => previewEdit(session, editing.history.present, null, result.point));
    assert.throws(() =>
      previewEdit(
        session,
        deserializeProject(serializeProject(editing.history.present)),
        target,
        result.point,
      ),
    );
    const confirmed = editingReducer(editing, {
      type: "confirm",
      session,
      selection: target,
      point: result.point,
    });
    assert.equal(confirmed.history.past.length, 1);
    const undone = editingReducer(confirmed, { type: "undo" });
    assert.deepEqual(undone.history.present, initial.history.present);
    assert.deepEqual(editingReducer(undone, { type: "redo" }).history.present, result.project);
    assert.deepEqual(deserializeProject(serializeProject(result.project)), result.project);
    assert.deepEqual(editingReducer(editing, { type: "cancel" }).history, initial.history);
    if (kind === "hatch")
      assert.deepEqual(result.project.storey.hatches[0]!.contour, {
        visible: true,
        color: "#654321",
      });
    else {
      assert.equal(result.project.storey.lines![0]!.style, "dashed");
      assert.deepEqual(
        result.project.storey.lines![0]!.points.at(-1),
        result.project.storey.lines![0]!.points[0],
      );
    }
  });

test("application rejects BIM and open lines, even with forged offset intent", () => {
  let project = addWall(createProject("p", "s"), {
    id: "wall",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  project = addLine(project, {
    id: "line",
    kind: "line",
    points: ring.slice(0, 2),
    color: "#123456",
    penWidth: 0.25,
    style: "solid",
  });
  for (const target of [
    { kind: "wall", id: "wall" },
    { kind: "line", id: "line" },
  ] as const) {
    const state = editingReducer(createEditingState(project), {
      type: "begin",
      target,
      action: "offset",
      index: 0,
    });
    assert.equal(state.session, null);
    assert.ok(state.error);
    assert.equal(state.history.past.length, 0);
  }
});
