import test from "node:test";
import assert from "node:assert/strict";
import { prepareWorldPicking } from "./world-picking.ts";
import { connectedFixture } from "./connected-fixture.ts";
import { buildSolid } from "../src/lib/bim/geometry.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
import {
  pickSolidElement,
  windowSelectionSurfaces,
} from "../src/rendering/viewport/window-selection.ts";
import { nearestWallSurface } from "../src/rendering/viewport/wall-depth.ts";
import { triangleDepth } from "../src/geometry/projections/triangle-depth.ts";
test("world BVH pilot matches full scan across views, holes, occlusion and hidden geometry", () => {
  for (const kind of ["chain", "tees"] as const)
    for (const yaw of [0, 0.5, 2.4]) {
      const project = connectedFixture(kind, 5),
        original = buildSolid(project),
        solid = { ...original, faces: original.faces.filter((f) => f.wallId !== "wall-3") },
        windows = windowSelectionSurfaces(project, (id) => id !== "wall-3"),
        projection = createProjectionState(
          createProjectionFrame(original),
          { yaw, pitch: 0.6, zoom: 1, panX: 0.1, panY: 0 },
          { left: 0, top: 0, width: 400, height: 300 },
          { width: 400, height: 300 },
        )!;
      const prepared = prepareWorldPicking(solid, windows);
      const points = Array.from({ length: 121 }, (_, i) => ({
        x: (i % 11) / 5 - 1,
        y: Math.floor(i / 11) / 5 - 1,
      }));
      for (const face of solid.faces) {
        const p = face.vertices.map(projection.project);
        points.push(...p.map((v) => ({ x: v[0], y: v[1] })));
        points.push({
          x: p.reduce((s, v) => s + v[0], 0) / p.length,
          y: p.reduce((s, v) => s + v[1], 0) / p.length,
        });
      }
      for (const point of points) {
        const actual = prepared.query(solid, windows, projection, point.x, point.y);
        assert.deepEqual(
          actual.target,
          pickSolidElement(solid, windows, projection.project, point.x, point.y),
        );
        if (Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1) {
          let depth =
            nearestWallSurface(solid, projection.project, point.x, point.y)?.depth ?? Infinity;
          for (const w of windows) {
            const p = w.vertices.map(projection.project);
            for (const [a, b, c] of [
              [0, 1, 2],
              [0, 2, 3],
            ]) {
              const h = triangleDepth(p[a!]!, p[b!]!, p[c!]!, point.x, point.y);
              if (h !== null && h < depth) depth = h;
            }
          }
          assert.equal(actual.depth, Number.isFinite(depth) ? depth : null);
        }
      }
      assert.throws(() => prepared.query({ ...solid }, windows, projection, 0, 0));
      assert.throws(() => prepared.query(solid, [...windows], projection, 0, 0));
      assert.deepEqual(
        prepared.query(solid, windows, { ...projection }, 0, 0).target,
        pickSolidElement(solid, windows, projection.project, 0, 0),
      );
    }
});
test("world bounds retain barycentric boundary tolerance and original tie ordering", () => {
  const face = {
    wallId: "first",
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ] as [number, number, number][],
    normal: [0, 0, 1] as [number, number, number],
  };
  const solid = {
    min: [0, 0, 0] as [number, number, number],
    max: [1, 1, 0] as [number, number, number],
    faces: [face, { ...face, wallId: "second" }],
  };
  const projection = createProjectionState(
    { center: [0, 0, 0], radius: 0.85 },
    { yaw: 0, pitch: Math.PI / 2, zoom: 1, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 100, height: 100 },
    { width: 100, height: 100 },
  )!;
  const windows: ReturnType<typeof windowSelectionSurfaces> = [];
  const p = prepareWorldPicking(solid, windows);
  for (const x of [-0.5e-9, 0, 0.5, 1])
    assert.deepEqual(
      p.query(solid, windows, projection, x, 0).target,
      pickSolidElement(solid, windows, projection.project, x, 0),
    );
  assert.equal(p.query(solid, windows, projection, 0.1, 0.1).target?.id, "first");
  assert.equal(p.query(solid, windows, projection, NaN, 0).target, null);
});
