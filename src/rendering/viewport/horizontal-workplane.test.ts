import test from "node:test";
import assert from "node:assert/strict";
import {
  createProjectionFrame,
  projectOrthographic,
} from "../../geometry/projections/orthographic.ts";
import type {
  OrthographicCamera,
  ProjectionBounds,
  Vector3,
} from "../../geometry/projections/orthographic.ts";
import {
  createHorizontalWorkplaneProjection,
  MAX_INVERSE_ERROR_METRES,
} from "./horizontal-workplane.ts";
import { projectPoint } from "../../lib/bim/geometry.ts";
import type { Solid } from "../../lib/bim/geometry.ts";
const bounds: ProjectionBounds = { min: [-4, -8, 0], max: [6, 3, 2.8] };
const camera: OrthographicCamera = { yaw: -0.45, pitch: 0.3, zoom: 1, panX: 0, panY: 0 };
const viewport = { left: 137, top: 61, width: 800, height: 600 };
function value<T>(r: { status: string; value?: T }): T {
  assert.equal(r.status, "ok");
  return r.value!;
}
const close = (a: number, b: number, tolerance = 1e-9) =>
  assert.ok(Math.abs(a - b) <= tolerance, `${a} != ${b}`);
// Frozen legacy oracle: intentional parity test, not another production camera.
function legacy(p: Vector3, box: ProjectionBounds, k: OrthographicCamera, aspect: number) {
  const x = p[0] - (box.min[0] + box.max[0]) / 2,
    y = p[1] - (box.min[1] + box.max[1]) / 2,
    z = p[2] - (box.min[2] + box.max[2]) / 2;
  const c = Math.cos(k.yaw),
    s = Math.sin(k.yaw),
    cp = Math.cos(k.pitch),
    sp = Math.sin(k.pitch);
  const radius = Math.max(0.1, Math.hypot(...box.max.map((v, i) => v - box.min[i]!)) / 2),
    scale = (0.85 * k.zoom) / radius;
  return [
    ((c * x + s * y) * scale) / Math.max(1, aspect) + k.panX,
    (-s * sp * x + c * sp * y + cp * z) * scale * Math.min(1, aspect) + k.panY,
    -(s * cp * x - c * cp * y + sp * z) / (radius * 2),
  ];
}
test("orthographic extraction preserves exact legacy projection and depth", () => {
  const solid = {
    ...bounds,
    min: [...bounds.min],
    max: [...bounds.max],
    faces: [],
    volume: 0,
  } as Solid;
  for (const yaw of [-2, -0.45, 0, 1.4])
    for (const pitch of [-1.2, 0, 0.3, 1.45])
      for (const aspect of [0.5, 1, 2])
        for (const zoom of [0.2, 1, 5]) {
          const k = { yaw, pitch, zoom, panX: 0.17, panY: -0.3 };
          for (const p of [
            [-100, 8, 0],
            [0, 0, 2],
            [5, -2, 12],
          ] as Vector3[]) {
            const expected = legacy(p, bounds, k, aspect);
            assert.deepEqual(
              projectOrthographic(p, createProjectionFrame(bounds), k, aspect),
              expected,
            );
            assert.deepEqual(projectPoint([...p], solid, k, aspect), expected);
          }
        }
});
test("horizontal plane roundtrips across camera, height and CSS/backbuffer aspect", () => {
  for (const yaw of [-2, -0.45, 0, 1.7])
    for (const pitch of [-1.1, -0.3, 0.3, 1.45])
      for (const zoom of [0.2, 1, 5])
        for (const size of [
          { width: 800, height: 601 },
          { width: 301, height: 700 },
        ])
          for (const dpr of [1, 1.25, 2])
            for (const height of [0, 3.2]) {
              const css = { ...viewport, ...size },
                aspect = Math.round(size.width * dpr) / Math.round(size.height * dpr);
              const k = { ...camera, yaw, pitch, zoom, panX: 0.13, panY: -0.21 };
              const projection = value(
                createHorizontalWorkplaneProjection(bounds, k, css, aspect, height),
              );
              for (const point of [
                { x: -23, y: 7 },
                { x: 0, y: 0 },
                { x: 5, y: -2 },
              ]) {
                const screen = value(projection.toScreen(point));
                const expected = legacy([point.x, point.y, height], bounds, k, aspect);
                close(screen.x, css.left + ((expected[0]! + 1) * css.width) / 2);
                close(screen.y, css.top + ((1 - expected[1]!) * css.height) / 2);
                const inverse = value(projection.toPlane(screen));
                assert.ok(Math.abs(inverse.point.x - point.x) <= inverse.errorBoundMetres);
                assert.ok(Math.abs(inverse.point.y - point.y) <= inverse.errorBoundMetres);
                assert.ok(inverse.errorBoundMetres <= MAX_INVERSE_ERROR_METRES);
              }
            }
});
test("singular and ill-conditioned planes are rejected, including near-edge-on views", () => {
  for (const pitch of [0, 1e-8, -1e-8, Math.PI])
    assert.equal(
      createHorizontalWorkplaneProjection(bounds, { ...camera, pitch }, viewport, 4 / 3).status,
      "ill-conditioned",
    );
  const p = value(
    createHorizontalWorkplaneProjection(bounds, { ...camera, pitch: 1e-4 }, viewport, 4 / 3),
  );
  assert.equal(p.toPlane(value(p.toScreen({ x: 1, y: 2 }))).status, "ok");
});
test("invalid inputs and arithmetic overflow produce explicit statuses", () => {
  for (const invalid of [NaN, Infinity, -Infinity]) {
    assert.equal(
      createHorizontalWorkplaneProjection(bounds, { ...camera, yaw: invalid }, viewport, 4 / 3)
        .status,
      "invalid-input",
    );
    assert.equal(
      createHorizontalWorkplaneProjection(bounds, camera, viewport, invalid).status,
      "invalid-input",
    );
    assert.equal(
      createHorizontalWorkplaneProjection(bounds, camera, viewport, 4 / 3, invalid).status,
      "invalid-input",
    );
  }
  for (const width of [0, -1, NaN])
    assert.equal(
      createHorizontalWorkplaneProjection(bounds, camera, { ...viewport, width }, 4 / 3).status,
      "invalid-input",
    );
  assert.equal(
    createHorizontalWorkplaneProjection(bounds, { ...camera, zoom: 0 }, viewport, 4 / 3).status,
    "invalid-input",
  );
  assert.equal(
    createHorizontalWorkplaneProjection({ min: [3, 0, 0], max: [2, 1, 1] }, camera, viewport, 1)
      .status,
    "invalid-input",
  );
  const p = value(createHorizontalWorkplaneProjection(bounds, camera, viewport, 4 / 3));
  assert.equal(p.toPlane({ x: NaN, y: 1 }).status, "invalid-input");
  assert.equal(p.toScreen({ x: Infinity, y: 1 }).status, "invalid-input");
  assert.equal(p.queryBounds({ x: 100, y: 100 }, -1).status, "invalid-input");
  assert.equal(p.toPlane({ x: 1e200, y: 1e200 }).status, "precision-loss");
  assert.equal(
    createHorizontalWorkplaneProjection(bounds, { ...camera, zoom: Number.MAX_VALUE }, viewport, 1)
      .status,
    "precision-loss",
  );
});
test("inverse search box conservatively contains every edge of the CSS search square", () => {
  for (const pitch of [-0.8, 0.3, 0.01])
    for (const yaw of [-0.45, 0, 2.2]) {
      const p = value(
        createHorizontalWorkplaneProjection(bounds, { ...camera, pitch, yaw }, viewport, 4 / 3),
      );
      const screen = { x: 444, y: 222 },
        box = value(p.queryBounds(screen, 10));
      for (let i = 0; i <= 40; i++)
        for (const edge of [
          { x: -10, y: -10 + i / 2 },
          { x: 10, y: -10 + i / 2 },
          { x: -10 + i / 2, y: -10 },
          { x: -10 + i / 2, y: 10 },
        ]) {
          const point = value(p.toPlane({ x: screen.x + edge.x, y: screen.y + edge.y })).point;
          assert.ok(
            point.x >= box.minX &&
              point.x <= box.maxX &&
              point.y >= box.minY &&
              point.y <= box.maxY,
          );
        }
    }
});
test("bound snapshots survive external camera, bounds and viewport mutation", () => {
  const b = { min: [...bounds.min], max: [...bounds.max] } as {
    min: [number, number, number];
    max: [number, number, number];
  };
  const k = { ...camera },
    v = { ...viewport },
    p = value(createHorizontalWorkplaneProjection(b, k, v, 4 / 3));
  const original = value(p.toScreen({ x: 1, y: 2 }));
  b.max[0] = 100;
  k.yaw = 1;
  v.width = 300;
  assert.deepEqual(value(p.toScreen({ x: 1, y: 2 })), original);
  assert.ok(Object.isFrozen(p.frame));
  assert.ok(Object.isFrozen(p.frame.center));
  close(value(p.toPlane(original)).point.x, 1);
});
test("world precision guard rejects numerically unreliable large offsets without clamping", () => {
  const huge = { min: [1e12, 1e12, 0], max: [1e12 + 10, 1e12 + 10, 3] } as ProjectionBounds;
  const p = value(createHorizontalWorkplaneProjection(huge, camera, viewport, 4 / 3));
  assert.equal(p.toPlane(value(p.toScreen({ x: 1e12 + 1, y: 1e12 + 2 }))).status, "precision-loss");
  assert.equal(p.queryBounds({ x: 400, y: 300 }, 10).status, "precision-loss");
  const normal = value(
    createHorizontalWorkplaneProjection(
      { min: [0, 0, 0], max: [0, 0, 0] },
      camera,
      viewport,
      4 / 3,
    ),
  );
  close(value(normal.toPlane(value(normal.toScreen({ x: 0, y: 0 })))).point.x, 0);
});
