import test from "node:test";
import assert from "node:assert/strict";
import { apply, multiply, parsePath, parsePoints, scaleOf } from "./svg-path.ts";
import type { PdfMatrix } from "./pdf-writer.ts";

const I: PdfMatrix = [1, 0, 0, 1, 0, 0];
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

// docs/PDF_EXPORT.md, PDF1: plan paths reach the PDF unchanged.
test("paths: lines, relative commands, close, arcs and quadratics as cubic curves", () => {
  const [square] = parsePath("M0,0 L3,0 3,0.36 h-3 Z", I);
  assert.equal(square!.closed, true);
  assert.deepEqual(
    square!.segments.map((s) => s.to),
    [
      { x: 3, y: 0 },
      { x: 3, y: 0.36 },
      { x: 0, y: 0.36 },
    ],
  );
  // Two subpaths: the second starts relative to where the first one closed.
  const two = parsePath("M1 1 l1 0 z m0 2 v1", I);
  assert.equal(two.length, 2);
  assert.deepEqual(two[1]!.start, { x: 1, y: 3 });
  assert.deepEqual(two[1]!.segments[0]!.to, { x: 1, y: 4 });
  // A quarter circle of radius 1 ends exactly on its end point; its middle lies on the circle.
  const [arc] = parsePath("M1 0 A1 1 0 0 1 0 1", I);
  const quarter = arc!.segments[0]!;
  assert.equal(quarter.kind, "curve");
  assert.deepEqual(quarter.to, { x: 0, y: 1 });
  if (quarter.kind === "curve") {
    const mid = {
      x: 0.125 * 1 + 0.375 * quarter.c1.x + 0.375 * quarter.c2.x + 0.125 * quarter.to.x,
      y: 0.125 * 0 + 0.375 * quarter.c1.y + 0.375 * quarter.c2.y + 0.125 * quarter.to.y,
    };
    assert.ok(Math.abs(Math.hypot(mid.x, mid.y) - 1) < 1e-3);
  }
  // A half circle becomes two curves.
  assert.equal(parsePath("M-1 0 A1 1 0 1 1 1 0", I)[0]!.segments.length, 2);
  assert.equal(parsePath("M0 0 Q1 1 2 0", I)[0]!.segments[0]!.kind, "curve");
  // Transformed: metres to points with the y axis flipped.
  const page: PdfMatrix = [2, 0, 0, -2, 10, 20];
  assert.deepEqual(parsePath("M1 1 L2 1", page)[0]!.start, { x: 12, y: 18 });
});

test("points, matrices and their scale", () => {
  assert.deepEqual(parsePoints("0,0 3,0.5  1 2"), [
    { x: 0, y: 0 },
    { x: 3, y: 0.5 },
    { x: 1, y: 2 },
  ]);
  const m = multiply([2, 0, 0, -2, 10, 20], [1, 0, 0, 1, 3, 4]);
  assert.deepEqual(apply(m, { x: 0, y: 0 }), { x: 16, y: 12 });
  const rotated: PdfMatrix = [0, 3, -3, 0, 0, 0];
  assert.ok(near(scaleOf(rotated), 3));
});
