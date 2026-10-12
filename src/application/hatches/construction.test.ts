import test from "node:test";
import assert from "node:assert/strict";
import { rectangleContour, prepareHatchBoundaries } from "./construction.ts";
import { validateSimplePolygon } from "../../geometry/polygons/simple-polygon.ts";
import { createProject, addLine } from "../../lib/bim/model.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { createDrawing } from "../drawing/actions.ts";
test("diagonal and oblique side-height rectangles have exact geometry", () => {
  const d = rectangleContour("diagonal", [
    { x: 3, y: 2 },
    { x: 0, y: 0 },
  ]);
  const v = validateSimplePolygon(d);
  assert.ok(v.valid);
  assert.equal(Math.abs(v.signedArea), 6);
  const p = rectangleContour("side-height", [
    { x: 0, y: 0 },
    { x: 3, y: 4 },
    { x: -0.8, y: 0.6 },
  ]);
  const area = validateSimplePolygon(p);
  assert.ok(area.valid);
  assert.ok(Math.abs(Math.abs(area.signedArea) - 5) < 1e-9);
  assert.throws(() =>
    rectangleContour("side-height", [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ]),
  );
  assert.equal(
    validateSimplePolygon(
      rectangleContour("diagonal", [
        { x: 0, y: 0 },
        { x: 0, y: 3 },
      ]),
    ).valid,
    false,
  );
});
test("boundary picking uses explicit visible closed polygons, smallest nested contour first", () => {
  let p = createProject("test", "floor");
  const appearance = { color: "#000000", penWidth: 0.25, style: "solid" as const };
  p = addLine(p, {
    id: "outer",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 0, y: 4 },
      { x: 0, y: 0 },
    ],
    ...appearance,
  });
  p = addLine(p, {
    id: "inner",
    kind: "polyline",
    points: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
    ],
    ...appearance,
  });
  p = addLine(p, {
    id: "open",
    kind: "polyline",
    points: [
      { x: 6, y: 0 },
      { x: 7, y: 0 },
      { x: 7, y: 1 },
      { x: 6, y: 1 },
    ],
    ...appearance,
  });
  const policy = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    pick = prepareHatchBoundaries(p, policy);
  assert.equal(pick({ x: 1.5, y: 1.5 })[0]!.x, 1);
  assert.equal(pick({ x: 6.5, y: 0.5 }).length, 0);
  const next = createDrawing(p, p, "fill", {
    kind: "hatch",
    points: pick({ x: 1.5, y: 1.5 }),
    fill: { color: "#123456", opacity: 0.4 },
  });
  assert.equal(next.storey.hatches.length, 1);
  assert.equal(p.storey.hatches.length, 0);
  assert.throws(() =>
    createDrawing(p, next, "stale", {
      kind: "hatch",
      points: pick({ x: 1.5, y: 1.5 }),
      fill: { color: "#123456", opacity: 0.4 },
    }),
  );
  const hidden = createLayerVisibilityPolicy(p, {
    ...ALL_LAYERS_VISIBLE,
    hiddenLayerIds: [p.defaultLayerIds.line],
  });
  assert.equal(prepareHatchBoundaries(p, hidden)({ x: 1.5, y: 1.5 }).length, 0);
});
