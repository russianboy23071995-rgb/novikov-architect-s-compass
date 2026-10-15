import test from "node:test";
import assert from "node:assert/strict";
import { createProjectionState } from "./projection-state.ts";
import { axisTarget } from "./axis-target.ts";

test("spatial axis mouse distance survives camera/zoom/DPR and rejects a view-aligned axis", () => {
  const axis = { origin: { x: 4, y: -2 }, direction: [0, 0, 1] as const };
  for (const zoom of [0.3, 1, 4])
    for (const yaw of [-0.8, 0.2])
      for (const dpr of [1, 2]) {
        const projection = createProjectionState(
          { center: [2, 3, 1], radius: 20 },
          { yaw, pitch: 0.4, zoom, panX: 0.2, panY: -0.1 },
          { left: 90, top: 70, width: 800, height: 600 },
          { width: 800 * dpr, height: 600 * dpr },
        )!;
        for (const delta of [-2, 0, 0.7, 3]) {
          const ndc = projection.project([4, -2, 6 + delta]);
          const client = { x: 90 + (ndc[0] + 1) * 400, y: 70 + (1 - ndc[1]) * 300 };
          const actual = axisTarget(projection, axis, 6, client, null)!;
          assert.ok(Math.abs(actual.y - (-2 + delta)) < 1e-10);
          assert.equal(actual.x, 4);
        }
      }
  const top = createProjectionState(
    { center: [0, 0, 0], radius: 10 },
    { yaw: 0, pitch: Math.PI / 2, zoom: 1, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
  assert.equal(axisTarget(top, axis, 0, { x: 400, y: 300 }, null), null);
});
