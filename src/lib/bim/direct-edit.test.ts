import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addLine, updateWall, serializeProject, deserializeProject } from "./model.ts";
import { buildSolid } from "./geometry.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";
import { previewMovementInput } from "../../application/direct-edit/numeric.ts";
import { defaultLineAppearance } from "./lines.ts";
import { editAtPointer, editAnchor } from "./direct-edit.ts";
import type { EditSession } from "./direct-edit.ts";
import { createHistory, commitProject, undoProject } from "./history.ts";
const base = createExampleProject();
const session: EditSession = {
  base,
  target: { kind: "wall", id: "wall-1" },
  index: 1,
  anchor: { x: 3, y: 0.18 },
  action: "point",
};

test("corner gesture changes one endpoint, retaining wall thickness, opposite end and window", () => {
  const p = editAtPointer(session, base, { x: 5, y: 1.18 });
  assert.deepEqual(p.storey.walls[0]!.start, { x: 0, y: 0 });
  const wall = p.storey.walls[0]!;
  const length = Math.hypot(wall.end.x, wall.end.y);
  assert.ok(Math.abs(wall.end.x - (wall.end.y / length) * 0.18 - 5) < 1e-10);
  assert.ok(Math.abs(wall.end.y + (wall.end.x / length) * 0.18 - 1.18) < 1e-10);
  assert.equal(p.storey.walls[0]!.thickness, 0.36);
  assert.deepEqual(p.storey.windows, base.storey.windows);
});
test("axis point gesture projects onto original wall direction and rejects crossing", () => {
  const p = editAtPointer({ ...session, action: "stretch" }, base, { x: 6, y: 9 });
  assert.deepEqual(p.storey.walls[0]!.end, { x: 6, y: 0 });
  assert.throws(() => editAtPointer({ ...session, action: "stretch" }, base, { x: -1, y: 0 }));
  assert.throws(() => editAtPointer({ ...session, action: "stretch" }, base, { x: 0.5, y: 0 }));
});
test("element translation moves both ends; fixed X/Y actions ignore the other component", () => {
  const s = { ...session, action: "move" as const };
  const p = editAtPointer(s, base, { x: 5, y: 1.18 });
  assert.deepEqual(p.storey.walls[0]!.start, { x: 2, y: 1 });
  assert.deepEqual(p.storey.walls[0]!.end, { x: 5, y: 1 });
  assert.deepEqual(
    editAtPointer({ ...s, action: "x" }, base, { x: 5, y: 1.18 }).storey.walls[0]!.start,
    { x: 2, y: 0 },
  );
  assert.deepEqual(
    editAtPointer({ ...s, action: "y" }, base, { x: 5, y: 1.18 }).storey.walls[0]!.start,
    { x: 0, y: 1 },
  );
});
test("diagonal element axis projection is exact", () => {
  const p = updateWall(base, "wall-1", { end: { x: 3, y: 4 } });
  const s = { ...session, base: p, anchor: { x: 0, y: 0 }, action: "axis" as const };
  const moved = editAtPointer(s, p, { x: 5, y: 0 });
  assert.ok(Math.abs(moved.storey.walls[0]!.start.x - 1.8) < 1e-12);
  assert.ok(Math.abs(moved.storey.walls[0]!.start.y - 2.4) < 1e-12);
});
test("successive previews use the original and create no history until confirmation", () => {
  const before = serializeProject(base);
  const h = createHistory(base);
  const first = editAtPointer({ ...session, action: "move" }, base, { x: 4, y: 0.18 });
  const second = editAtPointer({ ...session, action: "move" }, base, { x: 5, y: 0.18 });
  assert.equal(first.storey.walls[0]!.start.x, 1);
  assert.equal(second.storey.walls[0]!.start.x, 2);
  assert.equal(serializeProject(base), before);
  assert.equal(h.past.length, 0);
  const committed = commitProject(h, second);
  assert.equal(committed.past.length, 1);
  assert.deepEqual(undoProject(committed).present, base);
});
test("stale model, missing point, and nonfinite pointer reject safely", () => {
  assert.throws(() =>
    editAtPointer(session, updateWall(base, "wall-1", { height: 3 }), { x: 5, y: 1 }),
  );
  assert.throws(() => editAtPointer({ ...session, index: null }, base, { x: 5, y: 1 }));
  assert.throws(() => editAtPointer(session, base, { x: NaN, y: 1 }));
});
test("closed line handle stays closed and style/identity survive the gesture", () => {
  const p = addLine(base, {
    id: "poly",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 0 },
    ],
    ...defaultLineAppearance,
  });
  const s: EditSession = {
    base: p,
    target: { kind: "line", id: "poly" },
    action: "point",
    index: 0,
    anchor: { x: 0, y: 0 },
  };
  const moved = editAtPointer(s, p, { x: -1, y: 0 });
  assert.deepEqual(moved.storey.lines![0]!.points[0], { x: -1, y: 0 });
  assert.deepEqual(moved.storey.lines![0]!.points[3], { x: -1, y: 0 });
  assert.equal(moved.storey.lines![0]!.id, "poly");
  assert.equal(moved.storey.lines![0]!.color, defaultLineAppearance.color);
});
test("window gesture projects onto host and rejects an outside opening", () => {
  const target = { kind: "window" as const, id: "window-1" };
  const s: EditSession = {
    base,
    target,
    action: "axis",
    index: null,
    anchor: editAnchor(base, target),
  };
  assert.equal(editAtPointer(s, base, { x: 1.8, y: 5 }).storey.windows[0]!.position, 0.6);
  assert.throws(() => editAtPointer(s, base, { x: 3, y: 0 }));
});

test("all four corners reach their target on rotated and reversed walls", () => {
  for (const angle of [0, 0.7, Math.PI, -1.9]) {
    for (const index of [0, 1])
      for (const side of [-1, 1]) {
        const p = updateWall(base, "wall-1", {
          start: { x: 12, y: -7 },
          end: { x: 12 + 3 * Math.cos(angle), y: -7 + 3 * Math.sin(angle) },
        });
        const wall = p.storey.walls[0]!;
        const moving = index === 0 ? wall.start : wall.end;
        const fixed = index === 0 ? wall.end : wall.start;
        const direction = angle + (index === 0 ? Math.PI : 0);
        const offset = side * 0.18;
        const anchor = {
          x: moving.x - Math.sin(direction) * offset,
          y: moving.y + Math.cos(direction) * offset,
        };
        const rotated = direction + 1.2;
        const expected = { x: fixed.x + 4 * Math.cos(rotated), y: fixed.y + 4 * Math.sin(rotated) };
        const target = {
          x: expected.x - Math.sin(rotated) * offset,
          y: expected.y + Math.cos(rotated) * offset,
        };
        const s = { ...session, base: p, index, anchor };
        assert.deepEqual(editAtPointer(s, p, anchor), p);
        const result = editAtPointer(s, p, target);
        const changed = result.storey.walls[0]!;
        const endpoint = index === 0 ? changed.start : changed.end;
        assert.ok(Math.hypot(endpoint.x - expected.x, endpoint.y - expected.y) < 1e-10);
        assert.deepEqual(index === 0 ? changed.end : changed.start, fixed);
        assert.deepEqual(result.storey.windows, p.storey.windows);
        // Actual 3D faces use the same physical corner, not a separate corrected overlay.
        assert.ok(
          buildSolid(result).faces.some((face) =>
            face.vertices.some((v) => Math.hypot(v[0] - target.x, v[1] - target.y) < 1e-10),
          ),
        );
        assert.deepEqual(deserializeProject(serializeProject(result)), result);
      }
  }
});

test("unreachable corner and opening conflicts reject without committing; axis points remain direct", () => {
  const state = editingReducer(createEditingState(base), {
    type: "begin",
    target: session.target,
    action: "point",
    index: 1,
    anchor: session.anchor,
  });
  for (const point of [
    { x: 0, y: 0 },
    { x: 0, y: 0.18 },
    { x: 0.5, y: 0 },
    { x: Infinity, y: 0 },
  ]) {
    const result = editingReducer(state, {
      type: "confirm",
      session: state.session!,
      selection: session.target,
      point,
    });
    assert.ok(result.error);
    assert.equal(result.history, state.history);
    assert.equal(result.session, state.session);
  }
  const axis = editAtPointer({ ...session, anchor: { x: 3, y: 0 } }, base, { x: 4, y: 1 });
  assert.deepEqual(axis.storey.walls[0]!.end, { x: 4, y: 1 });
});

test("numeric and pointer corner edits share preview, one commit and undo/redo", () => {
  const state = editingReducer(createEditingState(base), {
    type: "begin",
    target: session.target,
    action: "point",
    index: 1,
    anchor: session.anchor,
  });
  const active = state.session!;
  const numeric = previewMovementInput(
    active,
    state.history.present,
    session.target,
    "90",
    "1",
    null,
  );
  const mouse = previewEdit(active, state.history.present, session.target, numeric.point);
  assert.deepEqual(numeric.project, mouse);
  assert.equal(state.history.past.length, 0);
  const committed = editingReducer(state, {
    type: "confirm",
    session: active,
    selection: session.target,
    point: numeric.point,
  });
  assert.equal(committed.error, "");
  assert.deepEqual(committed.history.present, mouse);
  assert.equal(committed.history.past.length, 1);
  const undone = editingReducer(committed, { type: "undo" });
  assert.deepEqual(undone.history.present, base);
  assert.deepEqual(editingReducer(undone, { type: "redo" }).history.present, mouse);
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
});
