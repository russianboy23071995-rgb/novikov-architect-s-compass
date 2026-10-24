import test from "node:test";
import assert from "node:assert/strict";
import { doorPlanPath, doorPlanSymbol } from "./door-symbol.ts";

const wall = { length: 4, thickness: 0.24 };
const base = { width: 1, position: 0.5 } as const;

test("hinge and swing side place the leaf on the chosen jamb and wall face", () => {
  const startLeft = doorPlanSymbol({ ...base, hinge: "start", opensTo: "left" }, wall);
  assert.deepEqual(startLeft.hinge, { x: 1.5, y: 0.12 });
  assert.deepEqual(startLeft.leafEnd, { x: 1.5, y: 1.12 });
  assert.deepEqual(startLeft.closed, { x: 2.5, y: 0.12 });
  const endRight = doorPlanSymbol({ ...base, hinge: "end", opensTo: "right" }, wall);
  assert.deepEqual(endRight.hinge, { x: 2.5, y: -0.12 });
  assert.deepEqual(endRight.leafEnd, { x: 2.5, y: -1.12 });
  assert.deepEqual(endRight.closed, { x: 1.5, y: -0.12 });
});

test("the swing arc is a quarter circle with the door width as radius in SVG space", () => {
  for (const hinge of ["start", "end"] as const)
    for (const opensTo of ["left", "right"] as const) {
      const symbol = doorPlanSymbol({ ...base, hinge, opensTo }, wall);
      const path = doorPlanPath(symbol);
      assert.match(path, /^M[-\d.]+,[-\d.]+ L[-\d.]+,[-\d.]+ A1,1 0 0 [01] [-\d.]+,[-\d.]+$/);
      // SVG y is the negated local y.
      assert.ok(path.startsWith(`M${symbol.hinge.x},${-symbol.hinge.y}`));
      const [ax, ay] = [symbol.leafEnd.x - symbol.hinge.x, symbol.leafEnd.y - symbol.hinge.y];
      const [bx, by] = [symbol.closed.x - symbol.hinge.x, symbol.closed.y - symbol.hinge.y];
      assert.equal(Math.hypot(ax, ay), 1);
      assert.equal(Math.hypot(bx, by), 1);
      assert.equal(Math.abs(ax * bx + ay * by), 0);
    }
});

test("mirrored doors use opposite arc sweeps", () => {
  const sweep = (hinge: "start" | "end", opensTo: "left" | "right") =>
    doorPlanPath(doorPlanSymbol({ ...base, hinge, opensTo }, wall))
      .split(" ")
      .at(-2);
  assert.notEqual(sweep("start", "left"), sweep("end", "left"));
  assert.notEqual(sweep("start", "left"), sweep("start", "right"));
  assert.equal(sweep("start", "left"), sweep("end", "right"));
});
