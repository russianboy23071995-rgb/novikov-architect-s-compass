import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createDrawing } from "../../application/drawing/actions.ts";
import { flipWallAssembly, setWallAssembly } from "../../application/walls/assembly.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";

// docs/WANDAUFBAU.md, SA4.
const date = new Date("2026-11-01T12:00:00Z");
const rows = (ifc: string, entity: string) =>
  ifc.split("\n").filter((line) => line.includes(`=${entity}(`));
const ref = (line: string) => line.slice(0, line.indexOf("="));

function project() {
  const example = createExampleProject();
  const two = createDrawing(example, example, "wall-2", {
    kind: "wall",
    start: { x: 20, y: 0 },
    end: { x: 24, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  const three = createDrawing(two, two, "wall-3", {
    kind: "wall",
    start: { x: 20, y: 5 },
    end: { x: 24, y: 5 },
    thickness: 0.24,
    height: 2.8,
  });
  return flipWallAssembly(
    setWallAssembly(three, ["wall-1", "wall-2", "wall-3"], "assembly-ks175-wdvs160"),
    ["wall-3"],
  );
}

test("walls with a build-up carry their material layers; materials and sets are written once", async () => {
  const ifc = await exportIfc(project(), date);
  const materials = rows(ifc, "IFCMATERIAL");
  // Putz, Wärmedämmung, Kalksandstein: Putz is used twice and written once.
  assert.equal(materials.length, 3);
  assert.match(materials[0]!, /\('Putz',/);
  assert.match(materials[1]!, /\('W.*rmed.*mmung',/);
  assert.match(materials[2]!, /\('Kalksandstein',/);
  const layers = rows(ifc, "IFCMATERIALLAYER");
  assert.equal(layers.length, 4);
  assert.match(layers[0]!, /,0\.01,\.U\.,/);
  assert.match(layers[1]!, /'Insulation'/);
  assert.match(layers[2]!, /,0\.175,\.U\.,.*'LoadBearing'/);
  const sets = rows(ifc, "IFCMATERIALLAYERSET");
  assert.equal(sets.length, 1);
  assert.match(sets[0]!, /'KS 17,5 \+ WDVS 16'/);
  // Usage along the wall's y axis: first layer on the right face (−t/2), flipped from +t/2.
  const usages = rows(ifc, "IFCMATERIALLAYERSETUSAGE");
  assert.equal(usages.length, 2);
  assert.match(usages[0]!, /\.AXIS2\.,\.POSITIVE\.,-0\.18,\$/);
  assert.match(usages[1]!, /\.AXIS2\.,\.NEGATIVE\.,0\.18,\$/);
  const walls = rows(ifc, "IFCWALL").map(ref);
  const rels = rows(ifc, "IFCRELASSOCIATESMATERIAL");
  assert.equal(rels.length, 2);
  assert.ok(rels[0]!.includes(`(${walls[0]},${walls[1]}),${ref(usages[0]!)}`));
  assert.ok(rels[1]!.includes(`(${walls[2]}),${ref(usages[1]!)}`));
  // Stable: the same export twice gives the same file.
  assert.equal(await exportIfc(project(), date), ifc);
});

test("without a build-up no material is written", async () => {
  const ifc = await exportIfc(createExampleProject(), date);
  assert.equal(rows(ifc, "IFCMATERIAL").length, 0);
  assert.equal(rows(ifc, "IFCRELASSOCIATESMATERIAL").length, 0);
});
