import test from "node:test";
import assert from "node:assert/strict";
import { prepareWallDrawing } from "./prepared-wall-drawing.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { beginWallChain, appendWallChain } from "../src/application/drawing/wall-chain.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history.ts";
test("free first segment equals full path and preserves neighbours/windows/history", () => {
  const p = tPairFixture(),
    origin = { x: -20, y: -20 },
    pilot = prepareWallDrawing(p, origin, "new");
  for (const point of [
    { x: -10, y: -20 },
    { x: -15, y: -10 },
    { x: 4, y: 0 },
  ]) {
    const full = appendWallChain(beginWallChain(p, origin), p, "new", point).preview;
    const r = pilot.evaluate(point);
    assert.equal(r.path, "local");
    assert.deepEqual(r.project, full);
    assert.deepEqual(validateProject(r.project), full);
    const h = commitProject(createHistory(p), pilot.confirm(point));
    assert.equal(h.past.length, 1);
    assert.deepEqual(undoProject(h).present, p);
    assert.deepEqual(redoProject(undoProject(h)), h);
  }
});
test("contacts, duplicate IDs and invalid goals retain full acceptance", () => {
  const p = tPairFixture(),
    origin = { x: -20, y: -20 };
  for (const id of ["new", p.storey.walls[0]!.id, p.id, " " + p.storey.id + " "])
    for (const point of [
      { x: 0, y: 0 },
      { x: 6 + 5e-10, y: 0 },
      origin,
      { x: NaN, y: 0 },
      { x: Infinity, y: 0 },
    ]) {
      const pilot = prepareWallDrawing(p, origin, id);
      let full;
      try {
        full = appendWallChain(beginWallChain(p, origin), p, id, point).preview;
      } catch {
        assert.throws(() => pilot.evaluate(point));
        continue;
      }
      assert.deepEqual(pilot.evaluate(point).project, full);
    }
  const contact = p.storey.walls[0]!.start;
  assert.equal(prepareWallDrawing(p, contact, "new").evaluate({ x: 0, y: -4 }).path, "full");
});
test("prepared source and origin are owned; output immutable", () => {
  const p = tPairFixture(),
    o = { x: -20, y: -20 },
    pilot = prepareWallDrawing(p, o, "new"),
    goal = { x: -10, y: -20 };
  const before = pilot.evaluate(goal);
  p.storey.windows[0]!.width = 99;
  o.x = 999;
  assert.deepEqual(pilot.evaluate(goal), before);
  assert.throws(() => {
    before.project.storey.walls[0]!.height = 99;
  });
});
test("T candidate always uses full connection action", () => {
  const p = tPairFixture(),
    origin = { x: 4, y: -4 },
    point = { x: 4, y: 0 };
  const candidate = {
    kind: "midpoint" as const,
    worldPoint: point,
    distanceOnScreen: 0,
    sourceEntityId: p.storey.walls[0]!.id,
    sourceFeature: "t-axis",
    priority: 0,
  };
  const pilot = prepareWallDrawing(p, origin, "new");
  const full = appendWallChain(beginWallChain(p, origin), p, "new", point, candidate).preview;
  assert.equal(pilot.evaluate(point, candidate).path, "full");
  assert.deepEqual(pilot.evaluate(point, candidate).project, full);
});
