import test from "node:test";
import assert from "node:assert/strict";
import { pickWall, isSelectionClick } from "./picking.ts";
import { buildSolid, initialCamera, projectPoint } from "./geometry.ts";
import { addWall, updateWall } from "./model.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
const front = { ...initialCamera, yaw: 0, pitch: 0 };

test("selects reference wall material and leaves its through opening empty", () => {
  const solid = buildSolid(createExampleProject());
  for (const [point, expected] of [
    [[0.3, -0.18, 1.5], "wall-1"],
    [[1.5, -0.18, 1.5], null],
  ] as const) {
    const [x, y] = projectPoint([...point], solid, front, 1);
    assert.equal(pickWall(solid, front, 1, x, y), expected);
  }
});
test("nearest visible wall wins regardless of model order", () => {
  let p = createExampleProject();
  p.storey.windows = [];
  p = addWall(p, { ...p.storey.walls[0]!, id: "back", start: { x: 0, y: 2 }, end: { x: 3, y: 2 } });
  for (const walls of [p.storey.walls, [...p.storey.walls].reverse()]) {
    const solid = buildSolid({ ...p, storey: { ...p.storey, walls } });
    const [x, y] = projectPoint([1.5, 0, 1.4], solid, front, 1);
    assert.equal(pickWall(solid, front, 1, x, y), "wall-1");
  }
});
test("wall behind an opening can be selected through it", () => {
  const p = addWall(createExampleProject(), {
    id: "back",
    start: { x: 0, y: 2 },
    end: { x: 3, y: 2 },
    height: 2.8,
    thickness: 0.36,
  });
  const solid = buildSolid(p);
  const [x, y] = projectPoint([1.5, 0, 1.5], solid, front, 1);
  assert.equal(pickWall(solid, front, 1, x, y), "back");
});
test("picking follows orbit, pan, zoom and viewport aspect ratios", () => {
  const p = createExampleProject();
  p.storey.windows = [];
  const solid = buildSolid(p);
  for (const aspect of [0.5, 1, 2]) {
    const camera = { ...initialCamera, zoom: 1.3, panX: 0.1, panY: -0.1 };
    const [x, y] = projectPoint([1.5, -0.18, 1.4], solid, camera, aspect);
    assert.equal(pickWall(solid, camera, aspect, x, y), "wall-1");
  }
});
test("diagonal translated wall keeps its stable identity", () => {
  const p = updateWall(createExampleProject(), "wall-1", {
    start: { x: 5, y: 8 },
    end: { x: 8, y: 12 },
  });
  p.storey.windows = [];
  const solid = buildSolid(p);
  const [x, y] = projectPoint([6.5, 10, 1.4], solid, initialCamera, 1);
  assert.equal(pickWall(solid, initialCamera, 1, x, y), "wall-1");
});
test("outside canvas, empty background and degenerate faces do not select", () => {
  const solid = buildSolid(createExampleProject());
  assert.equal(pickWall(solid, front, 1, 0.99, 0.99), null);
  assert.equal(pickWall(solid, front, 1, 2, 0), null);
  assert.equal(pickWall(solid, front, 0, 0, 0), null);
  assert.equal(pickWall(solid, front, 1, NaN, 0), null);
  assert.equal(pickWall({ ...solid, faces: [] }, front, 1, 0, 0), null);
  const face = solid.faces[0]!;
  assert.equal(
    pickWall(
      {
        ...solid,
        faces: [
          {
            ...face,
            vertices: [face.vertices[0], face.vertices[0], face.vertices[0], face.vertices[0]],
          },
        ],
      },
      front,
      1,
      0,
      0,
    ),
    null,
  );
});
test("small pointer jitter is a click, dragging is not", () => {
  assert.equal(isSelectionClick(10, 10, 12, 12), true);
  assert.equal(isSelectionClick(10, 10, 15, 10), false);
});
