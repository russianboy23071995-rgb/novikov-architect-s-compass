import test from "node:test";
import assert from "node:assert/strict";
import {
  preparePolygonVertexEdit,
  validateSimplePolygon,
  changedEdgePairs,
} from "./simple-polygon.ts";
import { prepareContourEdge, contourEdge, editContourEdge } from "./edit-edge.ts";
const ring = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    x: 10 * Math.cos((2 * Math.PI * i) / n),
    y: 10 * Math.sin((2 * Math.PI * i) / n),
  }));

test("only pairs involving the three changed sides are prepared, including closing seam", () => {
  for (const n of [3, 4, 100, 200, 500])
    for (const index of [0, n - 1]) {
      const pairs = changedEdgePairs(n, [index, (index + 1) % n]);
      const moving = new Set([index, (index + 1) % n, (index + n - 1) % n]);
      assert.equal(pairs.length, 3 * n - 6);
      const keys = new Set(pairs.map((p) => p.join(":")));
      assert.equal(keys.size, pairs.length);
      for (let i = 0; i < n; i++)
        for (let j = i + 1; j < n; j++)
          assert.equal(keys.has(i + ":" + j), moving.has(i) || moving.has(j));
    }
});

test("incremental validation agrees with full validation for deterministic point edits", () => {
  let seed = 703;
  const random = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32;
  for (const n of [3, 7, 20])
    for (const offset of [0, 1e8])
      for (const reverse of [false, true]) {
        const points = ring(n).map((p) => ({ x: p.x + offset, y: p.y + offset }));
        if (reverse) points.reverse();
        for (const index of [0, n - 1]) {
          const other = (index + 1) % n,
            prepared = preparePolygonVertexEdit(points, [index, other]);
          for (let k = 0; k < 60; k++) {
            const next = structuredClone(points);
            for (const i of [index, other]) {
              next[i]!.x += (random() - 0.5) * 40;
              next[i]!.y += (random() - 0.5) * 40;
            }
            assert.deepEqual(prepared.validate(next), validateSimplePolygon(next));
          }
        }
      }
});

test("prepared validators own their baseline and reject undeclared edits and bad input", () => {
  const points = ring(6),
    before = structuredClone(points),
    prepared = preparePolygonVertexEdit(points, [0, 1]);
  points[3]!.x = 999;
  assert.equal(prepared.validate(before).valid, true);
  assert.throws(() => prepared.validate(points));
  assert.throws(() => prepared.validate(before.slice(1)));
  assert.throws(() =>
    preparePolygonVertexEdit(
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      [0],
    ),
  );
  assert.throws(() => preparePolygonVertexEdit(before, [-1]));
  before[0]!.x = Infinity;
  assert.equal(prepared.validate(before).valid, false);
});

test("prepared cap retains acute/concave boundaries, either winding and return movement", () => {
  const shapes = [
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 0, y: 3 },
    ],
    [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 0.01, y: 0.1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 3 },
      { x: 2, y: 1 },
      { x: 0, y: 3 },
    ],
  ];
  for (const shape of shapes)
    for (const reverse of [false, true]) {
      const points = reverse ? [shape[1]!, shape[0]!, ...shape.slice(2).reverse()] : shape;
      const { a, b } = contourEdge(points, 0),
        anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const cap = prepareContourEdge(points, 0, anchor),
        target = { x: anchor.x, y: 10 },
        bounded = cap(target);
      assert.ok(bounded.y > 0 && bounded.y < Math.min(...shape.slice(2).map((p) => p.y)));
      assert.equal(
        validateSimplePolygon(editContourEdge(points, 0, "edge", anchor, bounded)).valid,
        true,
      );
      for (let k = 0; k < 40; k++)
        assert.doesNotThrow(() =>
          editContourEdge(points, 0, "edge", anchor, { x: anchor.x, y: (bounded.y * k) / 40 }),
        );
      const back = { x: anchor.x, y: 0.001 };
      assert.ok(Math.abs(cap(back).y - back.y) < 1e-12);
      assert.deepEqual(cap(target), bounded);
      assert.throws(() => cap({ x: NaN, y: 0 }));
    }
});

test("500-vertex cap matches previously measured geometric limits", () => {
  const points = ring(500),
    { a, b, normal } = contourEdge(points, 0),
    anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const cap = prepareContourEdge(points, 0, anchor);
  for (const [d, expected] of [
    [-0.1, -0.0007896047079417356],
    [0.1, 0.0015790847281485804],
  ]) {
    const result = cap({ x: anchor.x + normal.x * d!, y: anchor.y + normal.y * d! });
    const distance = (result.x - anchor.x) * normal.x + (result.y - anchor.y) * normal.y;
    assert.ok(Math.abs(distance - expected!) < 1e-12);
    assert.equal(
      validateSimplePolygon(editContourEdge(points, 0, "edge", anchor, result)).valid,
      true,
    );
  }
});

test("broad phase retains near contacts at origin and large offsets", () => {
  for (const [offset, gap, valid] of [
    [0, 1e-10, false],
    [0, 1e-6, true],
    [1e8, 1e-7, false],
    [1e8, 3e-6, true],
  ] as const) {
    const points = [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
      { x: 2, y: 4 },
      { x: 2, y: gap },
      { x: 1, y: gap },
      { x: 1, y: 4 },
      { x: 0, y: 4 },
    ].map((p) => ({ x: p.x + offset, y: p.y + offset }));
    assert.equal(validateSimplePolygon(points).valid, valid);
  }
});
