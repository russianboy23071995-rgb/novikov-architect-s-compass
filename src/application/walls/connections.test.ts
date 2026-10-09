import test from "node:test";
import assert from "node:assert/strict";
import {
  addWall,
  addWindow,
  updateWall,
  updateWindow,
  createProject,
  serializeProject,
  deserializeProject,
  validateProject,
} from "../../lib/bim/model.ts";
import { moveElement } from "../direct-edit/transforms.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { connectedWallSolids } from "../../domain/elements/wall/connections.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { projectSnapPrimitives } from "../snapping/project-references.ts";
import { wallPlanHandles } from "../../rendering/viewport/wall-axis.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { createLayerDisplay } from "../../rendering/viewport/layer-display.ts";
const dimensions = { thickness: 0.36, height: 2.8, bodyOffset: 0.18 };
const a = () =>
  addWall(createProject("p", "s"), {
    id: "A",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    ...dimensions,
  });
const pair = () =>
  addWall(a(), { id: "B", start: { x: 3, y: 0 }, end: { x: 3, y: 3 }, ...dimensions });
const opening = {
  id: "window",
  wallId: "A",
  width: 1.2,
  height: 1.35,
  sillHeight: 0.9,
  position: 0.5,
};
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-8, `${a} != ${b}`);

test("acute and obtuse automatic joins preserve shared solids, openings, files and history", async () => {
  for (const angle of [Math.PI / 4, (3 * Math.PI) / 4]) {
    const base = a();
    const joined = addWall(base, {
      id: "B",
      start: { x: 3, y: 0 },
      end: { x: 3 + 3 * Math.cos(angle), y: 3 * Math.sin(angle) },
      ...dimensions,
    });
    const p = addWindow(joined, opening);
    assert.equal(p.storey.wallJoins.length, 1);
    const bodies = connectedWallSolids(p);
    const expectedArea = 6 * 0.36 - 0.36 ** 2 * Math.tan(angle / 2);
    close(buildSolid(p).volume, expectedArea * 2.8 - 1.2 * 1.35 * 0.36);
    for (const body of bodies)
      assert.deepEqual(
        buildSolid(p).faces.filter((f) => f.wallId === body.wallId),
        body.faces,
      );
    assert.deepEqual(deserializeProject(serializeProject(p)), p);
    const history = commitProject(createHistory(base), p);
    assert.deepEqual(undoProject(history).present, base);
    assert.deepEqual(redoProject(undoProject(history)).present, p);
    const before = serializeProject(p);
    assert.throws(() => updateWindow(p, "window", { position: 0.79 }), /Fenster/);
    assert.equal(serializeProject(p), before);
    const ifc = await exportIfc(p);
    assert.equal((ifc.match(/=IFCARBITRARYCLOSEDPROFILEDEF\(/g) ?? []).length, 2);
    assert.equal((ifc.match(/=IFCRELVOIDSELEMENT\(/g) ?? []).length, 1);
    const detached = moveElement(p, { kind: "wall", id: "B" }, { x: 0, y: 1 });
    assert.equal(detached.storey.wallJoins.length, 0);
  }
});

test("drawing automatically stores exact endpoint connection, shared profiles and window cuts", async () => {
  const p = addWindow(pair(), opening),
    before = serializeProject(p);
  assert.equal(p.storey.wallJoins.length, 1);
  const bodies = connectedWallSolids(p),
    solid = buildSolid(p);
  assert.equal(bodies.length, 2);
  for (const body of bodies)
    assert.deepEqual(
      solid.faces.filter((f) => f.wallId === body.wallId),
      body.faces,
    );
  close(solid.volume, (6 * 0.36 - 0.36 ** 2) * 2.8 - 1.2 * 1.35 * 0.36);
  assert.deepEqual(deserializeProject(before), p);
  const ifc = await exportIfc(p, new Date("2026-10-05T12:00:00Z"));
  assert.equal((ifc.match(/=IFCARBITRARYCLOSEDPROFILEDEF\(/g) ?? []).length, 2);
  assert.equal((ifc.match(/=IFCRELVOIDSELEMENT\(/g) ?? []).length, 1);
  assert.equal(serializeProject(p), before);
});

test("moving an axis onto another joins atomically; moving away restores straight caps and undo restores join", () => {
  const base = addWall(a(), { id: "B", start: { x: 4, y: 0 }, end: { x: 4, y: 3 }, ...dimensions });
  const joined = moveElement(base, { kind: "wall", id: "B" }, { x: -1, y: 0 });
  let history = commitProject(createHistory(base), joined);
  assert.equal(history.past.length, 1);
  assert.equal(history.present.storey.wallJoins.length, 1);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)).present, joined);
  const detached = moveElement(joined, { kind: "wall", id: "B" }, { x: 1, y: 0 });
  history = commitProject(history, detached);
  assert.equal(detached.storey.wallJoins.length, 0);
  assert.equal(connectedWallSolids(detached).length, 0);
  close(buildSolid(detached).volume, 6 * 0.36 * 2.8);
  assert.deepEqual(undoProject(history).present, joined);
});

test("both ends of a wall retain their connections in a closed rectangle", () => {
  let p = addWall(pair(), { id: "C", start: { x: 3, y: 3 }, end: { x: 0, y: 3 }, ...dimensions });
  p = addWall(p, { id: "D", start: { x: 0, y: 3 }, end: { x: 0, y: 0 }, ...dimensions });
  assert.equal(p.storey.wallJoins.length, 4);
  const solid = buildSolid(p);
  close(solid.volume, (3 * 3 - (3 - 0.72) ** 2) * 2.8);
  const restored = deserializeProject(serializeProject(p));
  assert.deepEqual(connectedWallSolids(restored), connectedWallSolids(p));
});

test("near endpoints and T contacts do not silently become end joins; ambiguous/unsupported joins reject", () => {
  for (const x of [3 + 1e-10, 1.5]) {
    const p = addWall(a(), { id: "B", start: { x, y: 0 }, end: { x, y: 3 }, ...dimensions });
    assert.equal(p.storey.wallJoins.length, 0);
  }
  const p = pair(),
    before = serializeProject(p);
  assert.throws(
    () => addWall(p, { id: "C", start: { x: 3, y: 0 }, end: { x: 3, y: -3 }, ...dimensions }),
    /Mehrere/,
  );
  assert.throws(
    () => addWall(a(), { id: "B", start: { x: 3, y: 0 }, end: { x: 6, y: 0 }, ...dimensions }),
    /Gehrung/,
  );
  assert.throws(() => updateWall(p, "A", { height: 3 }), /gleiche/);
  assert.equal(serializeProject(p), before);
});

test("opening contact/collision rejects edits and joining, leaving input and history intact", () => {
  const p = addWindow(pair(), opening),
    before = serializeProject(p);
  for (const position of [2.04 / 3, 2.05 / 3])
    assert.throws(() => updateWindow(p, "window", { position }), /Fenster/);
  const detached = addWindow(a(), { ...opening, position: 2.04 / 3 });
  assert.throws(
    () => addWall(detached, { id: "B", start: { x: 3, y: 0 }, end: { x: 3, y: 3 }, ...dimensions }),
    /Fenster/,
  );
  assert.equal(detached.storey.wallJoins.length, 0);
  assert.equal(serializeProject(p), before);
});

test("V5 migration does not auto-connect old touching walls; forged/stale/duplicate V6 links fail", () => {
  const p = pair();
  const { references, wallTJunctions, wallJoins, ...storey } = p.storey;
  const { assets, hatchPatterns, ...legacyRoot } = p;
  const old = { ...legacyRoot, schemaVersion: 5, storey };
  const migrated = loadProjectData(old);
  assert.equal(migrated.schemaVersion, 11);
  assert.deepEqual(migrated.storey.wallJoins, []);
  assert.deepEqual(migrated.storey.walls, p.storey.walls);
  assert.equal(updateWall(migrated, "A", { height: 3 }).storey.wallJoins.length, 0);
  assert.throws(() => validateProject(old));
  assert.throws(() =>
    validateProject({ ...p, storey: { ...p.storey, wallJoins: [...wallJoins, ...wallJoins] } }),
  );
  const stale = structuredClone(p);
  stale.storey.walls[1]!.start.x = 4;
  assert.throws(() => validateProject(stale), /übereinstimmen/);
});

test("snapping follows real connected corners while axis handles stay exact; visibility never changes physical joins", () => {
  const p = pair(),
    bodies = connectedWallSolids(p);
  const refs = projectSnapPrimitives(p).references;
  const joined = refs.filter((r) => r.entityId === "A" && r.feature?.startsWith("join-corner"));
  assert.equal(joined.length, 4);
  for (const r of joined)
    assert.ok(bodies[0]!.contour.some((c) => c.x === r.point.x && c.y === r.point.y));
  assert.equal(wallPlanHandles(p.storey.walls[0]!, true).length, 2);
  const hidden = structuredClone(p);
  const layer = hidden.layers.find((l) => l.id !== hidden.defaultLayerIds.wall)!;
  hidden.storey.walls[1]!.layerId = layer.id;
  const policy = createLayerVisibilityPolicy(hidden, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [layer.id],
  });
  const display = createLayerDisplay(hidden, policy, policy.context);
  assert.deepEqual(
    display.surfaces.faces,
    buildSolid(hidden).faces.filter((f) => f.wallId === "A"),
  );
});
