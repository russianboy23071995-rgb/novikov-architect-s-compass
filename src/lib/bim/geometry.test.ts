import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSolid, initialCamera, projectPoint } from "./geometry.ts";
import type { Solid, Vec3 } from "./geometry.ts";
import { addWall, addWindow, createProject, updateWall, updateWindow } from "./model.ts";

const wall = { id: "w", start: { x: 0, y: 0 }, end: { x: 3, y: 0 }, thickness: 0.36, height: 2.8 };
const opening = { id: "o", wallId: "w", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 };
const bare = () => addWall(createProject("p", "s"), wall);
const fixture = () => addWindow(bare(), opening);
const close = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: Vec3, b: Vec3) => a.reduce((sum, v, i) => sum + v * b[i]!, 0);
const subtract = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
function meshVolume(solid: Solid) {
  return solid.faces.reduce((sum, face) => {
    return (
      sum +
      face.vertices
        .slice(1, -1)
        .reduce((v, b, i) => v + dot(face.vertices[0]!, cross(b, face.vertices[i + 2]!)) / 6, 0)
    );
  }, 0);
}
function blocksOpening(solid: Solid, x: number, z: number) {
  return solid.faces.some(
    (f) =>
      Math.abs(f.normal[1]) > 0.99 &&
      x > Math.min(...f.vertices.map((p) => p[0])) &&
      x < Math.max(...f.vertices.map((p) => p[0])) &&
      z > Math.min(...f.vertices.map((p) => p[2])) &&
      z < Math.max(...f.vertices.map((p) => p[2])),
  );
}

test("solid wall has six correctly oriented faces, physical bounds and volume", () => {
  const solid = buildSolid(bare());
  assert.equal(solid.faces.length, 6);
  assert.deepEqual(solid.min, [0, -0.18, 0]);
  assert.deepEqual(solid.max, [3, 0.18, 2.8]);
  close(solid.volume, 3 * 0.36 * 2.8);
  close(meshVolume(solid), solid.volume);
  for (const face of solid.faces) {
    const [a, b, c] = face.vertices;
    assert.ok(dot(cross(subtract(b!, a!), subtract(c!, a!)), face.normal) > 0);
  }
});

test("reference window is a through opening with sill, lintel and side reveals", () => {
  const solid = buildSolid(fixture());
  close(solid.volume, (3 * 2.8 - 1.2 * 1.35) * 0.36);
  close(meshVolume(solid), solid.volume);
  assert.equal(blocksOpening(solid, 1.5, 1.5), false);
  assert.equal(blocksOpening(solid, 1.5, 0.4), true);
  assert.equal(blocksOpening(solid, 1.5, 2.5), true);
  assert.equal(blocksOpening(solid, 0.4, 1.5), true);
  for (const [axis, value, normal] of [
    [0, 0.9, 1],
    [0, 2.1, -1],
    [2, 0.9, 1],
    [2, 2.25, -1],
  ] as const) {
    assert.ok(
      solid.faces.some(
        (f) =>
          f.normal[axis] === normal && f.vertices.every((p) => Math.abs(p[axis] - value) < 1e-10),
      ),
    );
  }
});

test("length, thickness and height edits regenerate actual geometry", () => {
  const changed = updateWall(fixture(), "w", { end: { x: 6, y: 0 }, thickness: 0.5, height: 3.2 });
  const solid = buildSolid(changed);
  assert.deepEqual(solid.max, [6, 0.25, 3.2]);
  close(solid.volume, (6 * 3.2 - 1.2 * 1.35) * 0.5);
  assert.equal(blocksOpening(solid, 3, 1.5), false);
  assert.equal(blocksOpening(solid, 1.5, 1.5), true);
});

test("window height, sill and relative position change the opening", () => {
  const solid = buildSolid(
    updateWindow(fixture(), "o", { width: 0.6, height: 0.5, sillHeight: 1.5, position: 0.75 }),
  );
  assert.equal(blocksOpening(solid, 2.25, 1.7), false);
  assert.equal(blocksOpening(solid, 1.5, 1.7), true);
  assert.equal(blocksOpening(solid, 2.25, 1), true);
  close(solid.volume, (3 * 2.8 - 0.6 * 0.5) * 0.36);
});

test("diagonal and reversed walls retain volume, normals and world placement", () => {
  const solid = buildSolid(
    updateWall(fixture(), "w", { start: { x: 5, y: 6 }, end: { x: 2, y: 2 } }),
  );
  close(solid.volume, (5 * 2.8 - 1.2 * 1.35) * 0.36);
  close(meshVolume(solid), solid.volume);
  for (const f of solid.faces) close(dot(f.normal, f.normal), 1);
  assert.ok(solid.min[0] < 2 && solid.max[0] > 5);
});

test("overlapping openings remove their union only once", () => {
  const project = addWindow(fixture(), { ...opening, id: "o2", position: 0.6 });
  const solid = buildSolid(project);
  close(solid.volume, (3 * 2.8 - 1.5 * 1.35) * 0.36);
  close(meshVolume(solid), solid.volume);
});

test("full-width and floor-level openings do not leave phantom faces", () => {
  const solid = buildSolid(updateWindow(fixture(), "o", { width: 3, height: 2.8, sillHeight: 0 }));
  assert.equal(solid.faces.length, 0);
  assert.equal(solid.volume, 0);
  const door = buildSolid(updateWindow(fixture(), "o", { height: 2.1, sillHeight: 0 }));
  assert.equal(blocksOpening(door, 1.5, 0.1), false);
  close(meshVolume(door), door.volume);
});

test("empty projects are renderable and corrupt input is rejected", () => {
  assert.equal(buildSolid(createProject("p", "s")).faces.length, 0);
  const corrupt = fixture();
  corrupt.storey.windows[0]!.height = 10;
  assert.throws(() => buildSolid(corrupt));
});

test("camera preserves depth, fits portrait/landscape and supports zoom/pan", () => {
  const solid = buildSolid(fixture());
  const centre: Vec3 = [1.5, 0, 1.4];
  assert.deepEqual(projectPoint(centre, solid, initialCamera, 2), [0, 0, -0]);
  for (const aspect of [0.5, 2])
    for (const f of solid.faces)
      for (const p of f.vertices) {
        assert.ok(projectPoint(p, solid, initialCamera, aspect).every((v) => Math.abs(v) < 1));
      }
  const p: Vec3 = [3, 0, 2.8];
  const normal = projectPoint(p, solid, initialCamera, 1);
  const zoomed = projectPoint(p, solid, { ...initialCamera, zoom: 2, panX: 0.1 }, 1);
  close(zoomed[0], normal[0] * 2 + 0.1);
  close(zoomed[1], normal[1] * 2);
  close(zoomed[2], normal[2]);
});
