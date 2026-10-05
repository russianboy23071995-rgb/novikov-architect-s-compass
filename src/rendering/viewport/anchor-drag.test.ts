import test from "node:test";
import assert from "node:assert/strict";
import { anchorDragTarget } from "./anchor-drag.ts";
const drag = {
  pointerId: 7,
  origin: { x: 2, y: 0 },
  pointerStart: { x: 2, y: 0.12 },
  screenStart: { x: 300, y: 200 },
};
test("interior grip preserves the exact model anchor without an initial jump", () => {
  assert.deepEqual(anchorDragTarget(drag, 7, drag.pointerStart, drag.screenStart), {
    point: { x: 2, y: 0 },
    moved: false,
  });
  const result = anchorDragTarget(drag, 7, { x: 2, y: -0.88 }, { x: 300, y: 300 })!;
  assert.equal(result.moved, true);
  assert.equal(result.point.x, 2);
  assert.equal(result.point.y, -1);
  assert.equal(drag.pointerStart.y, 0.12);
});
test("drag threshold is in screen pixels and unrelated pointers cannot finish a gesture", () => {
  assert.equal(anchorDragTarget(drag, 8, { x: 99, y: 99 }, { x: 0, y: 0 }), null);
  assert.equal(anchorDragTarget(drag, 7, { x: 20, y: 30 }, { x: 302, y: 200 })!.moved, false);
  assert.equal(anchorDragTarget(drag, 7, { x: 2, y: 0.121 }, { x: 303, y: 200 })!.moved, true);
});
