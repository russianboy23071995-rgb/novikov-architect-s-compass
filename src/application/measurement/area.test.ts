import test from "node:test";
import assert from "node:assert/strict";
import { emptyArea, pickArea, finishArea } from "./area.ts";
import { pointMeasurementInteraction } from "./distance.ts";
import { confirmInteraction } from "../tools/interaction.ts";
const rectangle = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 2 },
  { x: 0, y: 2 },
];
test("area measures rectangle in both windings and translated coordinates", () => {
  for (const points of [
    rectangle,
    [...rectangle].reverse(),
    rectangle.map((p) => ({ x: p.x + 1e6, y: p.y - 1e6 })),
  ]) {
    const state = points.reduce(pickArea, emptyArea);
    assert.equal(finishArea(state).squareMetres, 6);
    assert.equal(state.squareMetres, null);
  }
});
test("concave area and explicit closing point use shared polygon rules", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 3 },
    { x: 0, y: 3 },
    { x: 0, y: 0 },
  ];
  assert.equal(finishArea(points.reduce(pickArea, emptyArea)).squareMetres, 5);
});
test("double click duplicate is ignored, completed area restarts and points are copied", () => {
  let state = emptyArea;
  for (const point of rectangle) {
    const adapter = pointMeasurementInteraction(
      state,
      state.points,
      (p) => {
        state = pickArea(state, p);
      },
      () => {
        state = emptyArea;
      },
    );
    confirmInteraction(adapter, point);
  }
  assert.equal(pickArea(state, rectangle[3]!), state);
  state = finishArea(state);
  const next = { x: 9, y: 9 };
  state = pickArea(state, next);
  next.x = 20;
  assert.deepEqual(state, { points: [{ x: 9, y: 9 }], squareMetres: null });
});
test("invalid and crossing contours fail without accepting an area", () => {
  for (const points of [
    [],
    rectangle.slice(0, 2),
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
    [rectangle[0]!, rectangle[2]!, rectangle[1]!, rectangle[3]!],
  ]) {
    const state = points.reduce(pickArea, emptyArea);
    assert.throws(() => finishArea(state));
    assert.equal(state.squareMetres, null);
  }
  assert.throws(() => pickArea(emptyArea, { x: NaN, y: 0 }));
});
