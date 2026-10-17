import test from "node:test";
import assert from "node:assert/strict";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
import { serializeProject, deserializeProject } from "../src/lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { resolveStoreyLevels } from "../src/domain/storeys/heights.ts";

test("two inhabited bound storeys retain joins and windows through height edit, history, file and IFC", async () => {
  const base = boundHeightFixture();
  const next = setStoreyHeight(base, base, { projectId: base.id, storeyId: "eg", height: 4 });
  assert.deepEqual(
    next.storeys.slice(0, 2).map((s) => s.walls.map((w) => w.height)),
    [
      [3.8, 3.8],
      [2.8, 2.8],
    ],
  );
  assert.deepEqual(
    resolveStoreyLevels(next.storeys, next.groundStoreyId).map((s) => s.elevation),
    [0, 4, 7],
  );
  for (let i = 0; i < 2; i++) {
    assert.equal(next.storeys[i]!.wallJoins.length, 1);
    assert.deepEqual(next.storeys[i]!.wallJoins, base.storeys[i]!.wallJoins);
    assert.deepEqual(next.storeys[i]!.windows, base.storeys[i]!.windows);
  }
  assert.equal(buildBuildingSolid(next).max[2], 6.8);
  const history = commitProject(createHistory(base), next);
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, base);
  assert.deepEqual(redoProject(undoProject(history)).present, next);
  const text = serializeProject(next);
  const stored = JSON.parse(text);
  assert.ok(
    stored.storeys
      .slice(0, 2)
      .every((s: { walls: object[] }) => s.walls.every((w) => !("height" in w))),
  );
  const loaded = deserializeProject(text);
  assert.deepEqual(loaded, next);
  assert.deepEqual(buildBuildingSolid(loaded), buildBuildingSolid(next));
  const timestamp = new Date("2026-10-17T00:00:00Z");
  const ifc = await exportIfc(loaded, timestamp);
  assert.equal(ifc, await exportIfc(next, timestamp));
  assert.equal((ifc.match(/=IFCWINDOW\(/g) ?? []).length, 2);
  assert.equal((ifc.match(/=IFCEXTRUDEDAREASOLID\([^\n]*,3\.8\);/g) ?? []).length, 2);
  assert.equal((ifc.match(/=IFCEXTRUDEDAREASOLID\([^\n]*,2\.8\);/g) ?? []).length, 2);
  assert.throws(
    () => setStoreyHeight(loaded, loaded, { projectId: loaded.id, storeyId: "eg", height: 2 }),
    /window|height/i,
  );
  assert.equal(serializeProject(loaded), text);
});
