import { largePointFixture } from "../../../benchmarks/large-point-fixture.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createExampleProject, drawingPoint, endAtLength, planBounds } from "./bim-view.ts";
import {
  addWall,
  createProject,
  updateWall,
  windowCentre,
  validateProject,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";

test("UI example uses the agreed wall/window dimensions and stable initial IDs", () => {
  const project = createExampleProject();
  assert.equal(project.storey.walls[0]!.thickness, 0.36);
  assert.deepEqual(project.storey.windows[0], {
    id: "window-1",
    layerId: project.defaultLayerIds.window,
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

test("fit bounds accepts a validated 200,000-point project below the file limit", () => {
  const project = largePointFixture();
  const file = serializeProject(project);
  assert.ok(new TextEncoder().encode(file).length < 10 * 1024 * 1024);
  assert.equal(planBounds(deserializeProject(file)), planBounds(project));
  assert.equal(planBounds(project), "-501.5 -192.5 1002.9 194");
});

test("fit bounds retain mixed walls, lines, hatch and rotated reference extents", () => {
  const project = createExampleProject();
  project.storey.lines = [
    {
      id: "line",
      layerId: project.defaultLayerIds.line,
      kind: "line",
      points: [
        { x: -8, y: -2 },
        { x: -5, y: 3 },
      ],
      color: "#334155",
      penWidth: 0.25,
      style: "solid",
    },
  ];
  project.storey.hatches = [
    {
      id: "hatch",
      kind: "hatch",
      layerId: project.defaultLayerIds.line,
      points: [
        { x: 5, y: 8 },
        { x: 6, y: 8 },
        { x: 5, y: 9 },
      ],
      fill: { color: "#112233", opacity: 1 },
      background: { visible: false, color: "#ffffff" },
      contour: { visible: false, color: "#112233" },
    },
  ];
  project.assets = [
    { id: "image", mimeType: "image/png", pixelWidth: 2, pixelHeight: 1, data: "AAAA" },
  ];
  project.storey.references = [
    {
      id: "reference",
      kind: "image-reference",
      layerId: project.defaultLayerIds.line,
      assetId: "image",
      origin: { x: 10, y: -5 },
      rotation: Math.PI / 2,
      metresPerPixel: 1,
    },
  ];
  const validated = validateProject(project);
  assert.equal(planBounds(validated), "-9.5 -10.5 22 17");
});
