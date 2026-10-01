import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addLine, updateWall, serializeProject } from "./model.ts";
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
  assert.deepEqual(p.storey.walls[0]!.end, { x: 5, y: 1 });
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
