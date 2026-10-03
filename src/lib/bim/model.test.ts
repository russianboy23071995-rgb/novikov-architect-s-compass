import assert from "node:assert/strict";
import { test } from "node:test";
import {
  addWall,
  addWindow,
  createProject,
  deserializeProject,
  serializeProject,
  updateWall,
  updateWindow,
  wallLength,
  windowCentre,
} from "./model.ts";
import type { Wall, BimWindow } from "./model.ts";

const wall: Wall = {
  id: "wall-1",
  start: { x: 0, y: 0 },
  end: { x: 3, y: 0 },
  thickness: 0.36,
  height: 2.8,
};
const opening: BimWindow = {
  id: "window-1",
  wallId: wall.id,
  width: 1.2,
  height: 1.35,
  sillHeight: 0.9,
  position: 0.5,
};
const withWall = () => addWall(createProject("project-1", "storey-1"), wall);
const fixture = () => addWindow(withWall(), opening);

test("creates the 3.00 x 0.36 x 2.80 m wall with a centred 1.20 m window", () => {
  const project = fixture();
  assert.equal(project.unit, "m");
  assert.deepEqual(project.storey.walls, [wall]);
  assert.deepEqual(project.storey.windows, [opening]);
  assert.equal(wallLength(project.storey.walls[0]!), 3);
  assert.deepEqual(windowCentre(project, opening.id), { x: 1.5, y: 0 });
});

test("extending the wall preserves IDs and keeps the window centred", () => {
  const original = fixture();
  const changed = updateWall(original, wall.id, { end: { x: 6, y: 0 } });
  assert.equal(changed.storey.walls[0]!.id, wall.id);
  assert.deepEqual(changed.storey.windows, [opening]);
  assert.deepEqual(windowCentre(changed, opening.id), { x: 3, y: 0 });
  assert.deepEqual(windowCentre(original, opening.id), { x: 1.5, y: 0 });
});

test("relative centres work on translated, diagonal and reversed walls", () => {
  const project = updateWall(fixture(), wall.id, { start: { x: 5, y: 6 }, end: { x: 2, y: 2 } });
  assert.equal(wallLength(project.storey.walls[0]!), 5);
  assert.deepEqual(windowCentre(project, opening.id), { x: 3.5, y: 4 });
  assert.deepEqual(
    windowCentre(updateWindow(project, opening.id, { position: 0.25 }), opening.id),
    { x: 4.25, y: 5 },
  );
});

test("updates wall dimensions and window parameters without changing IDs", () => {
  const project = updateWall(fixture(), wall.id, { thickness: 0.4, height: 3 });
  const changed = updateWindow(project, opening.id, {
    width: 1,
    height: 1.5,
    sillHeight: 1,
    position: 0.6,
  });
  assert.equal(changed.storey.walls[0]!.thickness, 0.4);
  assert.deepEqual(changed.storey.windows[0], {
    ...opening,
    width: 1,
    height: 1.5,
    sillHeight: 1,
    position: 0.6,
  });
  const other = addWall(changed, { ...wall, id: "wall-2" });
  assert.equal(
    updateWindow(other, opening.id, { wallId: "wall-2" }).storey.windows[0]!.wallId,
    "wall-2",
  );
});

for (const invalid of [0, -1, NaN, Infinity, -Infinity]) {
  test(`rejects nonpositive/nonfinite dimensions: ${invalid}`, () => {
    for (const field of ["thickness", "height"] as const)
      assert.throws(() => addWall(createProject("p", "s"), { ...wall, [field]: invalid }));
    for (const field of ["width", "height"] as const)
      assert.throws(() => addWindow(withWall(), { ...opening, [field]: invalid }));
  });
}

test("rejects degenerate/nonfinite geometry and invalid window placement", () => {
  for (const end of [
    { x: 0, y: 0 },
    { x: NaN, y: 0 },
    { x: Infinity, y: 0 },
  ])
    assert.throws(() => updateWall(fixture(), wall.id, { end }));
  for (const position of [-0.1, 1.1, NaN, Infinity, 0, 1])
    assert.throws(() => updateWindow(fixture(), opening.id, { position }));
  for (const sillHeight of [-1, NaN, Infinity, 2])
    assert.throws(() => updateWindow(fixture(), opening.id, { sillHeight }));
  assert.throws(() => addWindow(withWall(), { ...opening, width: 3.01 }));
  assert.throws(() => updateWindow(fixture(), opening.id, { width: 4 }));
  assert.throws(() =>
    updateWall(fixture(), wall.id, {
      start: { x: -Number.MAX_VALUE, y: 0 },
      end: { x: Number.MAX_VALUE, y: 0 },
    }),
  );
});

test("accepts openings exactly fitting the wall and floor-level sills", () => {
  assert.doesNotThrow(() =>
    addWindow(withWall(), { ...opening, width: 3, height: 2.8, sillHeight: 0 }),
  );
});

test("invalid wall changes are atomic and revalidate hosted windows", () => {
  const original = fixture();
  const before = serializeProject(original);
  assert.throws(() => updateWall(original, wall.id, { end: { x: 1, y: 0 } }));
  assert.throws(() => updateWall(original, wall.id, { height: 2 }));
  assert.equal(serializeProject(original), before);
});

test("rejects duplicate/empty IDs and missing references or update targets", () => {
  assert.throws(() => createProject("", "s"));
  assert.throws(() => createProject("same", "same"));
  assert.throws(() => addWall(fixture(), wall));
  assert.throws(() => addWindow(fixture(), opening));
  assert.throws(() => addWindow(withWall(), { ...opening, wallId: "missing" }));
  assert.throws(() => updateWindow(fixture(), opening.id, { wallId: "missing" }));
  assert.throws(() => updateWall(fixture(), "missing", {}));
  assert.throws(() => updateWindow(fixture(), "missing", {}));
  assert.throws(() => windowCentre(fixture(), "missing"));
});

test("JSON round-trip preserves IDs, units, geometry and editable relationships", () => {
  const original = fixture();
  const restored = deserializeProject(serializeProject(original));
  assert.deepEqual(restored, original);
  assert.notEqual(restored.storey.walls[0], original.storey.walls[0]);
  assert.deepEqual(
    windowCentre(updateWall(restored, wall.id, { end: { x: 8, y: 0 } }), opening.id),
    { x: 4, y: 0 },
  );
});

test("rejects malformed JSON, unsupported versions/units and corrupt saved models", () => {
  for (const json of [
    "{",
    "null",
    "[]",
    "{}",
    JSON.stringify({ ...fixture(), schemaVersion: 2 }),
    JSON.stringify({ ...fixture(), unit: "mm" }),
  ])
    assert.throws(() => deserializeProject(json));
  const corrupt = fixture();
  corrupt.storey.windows[0]!.width = 4;
  assert.throws(() => deserializeProject(JSON.stringify(corrupt)));
  assert.throws(() => serializeProject(corrupt));
  corrupt.storey.windows[0]!.wallId = "missing";
  assert.throws(() => deserializeProject(JSON.stringify(corrupt)));
});

test("caller-owned inputs are detached from returned snapshots", () => {
  const input = { ...wall, start: { ...wall.start } };
  const project = addWall(createProject("p", "s"), input);
  input.start.x = 100;
  assert.equal(project.storey.walls[0]!.start.x, 0);
});
