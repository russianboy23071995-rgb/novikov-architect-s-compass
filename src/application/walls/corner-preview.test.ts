import test from "node:test";
import assert from "node:assert/strict";
import { cornerPreviewReducer, currentCornerPreview } from "./corner-preview.ts";
import { createProject, addWall, addWindow } from "../../lib/bim/model.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { cornerPreviewSurfaces } from "../../rendering/viewport/corner-preview.ts";
import { faceTriangles } from "../../geometry/solids/face-triangles.ts";
import { nearestWallSurface } from "../../rendering/viewport/wall-depth.ts";

function tFixture() {
  let p = createProject("t", "s");
  for (const w of [
    { id: "host", start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
    { id: "incoming", start: { x: 3, y: -3 }, end: { x: 3, y: 0 } },
    { id: "unrelated", start: { x: 9, y: 0 }, end: { x: 12, y: 0 } },
  ])
    p = addWall(p, { ...w, thickness: 0.36, height: 2.8, bodyOffset: 0 });
  return p;
}
test("T preview shares profiles/surfaces, preserves unrelated geometry and never changes the project", () => {
  const project = tFixture(),
    before = structuredClone(project);
  const state = cornerPreviewReducer(
    { preview: null, error: "" },
    { type: "t-preview", project, hostId: "host", incoming: { wallId: "incoming", endpoint: 1 } },
  );
  assert.equal(state.error, "");
  const preview = currentCornerPreview(state, project)!;
  assert.ok(Math.abs(preview.geometry.volume - 8.89056) < 1e-8);
  const base = buildSolid(project),
    displayed = cornerPreviewSurfaces(project, base, preview);
  assert.deepEqual(
    displayed.faces.filter((f) => f.wallId === "unrelated"),
    base.faces.filter((f) => f.wallId === "unrelated"),
  );
  for (const wall of preview.geometry.walls) {
    assert.deepEqual(
      displayed.faces.filter((f) => f.wallId === wall.wallId),
      wall.faces,
    );
    assert.equal(wall.localProfile.length, wall.contour.length);
  }
  assert.deepEqual(project, before);
  assert.equal(project.storey.wallJoins.length, 0);
  assert.equal(currentCornerPreview(state, structuredClone(project)), null);
  assert.deepEqual(cornerPreviewReducer(state, { type: "clear" }), { preview: null, error: "" });
  const invalid = cornerPreviewReducer(state, {
    type: "t-preview",
    project,
    hostId: "host",
    incoming: { wallId: "incoming", endpoint: 0 },
  });
  assert.equal(invalid.preview, null);
  assert.ok(invalid.error);
});

test("T preview rejects windows, existing joins and missing or duplicate targets", () => {
  const base = tFixture();
  for (const wallId of ["host", "incoming"]) {
    const project = addWindow(base, {
      id: "window",
      wallId,
      width: 1,
      height: 1,
      sillHeight: 0.9,
      position: 0.5,
    });
    const result = cornerPreviewReducer(
      { preview: null, error: "" },
      { type: "t-preview", project, hostId: "host", incoming: { wallId: "incoming", endpoint: 1 } },
    );
    assert.equal(result.preview, null);
    assert.match(result.error, /ohne Fenster/);
  }
  const joined = addWall(base, {
    id: "corner",
    start: { x: 6, y: 0 },
    end: { x: 6, y: 3 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0,
  });
  const result = cornerPreviewReducer(
    { preview: null, error: "" },
    {
      type: "t-preview",
      project: joined,
      hostId: "host",
      incoming: { wallId: "incoming", endpoint: 1 },
    },
  );
  assert.equal(result.preview, null);
  assert.match(result.error, /ohne weitere Anschlüsse/);
  for (const hostId of ["missing", "incoming"]) {
    const result = cornerPreviewReducer(
      { preview: null, error: "" },
      { type: "t-preview", project: base, hostId, incoming: { wallId: "incoming", endpoint: 1 } },
    );
    assert.equal(result.preview, null);
    assert.ok(result.error);
  }
});
const targets = [
  { wallId: "A", endpoint: 1 as const },
  { wallId: "B", endpoint: 0 as const },
] as const;
function fixture() {
  let p = createProject("p", "s");
  for (const w of [
    { id: "A", start: { x: 0, y: 0 }, end: { x: 3, y: 0 } },
    { id: "B", start: { x: 3, y: 0 }, end: { x: 3, y: 3 } },
    { id: "C", start: { x: 8, y: 0 }, end: { x: 11, y: 0 } },
  ])
    p = addWall(p, { ...w, thickness: 0.36, height: 2.8 });
  return addWindow(p, {
    id: "w",
    wallId: "A",
    width: 1.2,
    height: 1.35,
    sillHeight: 0.9,
    position: 0.5,
  });
}
test("explicit preview replaces both wall bodies, preserves unrelated walls and the authoritative model", () => {
  const p = fixture(),
    before = structuredClone(p),
    base = buildSolid(p);
  const state = cornerPreviewReducer(
    { preview: null, error: "" },
    { type: "preview", project: p, first: targets[0], second: targets[1] },
  );
  assert.equal(state.error, "");
  const preview = currentCornerPreview(state, p)!;
  const surfaces = cornerPreviewSurfaces(p, base, preview);
  for (const id of ["A", "B"])
    assert.deepEqual(
      surfaces.faces.filter((f) => f.wallId === id),
      preview.geometry.walls.find((w) => w.wallId === id)!.faces,
    );
  assert.deepEqual(
    surfaces.faces.filter((f) => f.wallId === "C"),
    base.faces.filter((f) => f.wallId === "C"),
  );
  assert.deepEqual(p, before);
  assert.ok(Math.abs(preview.geometry.volume - (6.048 - 1.2 * 1.35 * 0.36)) < 1e-8);
  for (const w of preview.geometry.walls) assert.equal(w.localProfile.length, w.contour.length);
});
test("preview rejects changed snapshots, invalid pairs and clears without history or mutation", () => {
  const p = fixture(),
    state = cornerPreviewReducer(
      { preview: null, error: "" },
      { type: "preview", project: p, first: targets[0], second: targets[1] },
    );
  const changed = structuredClone(p);
  assert.equal(currentCornerPreview(state, changed), null);
  assert.throws(() => cornerPreviewSurfaces(changed, buildSolid(changed), state.preview!));
  const invalid = cornerPreviewReducer(state, {
    type: "preview",
    project: p,
    first: targets[0],
    second: { wallId: "C", endpoint: 0 },
  });
  assert.equal(invalid.preview, null);
  assert.ok(invalid.error);
  assert.deepEqual(cornerPreviewReducer(state, { type: "clear" }), { preview: null, error: "" });
});
test("rendering and depth picking cover the complete convex face rather than just its first quad", () => {
  assert.deepEqual(
    [...faceTriangles(5)],
    [
      [0, 1, 2],
      [0, 2, 3],
      [0, 3, 4],
    ],
  );
  const vertices: [number, number, number][] = [
    [-0.8, -0.8, 0],
    [0.8, -0.8, 0],
    [0.8, 0.4, 0],
    [0, 0.9, 0],
    [-0.8, 0.4, 0],
  ];
  assert.deepEqual(
    nearestWallSurface(
      { faces: [{ wallId: "p", vertices, normal: [0, 0, 1] }] },
      (p) => p,
      -0.6,
      0.3,
    ),
    { wallId: "p", depth: 0 },
  );
  assert.equal(
    nearestWallSurface(
      { faces: [{ wallId: "p", vertices, normal: [0, 0, 1] }] },
      (p) => p,
      -0.95,
      0.3,
    ),
    null,
  );
});
