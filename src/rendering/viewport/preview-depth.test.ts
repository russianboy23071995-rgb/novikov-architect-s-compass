import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { updateWall } from "../../lib/bim/model.ts";
import {
  createProjectionFrame,
  projectionDepthRadius,
  horizontalProjectionAxes,
} from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { classifyAnchorVisibility } from "./anchor-visibility.ts";
import { pickWallInProjection } from "../../lib/bim/picking.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";

const project = createExampleProject(),
  base = buildSolid(project),
  frame = createProjectionFrame(base);
const camera = { ...initialCamera, yaw: 0, pitch: 0.05 };
const viewport = { left: 20, top: 40, width: 800, height: 600 },
  buffer = { width: 1000, height: 750 };
const selection = { kind: "wall" as const, id: "wall-1" };
const begin = () =>
  editingReducer(createEditingState(project), {
    type: "begin",
    target: selection,
    action: "move",
    index: null,
    anchor: { x: 3, y: -0.18 },
  });
const state = begin();
const preview = previewEdit(state.session!, state.history.present, selection, { x: 3, y: 19.82 });
const solid = buildSolid(preview);
const extended = { ...frame, depthRadius: projectionDepthRadius(frame, solid) };
const old = createProjectionState(frame, camera, viewport, buffer)!;
const next = createProjectionState(extended, camera, viewport, buffer)!;

test("regression: wall moved 20m is inside the image but outside the old depth clip", () => {
  const point = [0.2, 19.82, 1] as const;
  const before = old.project(point),
    after = next.project(point);
  assert.ok(Math.abs(before[0]) < 1 && Math.abs(before[1]) < 1);
  assert.ok(before[2] > 1);
  assert.deepEqual(after.slice(0, 2), before.slice(0, 2));
  assert.ok(Math.abs(after[2]) < 0.5);
  assert.equal(classifyAnchorVisibility(solid, old, point), "outside");
  assert.equal(classifyAnchorVisibility(solid, next, point), "visible");
  assert.equal(
    pickWallInProjection(solid, old.frame, camera, old.aspect, before[0], before[1]),
    null,
  );
  assert.equal(
    pickWallInProjection(solid, next.frame, camera, next.aspect, after[0], after[1]),
    "wall-1",
  );
});

test("depth envelope contains long and moved previews at all camera orientations without moving XY", () => {
  const long = buildSolid(updateWall(project, "wall-1", { end: { x: 3, y: 60 } }));
  for (const scene of [solid, long])
    for (const yaw of [0, 0.7, Math.PI])
      for (const pitch of [-1.3, 0.05, 1.3]) {
        const cam = { ...camera, yaw, pitch };
        const a = createProjectionState(frame, cam, viewport, buffer)!;
        const b = createProjectionState(
          { ...frame, depthRadius: projectionDepthRadius(frame, scene) },
          cam,
          viewport,
          buffer,
        )!;
        for (const face of scene.faces)
          for (const v of face.vertices) {
            assert.deepEqual(a.project(v).slice(0, 2), b.project(v).slice(0, 2));
            assert.ok(Math.abs(b.project(v)[2]) <= 0.5 + 1e-12);
          }
        const axes = horizontalProjectionAxes(b.frame, cam, b.aspect);
        const origin = b.project(frame.center);
        const shifted = b.project([frame.center[0] + 1, frame.center[1], frame.center[2]]);
        assert.ok(Math.abs(shifted[2] - origin[2] - axes.u[2]) < 1e-12);
      }
});

test("depth-only change preserves inverse coordinates and reference session; cancel restores base", () => {
  const a = old.workplane(),
    b = next.workplane();
  assert.equal(a.status, "ok");
  assert.equal(b.status, "ok");
  if (a.status !== "ok" || b.status !== "ok") return;
  const screen = a.value.toScreen({ x: 0.2, y: 19.82 });
  assert.equal(screen.status, "ok");
  if (screen.status !== "ok") return;
  assert.deepEqual(a.value.toPlane(screen.value), b.value.toPlane(screen.value));
  const c1 = createWallPreviewContext(project, old, true, 0).context;
  const c2 = createWallPreviewContext(project, next, true, 0).context;
  assert.ok(sameHoverSession(c1, c2));
  const cancelled = editingReducer(state, { type: "cancel" });
  assert.equal(cancelled.history.present, state.history.present);
  assert.deepEqual(buildSolid(cancelled.history.present), base);
  assert.equal(projectionDepthRadius(frame, base), frame.radius);
});

test("depth state validates and snapshots its independent extent; nearby moves reuse a tier", () => {
  for (const depthRadius of [0, -1, NaN, Infinity]) {
    assert.equal(createProjectionState({ ...frame, depthRadius }, camera, viewport, buffer), null);
  }
  const mutable = { ...extended };
  const snapshot = createProjectionState(mutable, camera, viewport, buffer)!;
  mutable.depthRadius *= 2;
  assert.equal(snapshot.frame.depthRadius, extended.depthRadius);
  const nearby = buildSolid(
    updateWall(preview, "wall-1", { start: { x: 0, y: 20.01 }, end: { x: 3, y: 20.01 } }),
  );
  assert.equal(projectionDepthRadius(frame, nearby), extended.depthRadius);
});
