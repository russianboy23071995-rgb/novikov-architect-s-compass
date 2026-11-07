import test from "node:test";
import assert from "node:assert/strict";
import { overlapPieces, ringArea } from "./overlap.ts";

const rect = (x: number, y: number, w: number, h: number) => [
  { x, y },
  { x: x + w, y },
  { x: x + w, y: y + h },
  { x, y: y + h },
];
const overlap = (a: ReturnType<typeof rect>, b: ReturnType<typeof rect>) =>
  overlapPieces(a, b).reduce((sum, piece) => sum + ringArea(piece), 0);
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

test("overlap of rectangles: inside, across an edge, apart, touching", () => {
  near(overlap(rect(0, 0, 4, 3), rect(1, 1, 1, 1)), 1);
  near(overlap(rect(0, 0, 4, 3), rect(3, 1, 2, 1)), 1);
  near(overlap(rect(0, 0, 4, 3), rect(5, 0, 1, 1)), 0);
  near(overlap(rect(0, 0, 4, 3), rect(4, 0, 1, 3)), 0);
});

test("a notch stays out: an L room and a rectangle across it", () => {
  const room = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 4 },
    { x: 0, y: 4 },
  ];
  // 3 × 3 at the origin covers the room except the notch 1 × 1.
  near(overlap(room, rect(0, 0, 3, 3)), 8);
});
