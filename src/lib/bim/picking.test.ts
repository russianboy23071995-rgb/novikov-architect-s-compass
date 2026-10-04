import test from "node:test";
import assert from "node:assert/strict";
import { pickWall, isSelectionClick } from "./picking.ts";
import { buildSolid, initialCamera, projectPoint } from "./geometry.ts";
import { addWall, updateWall } from "./model.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import {
  createProjectionState,
  backbufferSize,
  projectionStateMatches,
} from "../../rendering/viewport/projection-state.ts";
import { pickWallInProjection } from "./picking.ts";

test("display snapshot unifies rounded aspect, wall/opening picking and plane inversion", () => {
  const solid = buildSolid(createExampleProject());
  for (const [width, height] of [
    [801, 603],
    [603, 801],
  ])
    for (const dpr of [1, 1.25, 2])
      for (const pitch of [0, 0.15]) {
        const camera = { ...initialCamera, yaw: 0, pitch, zoom: 1.2, panX: 0.05, panY: -0.04 };
        const viewport = { left: 47, top: 81, width: width!, height: height! };
        const state = createProjectionState(
          createProjectionFrame(solid),
          camera,
          viewport,
          backbufferSize(width!, height!, dpr),
        )!;
        assert.equal(state.aspect, state.backbuffer.width / state.backbuffer.height);
        for (const [point, expected] of [
          [[0.3, -0.18, 1.5], "wall-1"],
          [[1.5, -0.18, 1.5], null],
        ] as const) {
          const projected = state.project(point);
          const screen = {
            x: viewport.left + ((projected[0] + 1) * viewport.width) / 2,
            y: viewport.top + ((1 - projected[1]) * viewport.height) / 2,
          };
          const ndc = state.toNdc(screen);
          assert.equal(
            pickWallInProjection(solid, state.frame, state.camera, state.aspect, ndc.x, ndc.y),
            expected,
          );
        }
        const plane = state.workplane();
        if (pitch === 0) assert.equal(plane.status, "ill-conditioned");
        else {
          assert.equal(plane.status, "ok");
          if (plane.status !== "ok") continue;
          const world = { x: 0.4, y: 0.2 },
            screen = plane.value.toScreen(world);
          assert.equal(screen.status, "ok");
          if (screen.status !== "ok") continue;
          const ndc = state.toNdc(screen.value),
            expected = state.project([world.x, world.y, 0]);
          assert.ok(Math.abs(ndc.x - expected[0]) < 1e-12 && Math.abs(ndc.y - expected[1]) < 1e-12);
          const inverse = plane.value.toPlane(screen.value);
          assert.equal(inverse.status, "ok");
          if (inverse.status === "ok")
            assert.ok(
              Math.hypot(inverse.value.point.x - world.x, inverse.value.point.y - world.y) < 1e-9,
            );
        }
      }
});

test("display snapshot rejects stale camera, rectangle and DPR and isolates external inputs", () => {
  const frame = { center: [1, 2, 3] as [number, number, number], radius: 4 };
  const camera = { ...initialCamera },
    viewport = { left: 1, top: 2, width: 801, height: 603 },
    buffer = backbufferSize(801, 603, 1.25);
  const state = createProjectionState(frame, camera, viewport, buffer)!;
  const before = state.project([2, 3, 4]);
  assert.ok(projectionStateMatches(state, camera, viewport, buffer));
  for (const key of ["yaw", "pitch", "zoom", "panX", "panY"] as const)
    assert.equal(
      projectionStateMatches(state, { ...camera, [key]: camera[key] + 0.1 }, viewport, buffer),
      false,
    );
  for (const key of ["left", "top", "width", "height"] as const)
    assert.equal(
      projectionStateMatches(state, camera, { ...viewport, [key]: viewport[key] + 1 }, buffer),
      false,
    );
  assert.equal(projectionStateMatches(state, camera, viewport, backbufferSize(801, 603, 2)), false);
  frame.center[0] = 999;
  frame.radius = 1;
  camera.zoom = 5;
  viewport.width = 10;
  buffer.width = 2;
  assert.deepEqual(state.project([2, 3, 4]), before);
  assert.ok(
    Object.isFrozen(state.frame.center) &&
      Object.isFrozen(state.camera) &&
      Object.isFrozen(state.viewport),
  );
  assert.equal(
    createProjectionState(
      state.frame,
      state.camera,
      { ...state.viewport, width: 0 },
      state.backbuffer,
    ),
    null,
  );
  assert.equal(
    createProjectionState(state.frame, state.camera, state.viewport, { width: NaN, height: 100 }),
    null,
  );
});

test("explicit operation frame stays shared when preview bounds change", () => {
  const base = buildSolid(createExampleProject()),
    frame = createProjectionFrame(base);
  const preview = buildSolid(updateWall(createExampleProject(), "wall-1", { end: { x: 4, y: 0 } }));
  const state = createProjectionState(
    frame,
    { ...initialCamera, yaw: 0, pitch: 0 },
    { left: 0, top: 0, width: 801, height: 603 },
    backbufferSize(801, 603, 1.25),
  )!;
  const [x, y] = state.project([0.3, -0.18, 1.5]);
  assert.equal(
    pickWallInProjection(preview, state.frame, state.camera, state.aspect, x, y),
    "wall-1",
  );
  assert.deepEqual(state.frame, frame);
  assert.notDeepEqual(createProjectionFrame(preview), frame);
});
const front = { ...initialCamera, yaw: 0, pitch: 0 };

test("selects reference wall material and leaves its through opening empty", () => {
  const solid = buildSolid(createExampleProject());
  for (const [point, expected] of [
    [[0.3, -0.18, 1.5], "wall-1"],
    [[1.5, -0.18, 1.5], null],
  ] as const) {
    const [x, y] = projectPoint([...point], solid, front, 1);
    assert.equal(pickWall(solid, front, 1, x, y), expected);
  }
});
test("nearest visible wall wins regardless of model order", () => {
  let p = createExampleProject();
  p.storey.windows = [];
  p = addWall(p, { ...p.storey.walls[0]!, id: "back", start: { x: 0, y: 2 }, end: { x: 3, y: 2 } });
  for (const walls of [p.storey.walls, [...p.storey.walls].reverse()]) {
    const solid = buildSolid({ ...p, storey: { ...p.storey, walls } });
    const [x, y] = projectPoint([1.5, 0, 1.4], solid, front, 1);
    assert.equal(pickWall(solid, front, 1, x, y), "wall-1");
  }
});
test("wall behind an opening can be selected through it", () => {
  const p = addWall(createExampleProject(), {
    id: "back",
    start: { x: 0, y: 2 },
    end: { x: 3, y: 2 },
    height: 2.8,
    thickness: 0.36,
  });
  const solid = buildSolid(p);
  const [x, y] = projectPoint([1.5, 0, 1.5], solid, front, 1);
  assert.equal(pickWall(solid, front, 1, x, y), "back");
});
test("picking follows orbit, pan, zoom and viewport aspect ratios", () => {
  const p = createExampleProject();
  p.storey.windows = [];
  const solid = buildSolid(p);
  for (const aspect of [0.5, 1, 2]) {
    const camera = { ...initialCamera, zoom: 1.3, panX: 0.1, panY: -0.1 };
    const [x, y] = projectPoint([1.5, -0.18, 1.4], solid, camera, aspect);
    assert.equal(pickWall(solid, camera, aspect, x, y), "wall-1");
  }
});
test("diagonal translated wall keeps its stable identity", () => {
  const p = updateWall(createExampleProject(), "wall-1", {
    start: { x: 5, y: 8 },
    end: { x: 8, y: 12 },
  });
  p.storey.windows = [];
  const solid = buildSolid(p);
  const [x, y] = projectPoint([6.5, 10, 1.4], solid, initialCamera, 1);
  assert.equal(pickWall(solid, initialCamera, 1, x, y), "wall-1");
});
test("outside canvas, empty background and degenerate faces do not select", () => {
  const solid = buildSolid(createExampleProject());
  assert.equal(pickWall(solid, front, 1, 0.99, 0.99), null);
  assert.equal(pickWall(solid, front, 1, 2, 0), null);
  assert.equal(pickWall(solid, front, 0, 0, 0), null);
  assert.equal(pickWall(solid, front, 1, NaN, 0), null);
  assert.equal(pickWall({ ...solid, faces: [] }, front, 1, 0, 0), null);
  const face = solid.faces[0]!;
  assert.equal(
    pickWall(
      {
        ...solid,
        faces: [
          {
            ...face,
            vertices: [face.vertices[0], face.vertices[0], face.vertices[0], face.vertices[0]],
          },
        ],
      },
      front,
      1,
      0,
      0,
    ),
    null,
  );
});
test("small pointer jitter is a click, dragging is not", () => {
  assert.equal(isSelectionClick(10, 10, 12, 12), true);
  assert.equal(isSelectionClick(10, 10, 15, 10), false);
});
