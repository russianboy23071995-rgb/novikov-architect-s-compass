import test from "node:test";
import assert from "node:assert/strict";
import { prepareChainCorner } from "./prepared-chain-corner.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { beginWallChain, appendWallChain } from "../src/application/drawing/wall-chain.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history.ts";
const fixture = () => {
  const p = tPairFixture();
  return appendWallChain(beginWallChain(p, { x: -20, y: -20 }), p, "first", { x: -15, y: -20 });
};
test("second right-angle segment matches full joins, neighbours and whole-chain history", () => {
  const c = fixture(),
    pilot = prepareChainCorner(c, "second");
  for (const y of [-25, -21, -19, -10]) {
    const point = { x: -15, y },
      full = appendWallChain(c, c.base, "second", point).preview,
      r = pilot.evaluate(point);
    assert.equal(r.path, "local");
    assert.deepEqual(r.project, full);
    assert.deepEqual(validateProject(r.project), full);
    const h = commitProject(createHistory(c.base), pilot.confirm(point));
    assert.equal(h.past.length, 1);
    assert.deepEqual(undoProject(h).present, c.base);
    assert.deepEqual(redoProject(undoProject(h)), h);
  }
});
test("oblique, degenerate, nonfinite and duplicate cases match full acceptance", () => {
  const c = fixture();
  for (const id of ["second", "first", c.base.id])
    for (const point of [
      { x: -14, y: -19 },
      { x: -15, y: -20 },
      { x: NaN, y: 0 },
      { x: Infinity, y: 0 },
    ]) {
      const pilot = prepareChainCorner(c, id);
      let full;
      try {
        full = appendWallChain(c, c.base, id, point).preview;
      } catch {
        assert.throws(() => pilot.evaluate(point));
        continue;
      }
      assert.deepEqual(pilot.evaluate(point).project, full);
      assert.equal(pilot.evaluate(point).path, "full");
    }
});
test("foreign contact, candidate and later chain use full path", () => {
  const c = fixture();
  const point = { x: 4, y: 0 },
    candidate = {
      kind: "midpoint" as const,
      worldPoint: point,
      distanceOnScreen: 0,
      sourceEntityId: "wall-1",
      sourceFeature: "t-axis",
      priority: 0,
    };
  for (const [target, snap] of [
    [{ x: 0, y: 0 }, null],
    [point, candidate],
  ] as const) {
    const pilot = prepareChainCorner(c, "second");
    let full;
    try {
      full = appendWallChain(c, c.base, "second", target, snap).preview;
    } catch {
      assert.throws(() => pilot.evaluate(target, snap));
      continue;
    }
    assert.equal(pilot.evaluate(target, snap).path, "full");
    assert.deepEqual(pilot.evaluate(target, snap).project, full);
  }
  const later = appendWallChain(c, c.base, "second", { x: -15, y: -10 }),
    r = prepareChainCorner(later, "third").evaluate({ x: -10, y: -10 });
  assert.equal(r.path, "full");
  assert.deepEqual(
    r.project,
    appendWallChain(later, later.base, "third", { x: -10, y: -10 }).preview,
  );
});
test("pilot owns chain and freezes derived output", () => {
  const c = fixture(),
    pilot = prepareChainCorner(c, "second"),
    p = { x: -15, y: -10 },
    before = pilot.evaluate(p);
  c.points[1]!.x = 100;
  c.preview.storey.windows[0]!.width = 90;
  assert.deepEqual(pilot.evaluate(p), before);
  assert.throws(() => {
    before.project.storey.walls[0]!.height = 90;
  });
});
test("right-angle goal touching a foreign endpoint falls back", () => {
  const c = fixture();
  c.preview.storey.walls.push({
    ...c.preview.storey.walls[0]!,
    id: "foreign",
    start: { x: -15, y: -10 },
    end: { x: -11, y: -10 },
  });
  c.preview = validateProject(c.preview);
  const p = { x: -15, y: -10 },
    pilot = prepareChainCorner(c, "second");
  let full;
  try {
    full = appendWallChain(c, c.base, "second", p).preview;
  } catch {
    assert.throws(() => pilot.evaluate(p));
    return;
  }
  assert.equal(pilot.evaluate(p).path, "full");
  assert.deepEqual(pilot.evaluate(p).project, full);
});
