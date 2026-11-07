import test from "node:test";
import assert from "node:assert/strict";
import { precisionTarget, startsTypedValue } from "./precision.ts";

const key = (k: string, mods: Partial<Record<"ctrlKey" | "altKey" | "metaKey", boolean>> = {}) =>
  startsTypedValue({ key: k, ctrlKey: false, altKey: false, metaKey: false, ...mods });

test("E1: digits, comma, point and minus start a length; shortcuts and letters do not", () => {
  for (const k of ["0", "5", "9", ",", ".", "-"]) assert.equal(key(k), true, k);
  for (const k of ["a", "Tab", "Enter", "Escape", " ", "+", "F5"]) assert.equal(key(k), false, k);
  assert.equal(key("5", { ctrlKey: true }), false);
  assert.equal(key("1", { altKey: true }), false);
  assert.equal(key("2", { metaKey: true }), false);
});

test("a typed length runs in the mouse direction while the angle stays empty", () => {
  const { point: p, degrees } = precisionTarget({ x: 1, y: 1 }, { x: 1, y: 9 }, "", "2,5");
  assert.equal(degrees, 90);
  assert.ok(Math.abs(p.x - 1) < 1e-9 && Math.abs(p.y - 3.5) < 1e-9, JSON.stringify(p));
});
