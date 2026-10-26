import { storeyOf } from "../src/domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { prepareEndpoint } from "./prepared-endpoint.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../src/application/history/project-history.ts";
import {
  connectedWallSolids,
  createWallSolidReuse,
} from "../src/domain/elements/wall/connections.ts";
import { buildPreviewSolid } from "../src/lib/bim/geometry.ts";
import { connectionGroupFixture } from "./connection-group-fixture.ts";

test("prepared extrusion reuse invalidates exact geometry inputs and still validates openings", () => {
  const p = tPairFixture();
  const reuse = createWallSolidReuse(storeyOf(p).walls.map((w) => w.id));
  for (const kind of ["base", "window", "height", "thickness", "base"] as const) {
    const draft = structuredClone(p);
    if (kind === "window") storeyOf(draft).windows[1]!.width = 0.7;
    if (kind === "height") for (const w of storeyOf(draft).walls) w.height = 3.4;
    if (kind === "thickness")
      for (const w of storeyOf(draft).walls) {
        w.thickness = 0.4;
        w.bodyOffset = 0.2;
      }
    const cached = validateProject(draft, reuse);
    const fresh = validateProject(draft);
    assert.deepEqual(cached, fresh);
    assert.deepEqual(connectedWallSolids(cached, reuse), connectedWallSolids(fresh));
  }
  const invalid = structuredClone(p);
  storeyOf(invalid).windows[1]!.height = 100;
  assert.throws(() => validateProject(invalid, reuse));
});

test("large-group cached endpoint patches remain immutable and equal fresh geometry after detachment", () => {
  const p = connectionGroupFixture(50, 10);
  const pilot = prepareEndpoint(p, "wall-1");
  const original = structuredClone(p);
  for (const x of [154, 152, 4.5, 154]) {
    const point = { x, y: 0 };
    const result = pilot.evaluateGeometry(point);
    const full = updateWall(p, "wall-1", { end: point });
    const ids = new Set(result.patch.replacedIds);
    assert.deepEqual(
      buildPreviewSolid(result.patch.geometry, 0).faces,
      buildPreviewSolid(full, 0).faces.filter((face) => ids.has(face.wallId)),
    );
    assert.deepEqual(pilot.confirm(point), full);
    assert.throws(() => {
      storeyOf(result.patch.geometry).walls[0]!.height = 99;
    });
  }
  assert.deepEqual(p, original);
});
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
test("shortening and oblique targets stay local with same acceptance and geometry", () => {
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
    assert.equal(result.path, "local");
    assert.deepEqual(result.project, full);
  }
});
test("foreign endpoint contacts use full corner and multiple-node rules", () => {
  for (const extra of [1, 2]) {
    const p = tPairFixture();
    for (let i = 0; i < extra; i++)
      storeyOf(p).walls.push({
        ...storeyOf(p).walls[0]!,
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
  storeyOf(p).windows[0]!.width = 9;
  assert.deepEqual(pilot.evaluate({ x: 8, y: 0 }), before);
  assert.throws(() => {
    storeyOf(before.project).walls[0]!.height = 9;
  });
});
