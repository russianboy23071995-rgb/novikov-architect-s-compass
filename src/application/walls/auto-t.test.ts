import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { validateSimplePolygon } from "../../geometry/polygons/simple-polygon.ts";
import { beginWallChain, appendWallChain, finishWallChain } from "../drawing/wall-chain.ts";
import { previewWallChain } from "../drawing/wall-chain.ts";
import { createEditingState, editingReducer, previewEdit } from "../direct-edit/controller.ts";
import { editInteraction } from "../tools/adapters.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import { undoProject } from "../history/project-history.ts";
import { serializeProject, deserializeProject } from "../../lib/bim/model.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";

// Automatic T at any non-parallel angle (user decision 26.10.2026, docs/OBLIQUE_T_JUNCTIONS.md):
// a wall end exactly on another wall's axis interior connects, however the point was found.
const hostWall = {
  id: "H",
  start: { x: 0, y: 0 },
  end: { x: 40, y: 0 },
  thickness: 0.3,
  height: 3,
};
const base = () => addWall(createProject("p", "s"), hostWall);
const node = { x: 20, y: 0 };
const far = (degrees: number, length = 20, from: Point = node): Point => {
  const r = (degrees * Math.PI) / 180;
  return { x: from.x + length * Math.cos(r), y: from.y + length * Math.sin(r) };
};
const candidates: [string, SnapCandidate | null][] = [
  ["eingetippt", null],
  [
    "Wandmitte",
    {
      kind: "midpoint",
      worldPoint: node,
      sourceEntityId: "H",
      sourceFeature: "axis-midpoint:0",
      distanceOnScreen: 0,
      priority: 0,
    },
  ],
  [
    "Raster",
    {
      kind: "grid",
      worldPoint: node,
      sourceEntityId: null,
      sourceFeature: "grid",
      distanceOnScreen: 0,
      priority: 0,
    },
  ],
];

function assertT(project: Project, incoming: string, endpoint: 0 | 1) {
  const tees = storeyOf(project).wallTJunctions;
  assert.equal(tees.length, 1);
  assert.deepEqual(tees[0], { hostWallId: "H", incoming: { wallId: incoming, endpoint } });
  for (const ring of connectedWallContours(project).values())
    assert.ok(validateSimplePolygon(ring).valid);
}

for (const degrees of [90, 45, 15, 5, 2])
  test(`drawing onto the axis at ${degrees}° connects a T for typed, midpoint and grid points`, () => {
    for (const [label, candidate] of candidates) {
      // End of a wall on the axis; preview and placement agree.
      const p = base();
      const chain = beginWallChain(p, far(degrees));
      const preview = previewWallChain(chain, p, node, candidate);
      const placed = finishWallChain(appendWallChain(chain, p, "N", node, candidate), p);
      assert.equal(storeyOf(preview).wallTJunctions.length, 1, label);
      assertT(placed, "N", 1);
      // Start of a wall on the axis.
      const startChain = beginWallChain(p, node, candidate);
      assertT(finishWallChain(appendWallChain(startChain, p, "S", far(degrees)), p), "S", 0);
    }
  });

test("dragging a wall end onto the axis connects a T in preview and as one undo step", () => {
  const p = addWall(base(), {
    id: "N",
    start: far(5),
    end: { x: 20, y: 2 },
    thickness: 0.24,
    height: 3,
  });
  const target = { kind: "wall" as const, id: "N" };
  let state = editingReducer(createEditingState(p), {
    type: "begin",
    target,
    action: "point",
    index: 1,
    anchor: storeyOf(p).walls[1]!.end,
  });
  const session = state.session!;
  const adapter = editInteraction(
    session,
    state.history.present,
    target,
    (point, candidate) => {
      state = editingReducer(state, {
        type: "confirm",
        session,
        selection: target,
        point,
        candidate,
      });
    },
    () => {},
  );
  // Not exactly on the axis: no T.
  assert.equal(
    storeyOf(previewEdit(session, session.base, target, { x: 20, y: 0.01 })).wallTJunctions.length,
    0,
  );
  assertT(previewEdit(session, session.base, target, node), "N", 1);
  confirmInteraction(adapter, node, null);
  assertT(state.history.present, "N", 1);
  assert.equal(state.history.past.length, 1);
  assert.deepEqual(undoProject(state.history).present, session.base);
});

test("crossings, host ends, parallel walls and rejected Ts create no automatic T (counter-check)", () => {
  const draw = (p: Project, from: Point, to: Point) =>
    finishWallChain(appendWallChain(beginWallChain(p, from), p, "N", to), p);
  // On two axes at once (a crossing): no T.
  const crossing = addWall(base(), {
    id: "V",
    start: { x: 20, y: -5 },
    end: { x: 20, y: 5 },
    thickness: 0.3,
    height: 3,
  });
  const crossed = draw(crossing, far(45), node);
  assert.equal(storeyOf(crossed).walls.length, 3);
  assert.equal(storeyOf(crossed).wallTJunctions.length, 0);
  // On the host end: a corner, not a T.
  const corner = draw(base(), { x: 0, y: 5 }, { x: 0, y: 0 });
  assert.equal(storeyOf(corner).wallTJunctions.length, 0);
  assert.equal(storeyOf(corner).wallJoins.length, 1);
  // Parallel on the axis: no T.
  assert.equal(storeyOf(draw(base(), { x: 30, y: 0 }, node)).wallTJunctions.length, 0);
  // A T the rules reject (contact beyond the host end at 2°): the wall stays unconnected.
  const end = { x: 38, y: 0 };
  const short = draw(base(), far(2, 20, end), end);
  assert.equal(storeyOf(short).walls.length, 2);
  assert.equal(storeyOf(short).wallTJunctions.length, 0);
});

test("loading a file never creates a T automatically", () => {
  const p = addWall(base(), { id: "N", start: far(30), end: node, thickness: 0.24, height: 3 });
  assert.equal(storeyOf(p).wallTJunctions.length, 0);
  const loaded = deserializeProject(serializeProject(p));
  assert.equal(storeyOf(loaded).wallTJunctions.length, 0);
  assert.deepEqual(loaded, p);
});
