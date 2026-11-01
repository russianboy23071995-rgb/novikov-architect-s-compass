import test from "node:test";
import assert from "node:assert/strict";
import { assemblyLibraryOf, insulationZigzag, wallLayerBands } from "./wall-layers.ts";
import { derivePlanScene } from "./plan-scene.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { setWallAssembly } from "../../application/walls/assembly.ts";

// docs/WANDAUFBAU.md, SA2.
const library = assemblyLibraryOf({});
const KS = "assembly-ks175-wdvs160";

test("bands run from the right face to the left face and end exactly on the faces", () => {
  const bands = wallLayerBands({ thickness: 0.36, assemblyId: KS }, library)!;
  assert.deepEqual(
    bands.map((b) => b.material.id),
    ["material-putz", "material-daemmung", "material-kalksandstein", "material-putz"],
  );
  assert.equal(bands[0]!.from, -0.18);
  assert.ok(Math.abs(bands[1]!.from - (-0.18 + 0.01)) < 1e-12);
  assert.equal(bands.at(-1)!.to, 0.18);
  bands.slice(1).forEach((b, i) => assert.equal(b.from, bands[i]!.to));
  const flipped = wallLayerBands(
    { thickness: 0.36, assemblyId: KS, assemblyFlipped: true },
    library,
  )!;
  assert.equal(flipped[1]!.material.id, "material-kalksandstein");
  assert.equal(wallLayerBands({ thickness: 0.36 }, library), null);
});

test("the insulation zigzag spans the layer, one tooth per layer thickness", () => {
  const points = insulationZigzag({ from: 0, to: 0.1 }, 0, 0.5);
  assert.ok(points[0]!.x <= 0 && points.at(-1)!.x >= 0.5);
  assert.ok(points.every((p, i) => p.y === (i % 2 === 0 ? 0 : 0.1)));
  assert.ok(Math.abs(points[1]!.x - points[0]!.x - 0.1) < 1e-12);
});

test("the plan scene carries the layers of walls with a build-up only", () => {
  const plain = createExampleProject();
  assert.equal(derivePlanScene(plain, () => true).wallLayers.size, 0);
  const built = setWallAssembly(plain, ["wall-1"], KS);
  assert.equal(derivePlanScene(built, () => true).wallLayers.get("wall-1")!.length, 4);
});
