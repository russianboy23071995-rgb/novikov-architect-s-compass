import test from "node:test";
import assert from "node:assert/strict";
import { validateSimplePolygon } from "./simple-polygon.ts";
const ring = (pairs: [number, number][]) => pairs.map(([x, y]) => ({ x, y }));
const rectangle = ring([
  [0, 0],
  [3, 0],
  [3, 2.8],
  [0, 2.8],
]);

test("simple polygons accept either winding and return square metres without mutation", () => {
  const input = Object.freeze(rectangle.map((p) => Object.freeze({ ...p })));
  const result = validateSimplePolygon(input);
  assert.equal(result.valid, true);
  if (!result.valid) return;
  assert.ok(Math.abs(result.signedArea - 8.4) < 1e-12);
  assert.equal(result.winding, "counterclockwise");
  const reversed = validateSimplePolygon([...input].reverse());
  assert.deepEqual(reversed, { valid: true, signedArea: -result.signedArea, winding: "clockwise" });
  assert.deepEqual(input, rectangle);
});

test("concavity and forward collinear vertices are valid", () => {
  assert.deepEqual(
    validateSimplePolygon(
      ring([
        [0, 0],
        [2, 0],
        [4, 0],
        [4, 1],
        [1, 1],
        [1, 3],
        [0, 3],
      ]),
    ),
    { valid: true, signedArea: 6, winding: "counterclockwise" },
  );
});

test("too few vertices and non-finite coordinates fail explicitly", () => {
  for (const points of [[], rectangle.slice(0, 1), rectangle.slice(0, 2)]) {
    assert.deepEqual(validateSimplePolygon(points), {
      valid: false,
      reason: "too-few-vertices",
      indices: [],
    });
  }
  for (const value of [NaN, Infinity, -Infinity]) {
    assert.deepEqual(validateSimplePolygon([{ x: value, y: 0 }, ...rectangle.slice(1)]), {
      valid: false,
      reason: "non-finite-coordinate",
      indices: [0],
    });
  }
});

test("zero edges include repeated closing vertices and sub-tolerance vertices", () => {
  for (const points of [
    [...rectangle, rectangle[0]!],
    [rectangle[0]!, ...rectangle],
    ring([
      [0, 0],
      [1e-10, 0],
      [1, 1],
      [0, 1],
    ]),
  ]) {
    const result = validateSimplePolygon(points);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, "zero-edge");
  }
});

test("crossings are rejected even if signed area is nonzero", () => {
  for (const points of [
    ring([
      [0, 0],
      [4, 4],
      [0, 4],
      [4, 0],
    ]),
    ring([
      [0, 0],
      [4, 3],
      [0, 4],
      [3, 0],
    ]),
  ]) {
    const result = validateSimplePolygon(points);
    assert.equal(result.valid, false);
    if (!result.valid) assert.equal(result.reason, "edge-contact");
  }
});

test("nonadjacent repeated vertices and endpoint-on-edge touches are rejected", () => {
  for (const points of [
    ring([
      [0, 0],
      [4, 0],
      [4, 4],
      [2, 0],
      [0, 4],
    ]),
    ring([
      [0, 0],
      [3, 0],
      [3, 3],
      [0, 0],
      [-2, 3],
      [-2, 0],
    ]),
  ]) {
    assert.equal(validateSimplePolygon(points).valid, false);
  }
});

test("adjacent backtracking including closing seam is rejected", () => {
  const points = ring([
    [0, 0],
    [4, 0],
    [2, 0],
    [2, 2],
    [0, 2],
  ]);
  for (let i = 0; i < points.length; i++) {
    const rotated = [...points.slice(i), ...points.slice(0, i)];
    assert.equal(validateSimplePolygon(rotated).valid, false);
    assert.equal(validateSimplePolygon(rotated.reverse()).valid, false);
  }
});

test("nonadjacent overlapping edges and collinear zero-area rings are rejected", () => {
  assert.equal(
    validateSimplePolygon(
      ring([
        [0, 0],
        [4, 0],
        [4, 2],
        [1, 2],
        [1, 0],
        [3, 0],
        [3, -2],
        [0, -2],
      ]),
    ).valid,
    false,
  );
  assert.equal(
    validateSimplePolygon(
      ring([
        [0, 0],
        [1, 1],
        [2, 2],
      ]),
    ).valid,
    false,
  );
});

test("area is stable at large model offsets and small polygons remain valid", () => {
  for (const offset of [0, 1e6, -1e6, 1e9]) {
    const result = validateSimplePolygon(
      rectangle.map((p) => ({ x: p.x + offset, y: p.y + offset })),
    );
    assert.equal(result.valid, true);
    if (result.valid) assert.ok(Math.abs(result.signedArea - 8.4) < 1e-6);
  }
  assert.equal(
    validateSimplePolygon(
      ring([
        [0, 0],
        [1e-5, 0],
        [1e-5, 1e-5],
        [0, 1e-5],
      ]),
    ).valid,
    true,
  );
});

test("arithmetic overflow is rejected instead of reporting a valid contour", () => {
  assert.deepEqual(
    validateSimplePolygon(
      ring([
        [-1e308, 0],
        [1e308, 0],
        [0, 1e308],
      ]),
    ),
    { valid: false, reason: "numeric-range", indices: [] },
  );
});

// Ear clipping for ceiling slabs (docs/SLAB_ELEMENT.md, Teil B).
import { triangulateSimplePolygon } from "./triangulate.ts";
test("ear clipping covers simple rings of either winding with counterclockwise triangles", () => {
  const area = (p: { x: number; y: number }[], [a, b, c]: [number, number, number]) =>
    ((p[b]!.x - p[a]!.x) * (p[c]!.y - p[a]!.y) - (p[b]!.y - p[a]!.y) * (p[c]!.x - p[a]!.x)) / 2;
  const lShape = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 3 },
    { x: 3, y: 3 },
    { x: 3, y: 5 },
    { x: 0, y: 5 },
  ];
  // A straight extra vertex never yields a zero-area triangle; the covered area stays exact.
  const withStraight = [lShape[0]!, { x: 3, y: 0 }, ...lShape.slice(1)];
  for (const ring of [lShape, [...lShape].reverse(), withStraight]) {
    const triangles = triangulateSimplePolygon(ring);
    assert.ok(triangles.every((t) => area(ring, t) > 0));
    assert.equal(
      triangles.reduce((sum, t) => sum + area(ring, t), 0),
      24,
    );
  }
  assert.equal(triangulateSimplePolygon(lShape).length, 4);
});
