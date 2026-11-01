import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { setLineSegmentLength } from "./actions.ts";

// docs/LINIEN.md, S3: the length helper of a selected line or line segment.
const withLine = (points: { x: number; y: number }[]) => {
  const p = createProject("p", "eg");
  return validateLike(
    p,
    replaceStorey(p, {
      ...storeyOf(p),
      lines: [
        {
          id: "l",
          layerId: p.defaultLayerIds.line,
          kind: points.length > 2 ? "polyline" : "line",
          points,
          color: "#000000",
          penWidth: 0.25,
          style: "solid",
        },
      ],
    }),
  );
};
const points = (p: ReturnType<typeof withLine>) => storeyOf(p).lines![0]!.points;

test("a line gets a new length towards its end, its start or both ends evenly", () => {
  const p = withLine([
    { x: 0, y: 0 },
    { x: 4, y: 0 },
  ]);
  assert.deepEqual(points(setLineSegmentLength(p, "l", 0, 5, "end")), [
    { x: 0, y: 0 },
    { x: 5, y: 0 },
  ]);
  assert.deepEqual(points(setLineSegmentLength(p, "l", 0, 3, "start")), [
    { x: 1, y: 0 },
    { x: 4, y: 0 },
  ]);
  assert.deepEqual(points(setLineSegmentLength(p, "l", 0, 6, "both")), [
    { x: -1, y: 0 },
    { x: 5, y: 0 },
  ]);
  assert.throws(() => setLineSegmentLength(p, "l", 0, 0, "end"), /größer als null/);
  assert.throws(() => setLineSegmentLength(p, "l", 1, 2, "end"), /Linienabschnitt/);
});

test("a polyline segment moves only its own points; neighbours follow, closed lines stay closed", () => {
  const open = withLine([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
  ]);
  // Second segment (vertical, 2 m) to 3 m towards its end: only the last point moves.
  assert.deepEqual(points(setLineSegmentLength(open, "l", 1, 3, "end")), [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 3 },
  ]);
  // First segment to 3 m towards its end: the shared corner moves, the second segment follows.
  assert.deepEqual(points(setLineSegmentLength(open, "l", 0, 3, "end"))[1], { x: 3, y: 0 });
  const closed = withLine([
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 2 },
    { x: 0, y: 0 },
  ]);
  const moved = points(setLineSegmentLength(closed, "l", 0, 4, "start"));
  assert.deepEqual(moved[0], { x: -2, y: 0 });
  assert.deepEqual(moved[3], moved[0]);
});
