import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addStair, defaultStairLayerId, updateStair } from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { stairGeometry, stairOutline, stairProfile } from "../../domain/elements/stair/model.ts";
import { stairBody } from "../../domain/elements/stair/body.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";

// docs/TREPPE.md, TR1.
function withStair() {
  const p = createStandardProject("p", "eg", "og");
  return addStair(p, { id: "t1", start: { x: 1, y: 2 } });
}
const stair = (p: ReturnType<typeof withStair>) => storeyOf(p).stairs![0]!;

test("a stair climbs to the storey above with values after DIN 18065", () => {
  const p = withStair();
  const height = storeyOf(p).height!;
  assert.equal(stair(p).layerId, defaultStairLayerId(p));
  assert.equal(p.layers.find((l) => l.id === stair(p).layerId)!.name, "Treppe");
  const g = stairGeometry(stair(p), height)!;
  assert.equal(g.rise, height);
  assert.equal(g.riserCount, Math.round(height / 0.175));
  assert.ok(Math.abs(g.riser * g.riserCount - height) < 1e-9);
  assert.equal(g.treadCount, g.riserCount - 1);
  // Tread from the step rule 2h + a = 63 cm.
  assert.ok(Math.abs(g.stepRule - 0.63) < 0.001);
  assert.deepEqual(g.issues, []);
  assert.ok(Math.abs(g.run - g.treadCount * g.tread) < 1e-9);
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
});

test("every value can be fixed; the check reports what does not fit", () => {
  const p = updateStair(withStair(), "t1", {
    riserCount: 12,
    tread: 0.22,
    width: 0.7,
    height: 3,
  });
  const g = stairGeometry(stair(p), null)!;
  assert.equal(stair(p).topBinding, undefined);
  assert.equal(g.riserCount, 12);
  assert.equal(g.riser, 0.25);
  assert.equal(g.tread, 0.22);
  assert.equal(g.issues.length, 4); // riser, tread, width, step rule
  assert.match(g.issues.join(" "), /Steigung 25 cm/);
  const back = updateStair(p, "t1", { riserCount: undefined, tread: undefined });
  assert.equal(stair(back).riserCount, undefined);
  assert.equal(stair(back).tread, undefined);
  const other = updateStair(withStair(), "t1", { ruleSet: "other", riserTarget: 0.2 });
  assert.match(stairGeometry(stair(other), storeyOf(other).height)!.issues.join(" "), /Steigung/);
  assert.throws(() => updateStair(withStair(), "nope", { width: 1 }), /Unbekannte Treppe/);
});

test("profile, outline and solid: closed flight with the stair slab below", () => {
  const g = stairGeometry(
    { riserTarget: 0.175, width: 1, ruleSet: "residential", baseOffset: 0, height: 0.7 },
    null,
  )!;
  assert.equal(g.riserCount, 4);
  const profile = stairProfile(g, 0.16);
  assert.deepEqual(profile.at(-1), { x: 0, y: 0 });
  assert.ok(profile.some((q) => q.x === g.run && Math.abs(q.y - 0.7) < 1e-9));
  const outline = stairOutline({ start: { x: 0, y: 0 }, direction: 90, width: 1 }, 2);
  assert.ok(Math.abs(outline[1]!.y - 2) < 1e-9 && Math.abs(outline[1]!.x - 0.5) < 1e-9);
  const p = withStair();
  const body = stairBody(stair(p), 0, storeyOf(p).height)!;
  assert.ok(body.volume > 0 && body.faces.every((f) => f.stair && f.wallId === "t1"));
  const z = body.faces.flatMap((f) => f.vertices.map((v) => v[2]));
  assert.ok(Math.abs(Math.max(...z) - storeyOf(p).height!) < 1e-9);
  assert.ok(buildBuildingSolid(p).faces.some((f) => "stair" in f && f.wallId === "t1"));
});

test("schema 39 files get the Treppe layer, smuggled stairs are refused; IFC and delete", async () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 41);
  const stored = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  stored.layers = stored.layers.filter((l: { name: string }) => l.name !== "Treppe");
  const loaded = loadProjectData({ ...stored, schemaVersion: 39 });
  assert.ok(loaded.layers.some((l) => l.id === "layer:stair" && l.name === "Treppe"));
  assert.throws(() =>
    loadProjectData({ ...JSON.parse(serializeProject(withStair())), schemaVersion: 39 }),
  );
  const ifc = await exportIfc(withStair(), new Date("2026-10-31T12:00:00Z"));
  assert.equal(ifc.split("\n").filter((l) => l.includes("=IFCSTAIR(")).length, 1);
  assert.equal(ifc.split("\n").filter((l) => l.includes("=IFCSTAIRFLIGHT(")).length, 1);
  assert.ok(ifc.includes("'Pset_StairCommon'"));
  assert.ok(ifc.includes("'Check',$,IFCTEXT('DIN 18065 eingehalten')"));
  const removed = previewDeleteSelection(
    withStair(),
    [{ kind: "stair", id: "t1" }],
    undefined,
  ).result;
  assert.equal(storeyOf(removed).stairs!.length, 0);
});
