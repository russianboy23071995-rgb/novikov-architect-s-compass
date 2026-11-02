import test from "node:test";
import assert from "node:assert/strict";
import { recallCamera, rememberCamera } from "./view-cameras.ts";

// docs/LAYOUTS.md, KA1: every view keeps its own zoom and position for the session.
test("each view keeps its own camera; an unknown view fits anew", () => {
  rememberCamera("plan#0", { center: { x: 1, y: 2 }, pixelsPerMetre: 50 });
  rememberCamera("layout:l1#0", { center: { x: 0.2, y: 0.15 }, pixelsPerMetre: 2500 });
  assert.deepEqual(recallCamera("plan#0"), { center: { x: 1, y: 2 }, pixelsPerMetre: 50 });
  assert.equal(recallCamera("layout:l1#0")!.pixelsPerMetre, 2500);
  assert.equal(recallCamera("layout:l2#0"), null);
  assert.equal(recallCamera(undefined), null);
  // A recalled camera is a copy: changing it leaves the kept one alone.
  recallCamera("plan#0")!.center.x = 9;
  assert.equal(recallCamera("plan#0")!.center.x, 1);
  // The oldest views leave first once many were opened.
  for (let i = 0; i < 250; i++)
    rememberCamera(`doc:${i}#0`, { center: { x: i, y: 0 }, pixelsPerMetre: 1 });
  assert.equal(recallCamera("plan#0"), null);
  assert.equal(recallCamera("doc:249#0")!.center.x, 249);
});
