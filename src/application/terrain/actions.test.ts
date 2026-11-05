import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import {
  addTerrain,
  addTerrainPoint,
  moveTerrainPoint,
  projectTerrain,
  terrainSettings,
  updateTerrain,
} from "./actions.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { addSection } from "../sections/actions.ts";
import { sectionDrawing } from "../../rendering/viewport/section-drawing.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import {
  terrainFloor,
  terrainContours,
  terrainHeightAt,
  terrainMesh,
  terrainSchema,
} from "../../domain/elements/terrain/model.ts";
import { terrainBody } from "../../rendering/viewport/terrain-solid.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { deserializeProject, serializeProject } from "../../lib/bim/model.ts";

// docs/GELAENDE.md, G1.
const square = (z = 0) => [
  { x: 0, y: 0, z },
  { x: 10, y: 0, z },
  { x: 10, y: 10, z },
  { x: 0, y: 10, z },
];
const base = { id: "g", layerId: "l", depth: 1, points: [] };

test("a flat square: closed body, exact volume, heights inside only", () => {
  const terrain = { ...base, outline: square(2) };
  const { faces, volume } = terrainBody(terrain);
  assert.ok(Math.abs(volume - 100) < 1e-6, String(volume));
  assert.ok(faces.every((f) => f.terrain && f.wallId === "g"));
  assert.equal(terrainFloor(terrain), 1);
  assert.equal(terrainHeightAt(terrain, { x: 5, y: 5 }), 2);
  assert.equal(terrainHeightAt(terrain, { x: 11, y: 5 }), null);
});

test("a height point lifts the surface; the corners stay", () => {
  const terrain = { ...base, outline: square(), points: [{ x: 5, y: 5, z: 3 }] };
  assert.ok(Math.abs(terrainHeightAt(terrain, { x: 5, y: 5 })! - 3) < 1e-9);
  assert.ok(Math.abs(terrainHeightAt(terrain, { x: 0, y: 0 })!) < 1e-9);
  const middle = terrainHeightAt(terrain, { x: 2.5, y: 5 })!;
  assert.ok(middle > 0 && middle < 3);
  assert.ok(terrainBody(terrain).volume > 100);
  for (const [a, b, c] of terrainMesh(terrain))
    assert.ok((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0);
});

test("a concave outline keeps its notch free, a slope runs along an edge", () => {
  const outline = [
    { x: 0, y: 0, z: 0 },
    { x: 10, y: 0, z: 2 },
    { x: 10, y: 10, z: 2 },
    { x: 5, y: 10, z: 1 },
    { x: 5, y: 5, z: 1 },
    { x: 0, y: 5, z: 0 },
  ];
  const terrain = { ...base, outline };
  assert.equal(terrainHeightAt(terrain, { x: 2, y: 8 }), null);
  assert.ok(Math.abs(terrainHeightAt(terrain, { x: 5, y: 0 })! - 1) < 1e-9);
  const area = terrainMesh(terrain).reduce(
    (sum, [a, b, c]) => sum + ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2,
    0,
  );
  assert.ok(Math.abs(area - 75) < 1e-6, String(area));
});

test("hundreds of points stay quick and complete", () => {
  const points = Array.from({ length: 900 }, (_, i) => ({
    x: 0.3 + (i % 30) * 0.32,
    y: 0.3 + Math.floor(i / 30) * 0.32,
    z: Math.sin(i),
  }));
  const terrain = { ...base, outline: square(), points };
  const area = terrainMesh(terrain).reduce(
    (sum, [a, b, c]) => sum + ((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2,
    0,
  );
  assert.ok(Math.abs(area - 100) < 1e-6, String(area));
});

test("points outside the outline and crossing outlines are refused", () => {
  assert.throws(() =>
    terrainSchema.parse({ ...base, outline: square(), points: [{ x: 20, y: 5, z: 0 }] }),
  );
  const crossing = [
    { x: 0, y: 0, z: 0 },
    { x: 5, y: 5, z: 0 },
    { x: 5, y: 0, z: 0 },
    { x: 0, y: 5, z: 0 },
  ];
  assert.throws(() => terrainSchema.parse({ ...base, outline: crossing }));
});

test("one terrain per project, in the ground storey, part of the 3D building", () => {
  let p = createStandardProject("p", "eg", "og");
  assert.equal(projectTerrain(p), null);
  p = addTerrain(p, { id: "g", outline: square() });
  assert.throws(() => addTerrain(p, { id: "h", outline: square() }));
  assert.equal(projectTerrain(p)?.depth, 1);
  const solid = buildBuildingSolid(p);
  assert.ok(solid.faces.some((f) => f.wallId === "g" && f.terrain));
  p = updateTerrain(p, { points: [{ x: 5, y: 5, z: 1 }] });
  assert.equal(projectTerrain(p)?.points.length, 1);
  const back = deserializeProject(serializeProject(p));
  assert.deepEqual(projectTerrain(back), projectTerrain(p));
  assert.equal(back.schemaVersion, PROJECT_SCHEMA_VERSION);
});

test("file 63: loads without terrain, a terrain is refused", () => {
  const p = addTerrain(createStandardProject("p", "eg", "og"), { id: "g", outline: square() });
  const old = JSON.parse(serializeProject(p));
  old.schemaVersion = 63;
  assert.throws(() => deserializeProject(JSON.stringify(old)));
  for (const storey of old.storeys) delete storey.terrains;
  assert.equal(deserializeProject(JSON.stringify(old)).schemaVersion, PROJECT_SCHEMA_VERSION);
});

test("contours: every level between the heights, none on a flat surface", () => {
  const hill = { ...base, outline: square(), points: [{ x: 5, y: 5, z: 2 }] };
  const levels = new Set(terrainContours(hill, 0.5).map((c) => c.level));
  for (const level of [0.5, 1, 1.5]) assert.ok(levels.has(level));
  assert.equal(terrainContours({ ...base, outline: square(1.2) }, 0.5).length, 0);
});

test("tool path: points inside only, drawn first, snap targets, pickup", () => {
  let p = addTerrain(createStandardProject("p", "eg", "og"), { id: "g", outline: square() });
  p = addTerrainPoint(p, { x: 5, y: 5, z: 1 });
  assert.throws(() => addTerrainPoint(p, { x: 15, y: 5, z: 1 }));
  const runs = planSceneRuns(
    derivePlanScene(p, () => true),
    [],
  );
  assert.equal(runs[0]!.kind, "terrain");
  const features = projectSnapReferences(p)
    .filter((r) => r.entityId === "g")
    .map((r) => r.feature);
  assert.ok(features.includes("point-0") && features.includes("vertex-0"));
  const picked = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "terrain",
    id: "g",
  });
  assert.deepEqual(picked, { tool: "terrain", values: terrainSettings(projectTerrain(p)!) });
});

test("section and IFC: the terrain is cut, seen and handed over", async () => {
  let p = addTerrain(createStandardProject("p", "eg", "og"), {
    id: "g",
    outline: square(),
    points: [{ x: 5, y: 5, z: 2 }],
  });
  p = addSection(p, {
    id: "s",
    start: { x: -1, y: 5 },
    end: { x: 11, y: 5 },
    look: "left",
  });
  const drawing = sectionDrawing(
    p,
    p.sections!.find((s) => s.id === "s")!,
  );
  const cut = drawing.cuts.find((c) => c.id === "g");
  assert.ok(cut, JSON.stringify(drawing.cuts.map((c) => c.id)));
  const heights = cut.loops.flat().map((q) => q.y);
  assert.equal(cut.loops.length, 1);
  assert.ok(Math.abs(Math.max(...heights) - 2) < 1e-4);
  assert.ok(Math.abs(Math.min(...heights) + 1) < 1e-4);
  assert.equal(storeyOf(p).terrains?.length, 1);
  const ifc = await exportIfc(p, new Date("2026-11-05T12:00:00Z"));
  assert.ok(/=IFCGEOGRAPHICELEMENT\(.*\.TERRAIN\.\)/.test(ifc));
  assert.ok(ifc.includes("=IFCTRIANGULATEDFACESET("));
});

test("moving: a point keeps its height, the rules still hold", () => {
  let p = addTerrain(createStandardProject("p", "eg", "og"), { id: "g", outline: square(1) });
  p = addTerrainPoint(p, { x: 5, y: 5, z: 3 });
  p = moveTerrainPoint(p, "points", 0, { x: 6, y: 4 });
  assert.deepEqual(projectTerrain(p)?.points[0], { x: 6, y: 4, z: 3 });
  p = moveTerrainPoint(p, "outline", 2, { x: 12, y: 12 });
  assert.deepEqual(projectTerrain(p)?.outline[2], { x: 12, y: 12, z: 1 });
  assert.throws(() => moveTerrainPoint(p, "points", 0, { x: 50, y: 4 }));
  // A corner that leaves a height point outside is refused too.
  assert.throws(() => moveTerrainPoint(p, "outline", 2, { x: 1, y: 1 }));
  assert.throws(() => moveTerrainPoint(p, "points", 9, { x: 1, y: 1 }));
});
