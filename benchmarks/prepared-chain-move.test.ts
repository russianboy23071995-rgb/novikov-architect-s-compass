import test from "node:test";
import assert from "node:assert/strict";
import { connectedFixture } from "./connected-fixture.ts";
import { prepareChainMove } from "./prepared-chain-move.ts";
import { fullSelectionMove as oracle } from "./selection-move-oracle.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { connectedWallSolids } from "../src/domain/elements/wall/connections.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history.ts";
// The legacy oracle explicitly inserts optional lines:undefined; normalize file-equivalent shape.
const fullSelectionMove: typeof oracle = (...args) => JSON.parse(JSON.stringify(oracle(...args)));

test("detached chain end reuses translation with identical model/solids/history", () => {
  const p = connectedFixture("chain", 10),
    pilot = prepareChainMove(p, "wall-0");
  assert.equal(pilot.affectedWalls, 1);
  for (const delta of [
    { x: -1, y: -2 },
    { x: 2, y: -1 },
    { x: 0, y: 0 },
  ]) {
    const full = fullSelectionMove(p, [{ kind: "wall", id: "wall-0" }], delta),
      r = pilot.evaluate(delta);
    assert.deepEqual(r.project, full);
    assert.deepEqual(validateProject(r.project), full);
    assert.deepEqual(connectedWallSolids(r.project), connectedWallSolids(full));
    const h = commitProject(createHistory(p), pilot.confirm(delta));
    assert.equal(h.past.length, delta.x || delta.y ? 1 : 0);
    if (h.past.length) {
      assert.deepEqual(undoProject(h).present, p);
      assert.deepEqual(redoProject(undoProject(h)), h);
    }
  }
});
test("foreign occupied endpoints and invalid deltas keep full acceptance", () => {
  const p = connectedFixture("chain", 10),
    pilot = prepareChainMove(p, "wall-0");
  for (const delta of [
    { x: 4, y: 4 },
    { x: 8, y: 8 },
    { x: NaN, y: 0 },
    { x: Infinity, y: 0 },
  ]) {
    let full;
    try {
      full = fullSelectionMove(p, [{ kind: "wall", id: "wall-0" }], delta);
    } catch {
      assert.throws(() => pilot.evaluate(delta));
      continue;
    }
    assert.deepEqual(pilot.evaluate(delta).project, full);
  }
});
test("T groups and interior chain walls retain full fallback", () => {
  for (const [kind, id] of [
    ["tees", "wall-0"],
    ["chain", "wall-2"],
  ] as const) {
    const p = connectedFixture(kind, 10),
      delta = { x: -2, y: -2 },
      r = prepareChainMove(p, id).evaluate(delta);
    assert.equal(r.path, "full");
    assert.deepEqual(r.project, fullSelectionMove(p, [{ kind: "wall", id }], delta));
  }
});
test("owned snapshot and immutable result protect repeated evaluation", () => {
  const p = connectedFixture("chain", 10),
    pilot = prepareChainMove(p, "wall-0"),
    delta = { x: -1, y: -1 },
    before = pilot.evaluate(delta);
  p.storey.windows[0]!.width = 99;
  assert.deepEqual(pilot.evaluate(delta), before);
  assert.throws(() => {
    before.project.storey.walls[0]!.height = 99;
  });
});
