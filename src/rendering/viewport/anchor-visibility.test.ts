import test from "node:test";
import assert from "node:assert/strict";
import { addWall } from "../../lib/bim/model.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import type { Solid } from "../../lib/bim/geometry.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { triangleDepth } from "../../geometry/projections/triangle-depth.ts";
import { pickWallInProjection } from "../../lib/bim/picking.ts";
import { createProjectionState, backbufferSize } from "./projection-state.ts";
import { classifyAnchorVisibility, ANCHOR_DEPTH_TOLERANCE } from "./anchor-visibility.ts";

const front = { ...initialCamera, yaw: 0, pitch: 0 };
function state(solid: Solid, camera = front, width = 801, height = 603, dpr = 1.25) {
  return createProjectionState(
    createProjectionFrame(solid),
    camera,
    { left: 17, top: 29, width, height },
    backbufferSize(width, height, dpr),
  )!;
}

test("anchors in front/on/behind wall material and through its opening", () => {
  const solid = buildSolid(createExampleProject());
  for (const dpr of [1, 1.25, 2])
    for (const [width, height] of [
      [801, 603],
      [603, 801],
    ]) {
      const projection = state(solid, front, width, height, dpr);
      for (const y of [-0.3, -0.18])
        assert.equal(classifyAnchorVisibility(solid, projection, [0.3, y, 1.5]), "visible");
      assert.equal(classifyAnchorVisibility(solid, projection, [0.3, 0.18, 1.5]), "occluded");
      assert.equal(classifyAnchorVisibility(solid, projection, [1.5, 0.3, 1.5]), "visible");
      assert.equal(classifyAnchorVisibility(solid, projection, [0, -0.18, 0]), "visible");
    }
});

test("overlapping walls use the same nearest depth as picking regardless of face order", () => {
  const project = addWall(createExampleProject(), {
    id: "back",
    start: { x: 0, y: 2 },
    end: { x: 3, y: 2 },
    height: 2.8,
    thickness: 0.36,
  });
  const solid = buildSolid(project);
  for (const faces of [solid.faces, [...solid.faces].reverse()]) {
    const scene = { ...solid, faces },
      projection = state(scene);
    assert.equal(classifyAnchorVisibility(scene, projection, [0.3, 1.82, 1.5]), "occluded");
    assert.equal(classifyAnchorVisibility(scene, projection, [1.5, 1.82, 1.5]), "visible");
    assert.equal(classifyAnchorVisibility(scene, projection, [1.5, 2.18, 1.5]), "occluded");
    const [x, y] = projection.project([1.5, 1.82, 1.5]);
    assert.equal(
      pickWallInProjection(scene, projection.frame, projection.camera, projection.aspect, x, y),
      "back",
    );
  }
});

test("orbit reverses occlusion; pan and zoom use the current projection", () => {
  const project = createExampleProject();
  project.storey.windows = [];
  const solid = buildSolid(project);
  for (const zoom of [0.7, 1.2])
    for (const pitch of [0, 0.15]) {
      const forward = state(solid, { ...front, pitch, zoom, panX: 0.1, panY: -0.1 });
      const reverse = state(solid, { ...front, pitch, zoom, yaw: Math.PI, panX: -0.1, panY: 0.1 });
      assert.equal(classifyAnchorVisibility(solid, forward, [1.5, -0.18, 1.4]), "visible");
      assert.equal(classifyAnchorVisibility(solid, reverse, [1.5, -0.18, 1.4]), "occluded");
      assert.equal(classifyAnchorVisibility(solid, reverse, [1.5, 0.18, 1.4]), "visible");
    }
  assert.equal(
    classifyAnchorVisibility(solid, state(solid, { ...front, panX: 3 }), [1.5, -0.18, 1.4]),
    "outside",
  );
});

test("surface depth tolerance admits roundoff but rejects a point definitely behind", () => {
  const solid = buildSolid(createExampleProject()),
    projection = state(solid);
  const worldTolerance = ANCHOR_DEPTH_TOLERANCE * projection.frame.radius * 2;
  assert.equal(
    classifyAnchorVisibility(solid, projection, [0.3, -0.18 + worldTolerance / 2, 1.5]),
    "visible",
  );
  assert.equal(
    classifyAnchorVisibility(solid, projection, [0.3, -0.18 + worldTolerance * 2, 1.5]),
    "occluded",
  );
});

test("invalid anchors/projections, clip bounds and empty scenes are distinct", () => {
  const solid = buildSolid(createExampleProject()),
    projection = state(solid);
  assert.equal(classifyAnchorVisibility(solid, null, [0, 0, 0]), "invalid");
  for (const value of [NaN, Infinity, -Infinity])
    assert.equal(classifyAnchorVisibility(solid, projection, [value, 0, 0]), "invalid");
  for (const point of [
    [100, 0, 1],
    [1.5, 100, 1],
    [1.5, 0, 100],
  ] as const)
    assert.equal(classifyAnchorVisibility(solid, projection, point), "outside");
  assert.equal(
    classifyAnchorVisibility({ ...solid, faces: [] }, projection, [0.3, 0, 1.5]),
    "visible",
  );
  const broken = { ...projection, project: () => [NaN, 0, 0] as [number, number, number] };
  assert.equal(classifyAnchorVisibility(solid, broken, [0, 0, 0]), "invalid");
});

test("triangle depth handles edges, winding, interpolation, clipping and degeneracy", () => {
  const a = [-0.5, -0.5, -0.5] as const,
    b = [0.5, -0.5, 0.5] as const,
    c = [0, 0.5, 0] as const;
  assert.equal(triangleDepth(a, b, c, 0, 0), 0);
  assert.equal(triangleDepth(c, b, a, 0, 0), 0);
  assert.equal(triangleDepth(a, b, c, 0, -0.5), 0);
  assert.equal(triangleDepth(a, b, c, 0.5, 0.5), null);
  assert.equal(triangleDepth(a, a, a, 0, 0), null);
  assert.equal(triangleDepth([NaN, 0, 0], b, c, 0, 0), null);
  assert.equal(triangleDepth([-1, -1, 2], [1, -1, 2], [0, 1, 2], 0, 0), null);
  assert.equal(triangleDepth([-1, -1, -2], [1, -1, 0], [0, 1, 0], 0, 0), -0.5);
});
