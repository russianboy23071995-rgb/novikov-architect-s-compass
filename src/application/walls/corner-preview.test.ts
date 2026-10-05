import test from "node:test";
import assert from "node:assert/strict";
import { cornerPreviewReducer, currentCornerPreview } from "./corner-preview.ts";
import { createProject, addWall, addWindow } from "../../lib/bim/model.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { cornerPreviewSurfaces } from "../../rendering/viewport/corner-preview.ts";
import { faceTriangles } from "../../geometry/solids/face-triangles.ts";
import { nearestWallSurface } from "../../rendering/viewport/wall-depth.ts";
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
