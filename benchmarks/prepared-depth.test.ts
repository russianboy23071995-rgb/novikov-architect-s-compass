import test from "node:test";
import assert from "node:assert/strict";
import {
  prepareNearestWallSurface,
  nearestWallSurface,
} from "../src/rendering/viewport/wall-depth.ts";
import {
  prepareAnchorVisibility,
  classifyAnchorVisibility,
} from "../src/rendering/viewport/anchor-visibility.ts";
import { originFixture } from "./local-origin-fixture.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { movementCorners } from "../src/rendering/viewport/movement-origin.ts";
import type { Vector3 } from "../src/geometry/projections/orthographic.ts";
const identity = (p: Vector3) => p;
test("prepared depth preserves triangle boundaries, tolerance, ties, invalid and extreme projections", () => {
  for (const vertices of [
    [
      [0, 0, 0],
      [0.8, 0, 0],
      [0, 0.8, 0],
    ],
    [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    [
      [-1e8, 0, 0],
      [1e8, 0, 0],
      [0, 1e8, 0],
    ],
    [
      [NaN, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 2],
      [1, 0, 2],
      [0, 1, 2],
    ],
    [
      [0, 0, 0],
      [1, 0, 0],
      [1, 1e-11, 0],
    ],
  ] as [number, number, number][][]) {
    const solid = {
      faces: ["first", "second"].map((wallId) => ({
        wallId,
        vertices,
        normal: [0, 0, 1] as [number, number, number],
      })),
    };
    const query = prepareNearestWallSurface(solid, identity);
    for (const [x, y] of [
      [0, 0],
      [0.4, 0.4],
      [0.4, -1e-10],
      [-1e-10, 0.4],
      [0.4, -1e-6],
      [2, 0],
      [NaN, 0],
      [Infinity, 0],
      [0.5, 1e-12],
    ])
      assert.deepEqual(query(x!, y!), nearestWallSurface(solid, identity, x!, y!));
  }
});
test("prepared depth and visibility match each rebuilt camera and model context", () => {
  for (const yaw of [0, 0.7, Math.PI])
    for (const zoom of [0.02, 1, 3]) {
      const { project, view } = originFixture(10, yaw, zoom),
        solid = buildBuildingSolid(project);
      const query = prepareNearestWallSurface(solid, view.project),
        visible = prepareAnchorVisibility(solid, view);
      for (const c of movementCorners(project)
        .filter((_, i) => i % 47 === 0)
        .slice(0, 16)) {
        const p = view.project(c.point);
        assert.deepEqual(query(p[0], p[1]), nearestWallSurface(solid, view.project, p[0], p[1]));
        assert.equal(visible(c.point), classifyAnchorVisibility(solid, view, c.point));
      }
    }
});
test("prepared depth owns projected coordinates and source order", () => {
  const solid = {
    faces: [
      {
        wallId: "a",
        vertices: [
          [0, 0, 0],
          [1, 0, 0],
          [0, 1, 0],
        ] as [number, number, number][],
        normal: [0, 0, 1] as [number, number, number],
      },
    ],
  };
  const query = prepareNearestWallSurface(solid, (p) => [...p]);
  solid.faces[0]!.vertices[0]![2] = 0.8;
  assert.deepEqual(query(0, 0), { wallId: "a", depth: 0 });
});
