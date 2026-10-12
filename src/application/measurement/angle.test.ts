import test from "node:test";
import assert from "node:assert/strict";
import { includedAngle } from "../../geometry/primitives/angle.ts";
import { emptyAngle, pickAngle } from "./angle.ts";
const o = { x: 0, y: 0 };
test("included angle covers acute, right, obtuse, straight and coincident directions", () => {
  const a = { x: 1, y: 0 };
  for (const [b, expected] of [
    [{ x: 1, y: 1 }, 45],
    [{ x: 0, y: 1 }, 90],
    [{ x: -1, y: 1 }, 135],
    [{ x: -1, y: 0 }, 180],
    [{ x: 2, y: 0 }, 0],
  ] as const) {
    assert.ok(Math.abs(includedAngle(a, o, b) - expected) < 1e-10);
    assert.ok(Math.abs(includedAngle(b, o, a) - expected) < 1e-10);
  }
  assert.equal(includedAngle({ x: 1e200, y: 0 }, o, { x: 0, y: -1e200 }), 90);
});
test("three clicks retain value and copy points; fourth starts a fresh measurement", () => {
  let s = emptyAngle;
  const first = { x: 2, y: 0 };
  s = pickAngle(s, first);
  first.x = 100;
  s = pickAngle(s, o);
  s = pickAngle(s, { x: 0, y: 3 });
  assert.equal(s.degrees, 90);
  assert.equal(s.points[0]!.x, 2);
  s = pickAngle(s, { x: 5, y: 5 });
  assert.equal(s.degrees, null);
  assert.equal(s.points.length, 1);
});
test("zero arms, invalid numbers and overflow fail without losing the previous points", () => {
  let s = pickAngle(emptyAngle, o);
  assert.throws(() => pickAngle(s, o));
  assert.equal(s.points.length, 1);
  s = pickAngle(s, { x: 1, y: 0 });
  assert.throws(() => pickAngle(s, { x: 1, y: 0 }));
  assert.equal(s.points.length, 2);
  assert.throws(() => includedAngle({ x: NaN, y: 0 }, o, { x: 1, y: 1 }));
  assert.throws(() => includedAngle({ x: -1e308, y: 0 }, { x: 1e308, y: 0 }, o));
});
