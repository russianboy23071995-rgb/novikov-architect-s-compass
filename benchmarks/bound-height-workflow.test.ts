import test from "node:test";
import assert from "node:assert/strict";
import { boundHeightFixture, fullHeightFixture } from "./bound-height-fixture.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
import { serializeProject, deserializeProject } from "../src/lib/bim/model.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../src/application/history/project-history.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { exportIfc } from "../src/lib/bim/ifc.ts";
import { resolveStoreyLevels } from "../src/domain/storeys/heights.ts";

test("basement signed offsets and mixed join conflicts remain atomic through file and IFC", async () => {
  const base = fullHeightFixture();
  const change = (p: typeof base, storeyId: string, height: number) =>
    setStoreyHeight(p, p, { projectId: p.id, storeyId, height });
  assert.throws(() => change(base, "og", 4), /Eckanschluss/);
  assert.throws(() => change(base, "eg", 2), /Window/);
  const eg = change(base, "eg", 4);
  const next = change(eg, "kg", 3.5);
  const wall = (p: typeof base, id: string) =>
    p.storeys.flatMap((s) => s.walls).find((w) => w.id === id)!;
  assert.equal(wall(next, "kg-a").height, 3.3);
  assert.equal(wall(next, "kg-a").baseOffset, -0.1);
  assert.equal(wall(next, "kg-a").topBinding!.topOffset, -0.1);
  assert.equal(wall(next, "eg-offset").height, 3.9);
  assert.equal(wall(next, "eg-offset").baseOffset, 0.1);
  assert.equal(wall(next, "eg-offset").topBinding!.topOffset, 0.2);
  assert.equal(wall(next, "og-b").topBinding, undefined);
  assert.equal(wall(next, "og-b").height, 2.8);
  assert.deepEqual(
    resolveStoreyLevels(next.storeys, "eg").map((s) => s.elevation),
    [-3.5, 0, 4, 7],
  );
  const h = commitProject(commitProject(createHistory(base), eg), next);
  assert.deepEqual(undoProject(h).present, eg);
  assert.deepEqual(redoProject(undoProject(h)).present, next);
  const loaded = deserializeProject(serializeProject(next));
  assert.deepEqual(loaded, next);
  assert.deepEqual(buildBuildingSolid(loaded), buildBuildingSolid(next));
  const ifc = await exportIfc(loaded, new Date("2026-10-17T00:00:00Z"));
  assert.equal((ifc.match(/=IFCWINDOW\(/g) ?? []).length, 3);
  assert.match(ifc, /IFCBUILDINGSTOREY\([^\n]*\.ELEMENT\.,-3\.5\)/);
  assert.match(ifc, /'Height',\$,IFCLENGTHMEASURE\(3\.9\)/);
  assert.equal((ifc.match(/'Height',\$,IFCLENGTHMEASURE\(3\.3\)/g) ?? []).length, 2);
});

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
