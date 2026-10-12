import test from "node:test";
import assert from "node:assert/strict";
import { createSolidPickingService } from "./solid-picking-service.ts";
import { connectedFixture } from "../../../benchmarks/connected-fixture.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { pickSolidElement, windowSelectionSurfaces } from "./window-selection.ts";
test("cooperative picker falls back, survives camera changes and cancels stale work", () => {
  const p = connectedFixture("chain", 25),
    solid = buildSolid(p),
    windows = windowSelectionSurfaces(p, () => true),
    frame = createProjectionFrame(solid);
  const queue: (() => void)[] = [];
  let time = 0;
  const scheduler = {
    now: () => (time += 1),
    schedule(fn: () => void) {
      let cancelled = false;
      queue.push(() => {
        if (!cancelled) fn();
      });
      return () => {
        cancelled = true;
      };
    },
  };
  const service = createSolidPickingService(solid, windows, scheduler);
  const projection = (yaw: number) =>
    createProjectionState(
      frame,
      { yaw, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
      { left: 0, top: 0, width: 400, height: 300 },
      { width: 400, height: 300 },
    )!;
  let view = projection(0.4);
  assert.equal(service.diagnostics.ready, false);
  assert.deepEqual(
    service.pick(solid, windows, view, 0, 0),
    pickSolidElement(solid, windows, view.project, 0, 0),
  );
  while (queue.length) queue.shift()!();
  assert.equal(service.diagnostics.ready, true);
  assert.ok(service.diagnostics.slices > 1);
  const slices = service.diagnostics.slices;
  for (const yaw of [0, 1, 2]) {
    view = projection(yaw);
    for (const x of [-0.5, 0, 0.5])
      assert.deepEqual(
        service.pick(solid, windows, view, x, 0),
        pickSolidElement(solid, windows, view.project, x, 0),
      );
  }
  assert.equal(service.diagnostics.slices, slices);
  const hidden = { ...solid, faces: [] };
  assert.equal(service.pick(hidden, [], view, 0, 0), null);
  service.dispose();
  assert.equal(service.diagnostics.ready, false);
  const abandoned = createSolidPickingService(solid, windows, scheduler);
  abandoned.dispose();
  while (queue.length) queue.shift()!();
  assert.equal(abandoned.diagnostics.slices, 0);
});
