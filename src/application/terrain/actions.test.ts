import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addTerrain, projectTerrain, updateTerrain } from "./actions.ts";
import {
  terrainFloor,
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
