import assert from "node:assert/strict";
import { test } from "node:test";
import { createExampleProject, drawingPoint, endAtLength, planBounds } from "./bim-view.ts";
import { addWall, createProject, updateWall, windowCentre } from "../../lib/bim/model.ts";

test("UI example uses the agreed wall/window dimensions and stable initial IDs", () => {
  const project = createExampleProject();
  assert.equal(project.storey.walls[0]!.thickness, 0.36);
  assert.deepEqual(project.storey.windows[0], {
    id: "window-1",
    wallId: "wall-1",
    width: 1.2,
    height: 1.35,
    sillHeight: 0.9,
    position: 0.5,
  });
  assert.deepEqual(createExampleProject(), project);
  assert.notEqual(createExampleProject().storey, project.storey);
});

test("length editor extends the wall while its window remains centred", () => {
  const project = createExampleProject();
  const wall = project.storey.walls[0]!;
  const changed = updateWall(project, wall.id, { end: endAtLength(wall, 6) });
  assert.deepEqual(windowCentre(changed, "window-1"), { x: 3, y: 0 });
  assert.deepEqual(windowCentre(project, "window-1"), { x: 1.5, y: 0 });
  assert.throws(() => updateWall(project, wall.id, { end: endAtLength(wall, 1) }));
});

test("length editor preserves translated, diagonal and reversed wall directions", () => {
  const wall = {
    ...createExampleProject().storey.walls[0]!,
    start: { x: 5, y: 6 },
    end: { x: 2, y: 2 },
  };
  assert.deepEqual(endAtLength(wall, 10), { x: -1, y: -2 });
  for (const length of [0, -1, NaN, Infinity]) assert.throws(() => endAtLength(wall, length));
});

test("drawing uses 0.10 m snapping and orthogonal alignment without mutating points", () => {
  const point = { x: 1.26, y: -0.24 };
  assert.deepEqual(drawingPoint(point, null, true, false), { x: 1.3, y: -0.2 });
  assert.deepEqual(drawingPoint(point, null, false, false), point);
  assert.deepEqual(drawingPoint(point, { x: 0, y: 0 }, true, true), { x: 1.3, y: 0 });
  assert.deepEqual(drawingPoint({ x: 0.12, y: 2.33 }, { x: 0, y: 0 }, true, true), {
    x: 0,
    y: 2.3,
  });
  assert.deepEqual(point, { x: 1.26, y: -0.24 });
});

test("drawing bounds contain wall thickness and flip model Y into SVG coordinates", () => {
  const project = addWall(createProject("p", "s"), {
    id: "w",
    start: { x: -2, y: 1 },
    end: { x: 2, y: 4 },
    thickness: 0.4,
    height: 2.8,
  });
  const [x, y, width, height] = planBounds(project).split(" ").map(Number) as [
    number,
    number,
    number,
    number,
  ];
  assert.ok(x < -2.2 && x + width > 2.2);
  assert.ok(y < -4.2 && y + height > -0.8);
  assert.equal(planBounds(createProject("p", "s")), "-2 -3 8 6");
});
