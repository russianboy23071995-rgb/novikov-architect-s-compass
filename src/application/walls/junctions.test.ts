import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall, updateWall } from "./actions.ts";
import { previewTConnection } from "./t-connections.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  connectedWallContours,
  connectedWallSolids,
} from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";

// Wall junctions after the user decision of 26.10.2026 (docs/WALL_JUNCTIONS.md).
type Spec = { thickness?: number; height?: number; bodyOffset?: number };
const wall = (id: string, start: [number, number], end: [number, number], spec: Spec = {}) => ({
  id,
  start: { x: start[0], y: start[1] },
  end: { x: end[0], y: end[1] },
  thickness: spec.thickness ?? 0.3,
  height: spec.height ?? 3,
  ...(spec.bodyOffset === undefined ? {} : { bodyOffset: spec.bodyOffset }),
});
const build = (...walls: ReturnType<typeof wall>[]) =>
  walls.reduce((p, w) => addWall(p, w), createProject("p", "s0") as Project);
const connect = (p: Project, hostWallId: string, wallId: string, endpoint: 0 | 1) =>
  previewTConnection(p, p, {
    projectId: "p",
    kind: "connect",
    relation: { hostWallId, incoming: { wallId, endpoint } },
  });
const ring = (p: Project, id: string) => connectedWallContours(p).get(id)!;
const ys = (points: { y: number }[]) => points.map((q) => +q.y.toFixed(9));

test("a thinner partition T-joins a thicker wall and ends on its face", () => {
  const p = connect(
    build(wall("H", [0, 0], [8, 0]), wall("P", [4, 3], [4, 0], { thickness: 0.12 })),
    "H",
    "P",
    1,
  );
  // P ends on the host face y = 0.15, not on the axis.
  assert.deepEqual(ys([ring(p, "P")[1]!, ring(p, "P")[2]!]), [0.15, 0.15]);
  assert.ok(connectedWallSolids(p).every((s) => s.volume > 0));
});

test("a partition with a different height keeps its own height at the T", () => {
  const p = connect(
    build(wall("H", [0, 0], [8, 0]), wall("P", [4, 3], [4, 0], { height: 2.5 })),
    "H",
    "P",
    1,
  );
  const solid = connectedWallSolids(p).find((s) => s.wallId === "P")!;
  assert.equal(Math.max(...solid.faces.flatMap((f) => f.vertices.map((v) => v[2]))), 2.5);
});

test("a partition between two walls takes a T at both ends", () => {
  let p = build(
    wall("S", [0, 0], [8, 0]),
    wall("N", [0, 5], [8, 5]),
    wall("P", [4, 0], [4, 5], { thickness: 0.2 }),
  );
  p = connect(connect(p, "S", "P", 0), "N", "P", 1);
  assert.equal(storeyOf(p).wallTJunctions.length, 2);
  const r = ring(p, "P");
  // Start on the south face (0.15), end on the north face (4.85).
  assert.deepEqual(ys([r[0]!, r[3]!]), [0.15, 0.15]);
  assert.deepEqual(ys([r[1]!, r[2]!]), [4.85, 4.85]);
  assert.deepEqual(validateProject(JSON.parse(JSON.stringify(p))), p);
});

test("a wall may be host of one T and incoming of another", () => {
  let p = build(wall("A", [0, 0], [10, 0]), wall("B", [5, 6], [5, 0]), wall("C", [8, 3], [5, 3]));
  p = connect(connect(p, "A", "B", 1), "B", "C", 1);
  assert.equal(storeyOf(p).wallTJunctions.length, 2);
  // B is trimmed at A, C ends on the east face of B (x = 5.15).
  assert.ok(Math.abs(ring(p, "B")[1]!.y - 0.15) < 1e-9);
  assert.ok(Math.abs(ring(p, "C")[1]!.x - 5.15) < 1e-9);
});

test("a corner with different thicknesses mitres through the face intersections", () => {
  const p = build(
    wall("A", [0, 0], [5, 0], { thickness: 0.36 }),
    wall("B", [0, 0], [0, 4], { thickness: 0.12 }),
  );
  assert.equal(storeyOf(p).wallJoins.length, 1);
  const a = ring(p, "A"),
    b = ring(p, "B");
  // Both rings share the mitre seam: the two near points of A are the near points of B.
  const key = (q: { x: number; y: number }) => `${q.x.toFixed(9)},${q.y.toFixed(9)}`;
  assert.deepEqual(
    new Set([a[0], a[3]].map((q) => key(q!))),
    new Set([b[0], b[3]].map((q) => key(q!))),
  );
});

test("a corner with different heights is a butt joint: the taller wall runs through", () => {
  const p = build(
    wall("A", [0, 0], [5, 0], { height: 3 }),
    wall("B", [0, 0], [0, 4], { height: 2.5 }),
  );
  assert.equal(storeyOf(p).wallJoins.length, 1);
  const a = ring(p, "A"),
    b = ring(p, "B");
  // A (taller) reaches the far face of B (x = -0.15); B starts on the inner face of A (y = 0.15).
  assert.deepEqual(
    [a[0], a[3]].map((q) => +q!.x.toFixed(9)),
    [-0.15, -0.15],
  );
  assert.deepEqual(ys([b[0]!, b[3]!]), [0.15, 0.15]);
  // Swapping which wall is taller swaps the roles.
  const swapped = updateWall(updateWall(p, "A", { height: 2.5 }), "B", { height: 3.2 });
  assert.deepEqual(ys([ring(swapped, "B")[0]!, ring(swapped, "B")[3]!]), [-0.15, -0.15]);
});

test("one join per wall end, no mutual Ts and no overlapping contacts", () => {
  const base = build(
    wall("H", [0, 0], [8, 0]),
    wall("P", [4, 3], [4, 0]),
    wall("Q", [4, 0], [7, 3]),
  );
  // P and Q meet at (4, 0) as a corner; that end cannot also take a T.
  assert.equal(storeyOf(base).wallJoins.length, 1);
  assert.throws(() => connect(base, "H", "P", 1), /Wandende|Mehrere|Anschluss/);
  // Mutual Ts between two walls stay excluded.
  const pair = build(wall("A", [0, 0], [6, 0]), wall("B", [3, 4], [3, 0]));
  const tee = connect(pair, "A", "B", 1);
  assert.throws(() =>
    validateProject(
      replaceStorey(tee, {
        ...storeyOf(tee),
        wallTJunctions: [
          ...storeyOf(tee).wallTJunctions,
          { hostWallId: "B", incoming: { wallId: "A", endpoint: 0 } },
        ],
      }),
    ),
  );
  // Two Ts on the same host side may not overlap.
  const crowded = build(
    wall("H", [0, 0], [8, 0]),
    wall("P", [4, 3], [4, 0]),
    wall("Q", [4.2, 3], [4.2, 0]),
  );
  assert.throws(() => connect(connect(crowded, "H", "P", 1), "H", "Q", 1), /überschneiden/);
});

test("contours of unchanged single junctions are untouched by the composition", () => {
  // Single T: the incoming ring equals the plain body with only its end trimmed.
  const p = connect(build(wall("H", [0, 0], [8, 0]), wall("P", [4, 3], [4, 0])), "H", "P", 1);
  const body = wallBody(storeyOf(p).walls.find((w) => w.id === "P")!).corners;
  assert.deepEqual([ring(p, "P")[0], ring(p, "P")[3]], [body[0], body[3]]);
});
