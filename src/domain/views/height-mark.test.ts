import test from "node:test";
import assert from "node:assert/strict";
import { formatHeight, heightMarkGeometry } from "./height-mark.ts";

// docs/SCHNITT.md, BS1.
test("heights read with sign and two decimals, zero as ±0,00", () => {
  assert.equal(formatHeight(0), "±0,00");
  assert.equal(formatHeight(0.004), "±0,00");
  assert.equal(formatHeight(2.8), "+2,80");
  assert.equal(formatHeight(-0.16), "−0,16");
  assert.equal(formatHeight(5.605), "+5,61");
});

test("a mark stands on its tip on the line; its text runs away from the drawing", () => {
  const left = heightMarkGeometry(-0.5, 2.8, "left", 0.2);
  assert.deepEqual(left.triangle[0], { x: -0.5, z: 2.8 });
  assert.ok(left.triangle.slice(1).every((p) => p.z > 2.8));
  assert.ok(Math.abs(left.triangle[2]!.x - left.triangle[1]!.x - 0.2) < 1e-12);
  assert.equal(left.text.anchor, "end");
  assert.ok(left.text.x < -0.5 && left.line.from < -0.5 && left.line.to === -0.5);
  const right = heightMarkGeometry(10.5, 0, "right", 0.2);
  assert.equal(right.text.anchor, "start");
  assert.ok(right.text.x > 10.5 && right.line.from === 10.5 && right.line.to > 10.5);
});
