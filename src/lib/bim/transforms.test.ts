import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addLine, addWall, serializeProject, deserializeProject, updateWall } from "./model.ts";
import { defaultLineAppearance } from "./lines.ts";
import { createHistory, commitProject, undoProject, redoProject } from "./history.ts";
import { buildSolid } from "./geometry.ts";
import {
  editablePoints,
  moveElement,
  moveElementPoint,
  stretchEndpoint,
  moveWindowAlongWall,
  parseMetres,
} from "./transforms.ts";
const target = { kind: "wall" as const, id: "wall-1" };
const lineTarget = { kind: "line" as const, id: "poly-1" };
const poly = () =>
  addLine(createExampleProject(), {
    id: "poly-1",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 6, y: 4 },
    ],
    ...defaultLineAppearance,
  });

test("moving a wall preserves its stable identity and hosted window while translating the solid", () => {
  const p = createExampleProject();
  const before = serializeProject(p);
  const moved = moveElement(p, target, { x: 2, y: -3 });
  assert.deepEqual(moved.storey.walls[0], {
    ...p.storey.walls[0],
    start: { x: 2, y: -3 },
    end: { x: 5, y: -3 },
  });
  assert.deepEqual(moved.storey.windows, p.storey.windows);
  const old = buildSolid(p),
    solid = buildSolid(moved);
  assert.ok(Math.abs(old.volume - solid.volume) < 1e-10);
  assert.deepEqual(solid.min, [old.min[0] + 2, old.min[1] - 3, old.min[2]]);
  assert.equal(serializeProject(p), before);
});
test("translation targets ID, preserves polyline shape/style and leaves unrelated walls intact", () => {
  const p = addWall(poly(), {
    id: "wall-2",
    start: { x: 9, y: 9 },
    end: { x: 12, y: 9 },
    height: 2.8,
    thickness: 0.36,
  });
  const moved = moveElement(p, lineTarget, { x: -2, y: 1 });
  assert.deepEqual(moved.storey.lines![0], {
    ...p.storey.lines![0],
    points: [
      { x: -2, y: 1 },
      { x: 1, y: 5 },
      { x: 4, y: 5 },
    ],
  });
  assert.deepEqual(moved.storey.walls, p.storey.walls);
});
test("point edit changes only selected polyline vertex and keeps a closed ring closed", () => {
  const p = poly();
  const next = moveElementPoint(p, lineTarget, 1, { x: 2, y: 5 });
  assert.deepEqual(next.storey.lines![0]!.points, [
    { x: 0, y: 0 },
    { x: 2, y: 5 },
    { x: 6, y: 4 },
  ]);
  const closed = addLine(createExampleProject(), {
    id: "poly-1",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 3 },
      { x: 0, y: 0 },
    ],
    ...defaultLineAppearance,
  });
  for (const index of [0, 3]) {
    const ring = moveElementPoint(closed, lineTarget, index, { x: -1, y: 2 }).storey.lines![0]!
      .points;
    assert.deepEqual(ring[0], { x: -1, y: 2 });
    assert.deepEqual(ring[3], ring[0]);
  }
  assert.throws(() => stretchEndpoint(closed, lineTarget, "end", 4));
});
test("stretching either diagonal wall endpoint preserves direction and centred window", () => {
  const p = updateWall(createExampleProject(), "wall-1", {
    start: { x: 1, y: 2 },
    end: { x: 4, y: 6 },
  });
  const end = stretchEndpoint(p, target, "end", 10);
  assert.deepEqual(end.storey.walls[0]!.end, { x: 7, y: 10 });
  assert.deepEqual(end.storey.walls[0]!.start, { x: 1, y: 2 });
  const start = stretchEndpoint(p, target, "start", 10);
  assert.deepEqual(start.storey.walls[0]!.start, { x: -2, y: -2 });
  assert.deepEqual(start.storey.walls[0]!.end, { x: 4, y: 6 });
  assert.equal(start.storey.windows[0]!.position, 0.5);
});
test("polyline stretch changes only terminal segment, preserving intermediate vertices", () => {
  const p = poly();
  assert.deepEqual(stretchEndpoint(p, lineTarget, "end", 6).storey.lines![0]!.points, [
    { x: 0, y: 0 },
    { x: 3, y: 4 },
    { x: 9, y: 4 },
  ]);
  assert.deepEqual(stretchEndpoint(p, lineTarget, "start", 10).storey.lines![0]!.points, [
    { x: -3, y: -4 },
    { x: 3, y: 4 },
    { x: 6, y: 4 },
  ]);
});
test("degenerate geometry and too-short host walls are rejected atomically", () => {
  const p = poly(),
    before = serializeProject(p);
  assert.throws(() => moveElementPoint(p, lineTarget, 1, { x: 0, y: 0 }));
  assert.throws(() => moveElementPoint(p, target, 1, { x: 0, y: 0 }));
  assert.throws(() => stretchEndpoint(p, target, "end", 1));
  for (const value of [0, -1, NaN, Infinity])
    assert.throws(() => stretchEndpoint(p, lineTarget, "end", value));
  assert.equal(serializeProject(p), before);
});
test("invalid indices, missing IDs and nonfinite coordinates cannot edit another entity", () => {
  const p = poly();
  for (const index of [-1, 0.5, 3, NaN])
    assert.throws(() => moveElementPoint(p, lineTarget, index, { x: 1, y: 2 }));
  assert.throws(() => moveElement(p, { kind: "wall", id: "poly-1" }, { x: 1, y: 2 }));
  assert.throws(() => moveElement(p, target, { x: NaN, y: 0 }));
  assert.throws(() => moveElementPoint(p, target, 1, { x: Infinity, y: 0 }));
  const pts = editablePoints(p, target);
  pts[0]!.x = 99;
  assert.equal(p.storey.walls[0]!.start.x, 0);
});
test("window movement uses signed wall distance, keeps host and rejects crossing wall ends", () => {
  const p = createExampleProject();
  const moved = moveWindowAlongWall(p, "window-1", 0.3);
  assert.equal(moved.storey.windows[0]!.position, 0.6);
  assert.equal(moved.storey.windows[0]!.wallId, "wall-1");
  assert.equal(moveWindowAlongWall(p, "window-1", -0.3).storey.windows[0]!.position, 0.4);
  assert.throws(() => moveWindowAlongWall(p, "window-1", 1));
  assert.throws(() => moveWindowAlongWall(p, "missing", 0));
  assert.throws(() => moveWindowAlongWall(p, "window-1", NaN));
});
test("transform is one reversible change and survives JSON round trip", () => {
  const p = poly();
  const moved = moveElement(p, lineTarget, { x: 2, y: 3 });
  const h = commitProject(createHistory(p), moved);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undoProject(h).present, p);
  assert.deepEqual(redoProject(undoProject(h)).present, moved);
  assert.deepEqual(deserializeProject(serializeProject(moved)), moved);
  assert.equal(commitProject(h, moveElement(moved, lineTarget, { x: 0, y: 0 })), h);
});
test("metre input accepts signed decimal comma/point and rejects incomplete input", () => {
  for (const text of ["-1,25", "-1.25"]) assert.equal(parseMetres(text), -1.25);
  assert.equal(parseMetres("+0,5"), 0.5);
  assert.equal(parseMetres("0"), 0);
  for (const text of ["", "-", "1,", "Infinity", "1,2.3", "2m", "1e999"])
    assert.ok(Number.isNaN(parseMetres(text)));
});
