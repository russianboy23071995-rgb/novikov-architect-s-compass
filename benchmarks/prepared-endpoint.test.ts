import test from "node:test";
import assert from "node:assert/strict";
import { prepareEndpoint } from "./prepared-endpoint.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { updateWall, validateProject } from "../src/lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history.ts";
test("local axial host preview matches full operation, windows, neighbours and history", () => {
  const p = tPairFixture(),
    pilot = prepareEndpoint(p, "wall-1");
  for (const x of [6, 6.01, 7, 9, 20]) {
    const point = { x, y: 0 },
      r = pilot.evaluate(point),
      full = updateWall(p, "wall-1", { end: point });
    assert.equal(r.path, "local");
    assert.deepEqual(r.project, full);
    assert.deepEqual(validateProject(r.project), full);
    assert.deepEqual(pilot.confirm(point), full);
    const h = createHistory(p),
      committed = commitProject(h, pilot.confirm(point));
    assert.equal(committed.past.length, x === 6 ? 0 : 1);
    if (x !== 6) {
      assert.deepEqual(undoProject(committed).present, p);
      assert.deepEqual(redoProject(undoProject(committed)), committed);
    }
  }
});
test("shortening and oblique targets fall back with same acceptance and geometry", () => {
  const p = tPairFixture(),
    pilot = prepareEndpoint(p, "wall-1");
  for (const end of [
    { x: 2, y: 0 },
    { x: 8, y: 1 },
    { x: 0, y: 0 },
    { x: NaN, y: 0 },
  ]) {
    let full;
    try {
      full = updateWall(p, "wall-1", { end });
    } catch {
      assert.throws(() => pilot.evaluate(end));
      continue;
    }
    const result = pilot.evaluate(end);
    assert.equal(result.path, "full");
    assert.deepEqual(result.project, full);
  }
});
test("foreign endpoint contacts use full corner and multiple-node rules", () => {
  for (const extra of [1, 2]) {
    const p = tPairFixture();
    for (let i = 0; i < extra; i++)
      p.storey.walls.push({
        ...p.storey.walls[0]!,
        id: `foreign-${i}`,
        start: { x: 8, y: 0 },
        end: { x: 8, y: 3 + i },
      });
    const valid = validateProject(p),
      pilot = prepareEndpoint(valid, "wall-1"),
      end = { x: 8, y: 0 };
    let full;
    try {
      full = updateWall(valid, "wall-1", { end });
    } catch {
      assert.throws(() => pilot.evaluate(end));
      continue;
    }
    assert.equal(pilot.evaluate(end).path, "full");
    assert.deepEqual(pilot.evaluate(end).project, full);
  }
});
test("prepared snapshot is owned and output cannot mutate later previews", () => {
  const p = tPairFixture(),
    pilot = prepareEndpoint(p, "wall-1"),
    before = pilot.evaluate({ x: 8, y: 0 });
  p.storey.windows[0]!.width = 9;
  assert.deepEqual(pilot.evaluate({ x: 8, y: 0 }), before);
  assert.throws(() => {
    before.project.storey.walls[0]!.height = 9;
  });
});
