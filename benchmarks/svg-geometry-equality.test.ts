import test from "node:test";
import assert from "node:assert/strict";
import { sameSvgGeometry } from "./svg-geometry-equality.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { fullSelectionMove } from "./selection-move-oracle.ts";
import { wallBody } from "../src/domain/elements/wall/body.ts";
import { wallPlanOutlines } from "../src/rendering/viewport/wall-plan-outline.ts";

test("body-offset roundtrip can change SVG text without changing the contour", () => {
  const base = tPairFixture();
  const targets = base.storey.walls.map((w) => ({ kind: "wall" as const, id: w.id }));
  const delta = { x: 4 / 137, y: -4 / 137 };
  const actual = fullSelectionMove(base, targets, delta);
  const body = wallBody(actual.storey.walls[0]!);
  const recovered = { x: body.start.x, y: body.start.y - 0.18 };
  assert.notEqual(delta.y, recovered.y);
  const expected = fullSelectionMove(base, targets, recovered);
  const path = (p: typeof base) => {
    const b = wallBody(p.storey.walls[0]!);
    const local = (v: { x: number; y: number }) => `${v.x - b.start.x},${-(v.y - b.start.y)}`;
    return (wallPlanOutlines(p, new Set(targets.map((t) => t.id))).get("wall-1") ?? [])
      .map((e) => `M${local(e.start)} L${local(e.end)}`)
      .join(" ");
  };
  assert.notEqual(path(actual), path(expected));
  assert.equal(sameSvgGeometry(path(actual), path(expected)), true);
});
test("real displacement and large-coordinate errors remain failures", () => {
  assert.equal(sameSvgGeometry("M0,0 L1,0.000001", "M0,0 L1,0"), false);
  assert.equal(sameSvgGeometry("M1000000000.01,0", "M1000000000,0"), false);
});
test("topology, order and missing geometry remain failures", () => {
  for (const actual of [null, undefined, "", "M0,0 L1,0", "L0,0 M1,1", "M1,1 L0,0", "M0,0 L1,1 Z"])
    assert.equal(sameSvgGeometry(actual, "M0,0 L1,1"), false);
});
test("scientific notation is accepted but non-finite values are rejected", () => {
  assert.equal(sameSvgGeometry("M1e-16,-0 L1,1", "M0,0 L1,1"), true);
  for (const s of ["NaN", "Infinity", "1e999"]) assert.equal(sameSvgGeometry(s, s), false);
});
