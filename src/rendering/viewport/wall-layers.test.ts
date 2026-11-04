import test from "node:test";
import assert from "node:assert/strict";
import { assemblyLibraryOf, insulationZigzag, wallLayerBands } from "./wall-layers.ts";
import { derivePlanScene, planRunJoints } from "./plan-scene.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { setWallAssembly } from "../../application/walls/assembly.ts";
import { addWall } from "../../application/walls/actions.ts";
import { createProject } from "../../application/projects/create.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { validateProject } from "../../domain/project/schema.ts";

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

// docs/WALL_JUNCTIONS.md, L09 U2: the incoming core runs through the host's cover layers.
function tee(from: number, assembly = "assembly-ks240-innen") {
  let p = addWall(createProject("p", "eg"), {
    id: "host",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  p = addWall(p, {
    id: "in",
    start: { x: 3, y: from },
    end: { x: 3, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  const raw = structuredClone(p);
  storeyOf(raw).wallTJunctions = [{ hostWallId: "host", incoming: { wallId: "in", endpoint: 1 } }];
  return setWallAssembly(setWallAssembly(validateProject(raw), ["host"], KS), ["in"], assembly);
}
const near = (a: { x: number; y: number }, x: number, y: number) =>
  Math.abs(a.x - x) < 1e-9 && Math.abs(a.y - y) < 1e-9;

test("T joint: the incoming core runs through the host plaster to the host core", () => {
  // Host KS 17,5 + WDVS 16, inner plaster 1,5 cm on its left (+y) face; KS 24 arrives from +y.
  const joints = derivePlanScene(tee(3), () => true).layerJoints;
  assert.equal(joints.length, 1);
  const [joint] = joints;
  assert.deepEqual(
    joint!.bands.map((b) => b.material.id),
    ["material-kalksandstein"],
  );
  // Incoming frame: x from its body start (3, 3) towards the host, y = world x − 3.
  // Core ±0,12 m; host face at world y 0,18, host core face at 0,165.
  const [a, b, c, d] = joint!.profile;
  assert.ok(near(a!, 2.82, -0.12) && near(b!, 2.835, -0.12), JSON.stringify(joint!.profile));
  assert.ok(near(c!, 2.835, 0.12) && near(d!, 2.82, 0.12));
  // From the outside (−y) it passes plaster and insulation: 1 + 16 cm.
  const outside = derivePlanScene(tee(-3), () => true).layerJoints[0]!;
  const depth = Math.abs(outside.profile[1]!.x - outside.profile[0]!.x);
  assert.ok(Math.abs(depth - 0.17) < 1e-9, String(depth));
});

test("T joint keeps the plain joint unless both walls have a load-bearing layer", () => {
  assert.equal(
    derivePlanScene(setWallAssembly(tee(3), ["in"], null), () => true).layerJoints.length,
    0,
  );
  assert.equal(
    derivePlanScene(setWallAssembly(tee(3), ["host"], null), () => true).layerJoints.length,
    0,
  );
  // Drywall marks its stud zone load-bearing: that zone runs through like a core.
  assert.deepEqual(
    derivePlanScene(tee(3, "assembly-tb100"), () => true).layerJoints[0]!.bands.map(
      (b) => b.material.id,
    ),
    ["material-daemmung"],
  );
  // Hidden by the layer filter: no joint for a wall that is not drawn.
  assert.equal(derivePlanScene(tee(3), (id) => id !== "in").layerJoints.length, 0);
});

test("T joint is drawn once, by the wall run of the later of its two walls", () => {
  const scene = derivePlanScene(tee(3), () => true);
  const order = scene.plan.walls.map((w) => w.id);
  const later = order.indexOf("in") > order.indexOf("host") ? "in" : "host";
  const earlier = later === "in" ? "host" : "in";
  assert.equal(planRunJoints(scene, [later]).length, 1);
  assert.equal(planRunJoints(scene, [earlier]).length, 0);
  assert.equal(planRunJoints(scene, order).length, 1);
  // Runs that hold neither wall draw no joint.
  assert.equal(planRunJoints(scene, []).length, 0);
});
