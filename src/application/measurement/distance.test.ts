import test from "node:test";
import assert from "node:assert/strict";
import { distanceInteraction, emptyMeasurement, distanceMetres } from "./distance.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import { screenToPlan } from "../../rendering/viewport/plan-camera.ts";
test("measurement uses shared confirmation, keeps exact points and restarts without model mutations", () => {
  let state = emptyMeasurement;
  let cancelled = false;
  const tool = () =>
    distanceInteraction(
      state,
      (next) => {
        state = next;
      },
      () => {
        cancelled = true;
        state = emptyMeasurement;
      },
    );
  const first = { x: 0, y: 0 };
  confirmInteraction(tool(), first);
  first.x = 200;
  assert.deepEqual(state.start, { x: 0, y: 0 });
  assert.deepEqual(tool().snapping.origin?.point, state.start);
  confirmInteraction(tool(), { x: 3, y: 4 });
  assert.equal(distanceMetres(state.start!, state.end!), 5);
  confirmInteraction(tool(), { x: 8, y: 9 });
  assert.deepEqual(state, { start: { x: 8, y: 9 }, end: null });
  tool().cancel();
  assert.equal(cancelled, true);
  assert.equal(state, emptyMeasurement);
});
test("measurement rejects non-finite coordinates and overflow; zero is a valid distance", () => {
  const zero = { x: 0, y: 0 };
  assert.equal(distanceMetres(zero, zero), 0);
  for (const x of [NaN, Infinity, -Infinity])
    assert.throws(() => distanceMetres(zero, { x, y: 0 }));
  assert.throws(() => distanceMetres({ x: -1e308, y: 0 }, { x: 1e308, y: 0 }));
});
test("same metre distance at different viewport zooms", () => {
  for (const pixelsPerMetre of [10, 100, 1000]) {
    const camera = { center: { x: 0, y: 0 }, pixelsPerMetre };
    const a = screenToPlan(camera, { width: 800, height: 600 }, { x: 400, y: 300 });
    const b = screenToPlan(
      camera,
      { width: 800, height: 600 },
      { x: 400 + 3 * pixelsPerMetre, y: 300 - 4 * pixelsPerMetre },
    );
    assert.equal(distanceMetres(a, b), 5);
  }
});
