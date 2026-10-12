import { capturePlanFraming } from "./plan-camera.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  fitPlan,
  planViewBox,
  screenToPlan,
  zoomPlan,
  panPlan,
  planScaleBar,
} from "./plan-camera.ts";
const size = { width: 800, height: 400 };
const camera = { center: { x: 3, y: 2 }, pixelsPerMetre: 100 };
test("fit contains padded model bounds in wide and portrait viewports", () => {
  for (const size of [
    { width: 800, height: 400 },
    { width: 300, height: 700 },
  ]) {
    const c = fitPlan("-2 -3 8 6", size);
    assert.deepEqual(c.center, { x: 2, y: 0 });
    const [x, y, w, h] = planViewBox(c, size).split(" ").map(Number);
    assert.ok(x! <= -2 && y! <= -3 && x! + w! >= 6 && y! + h! >= 3);
  }
});
test("screen coordinates invert model Y and respect CSS pixels", () => {
  assert.deepEqual(screenToPlan(camera, size, { x: 500, y: 100 }), { x: 4, y: 3 });
  assert.deepEqual(screenToPlan(camera, { width: 1000, height: 600 }, { x: 600, y: 200 }), {
    x: 4,
    y: 3,
  });
  assert.equal(planViewBox(camera, size), "-1 -4 8 4");
});
test("wheel zoom retains model point under cursor including scale limits", () => {
  const anchor = { x: 173, y: 291 };
  for (const factor of [1.2, 0.5, 1e9, 1e-9]) {
    const zoomed = zoomPlan(camera, size, factor, anchor);
    const a = screenToPlan(camera, size, anchor),
      b = screenToPlan(zoomed, size, anchor);
    assert.ok(Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9);
    assert.ok(zoomed.pixelsPerMetre >= 0.1 && zoomed.pixelsPerMetre <= 10000);
  }
  assert.deepEqual(camera, { center: { x: 3, y: 2 }, pixelsPerMetre: 100 });
});
test("pan preserves scale and moves geometry with pointer; model space remains exact", () => {
  const moved = panPlan(camera, { x: 100, y: -50 });
  assert.deepEqual(moved, { center: { x: 2, y: 1.5 }, pixelsPerMetre: 100 });
  assert.deepEqual(screenToPlan(moved, size, { x: 500, y: 150 }), camera.center);
  assert.deepEqual(zoomPlan(camera, size, 2).center, camera.center);
});
test("scale bar denotes the actual metre span at each zoom", () => {
  for (const scale of [0.1, 3, 25, 100, 234, 10000]) {
    const bar = planScaleBar(scale);
    assert.ok(bar.pixels <= 100.000001 && bar.pixels >= 20);
    assert.equal(bar.pixels, bar.metres * scale);
  }
});

test("saved framing captures pan and zoom as metric extents independent of output scale", () => {
  const camera = { center: { x: 7, y: -2 }, pixelsPerMetre: 200 };
  const size = { width: 1200, height: 800 };
  const frame = capturePlanFraming(camera, size);
  assert.deepEqual(frame, { center: { x: 7, y: -2 }, pixelsPerMetre: 200, width: 6, height: 4 });
  assert.equal(planViewBox(camera, size), "4 0 6 4");
  camera.center.x = 99;
  assert.equal(frame.center.x, 7);
  assert.throws(() => capturePlanFraming(camera, { width: 0, height: 800 }));
});
