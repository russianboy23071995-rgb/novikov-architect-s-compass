import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { addWall, serializeProject, deserializeProject } from "../../lib/bim/model.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";
import { editInteraction } from "../../application/tools/adapters.ts";
import { evaluateInteraction, confirmInteraction } from "../../application/tools/interaction.ts";
import { resolveToolSnap } from "../../application/tools/snapping.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";

const project = createExampleProject();
const projection = createProjectionState(
  createProjectionFrame(buildSolid(project)),
  { ...initialCamera, yaw: 0, pitch: 0.5 },
  { left: 20, top: 40, width: 800, height: 600 },
  { width: 1000, height: 750 },
)!;
const selection = { kind: "wall" as const, id: "wall-1" };
const start = () =>
  editingReducer(createEditingState(project), {
    type: "begin",
    target: selection,
    action: "move",
    index: null,
    anchor: { x: 3, y: -0.18 },
  });
const noop = () => {};

test("3D footpoint movement pins a common origin and excludes the moving wall from targets", () => {
  const state = start(),
    session = state.session!,
    project = state.history.present;
  const policy = editInteraction(session, project, selection, noop, noop).snapping;
  const { context } = createWallPreviewContext(project, projection, true, 0, policy, selection.id);
  assert.deepEqual(context.pinnedReferences, [policy.origin]);
  assert.deepEqual(policy.origin.point, { x: 3, y: -0.18 });
  assert.equal(context.acceptReference!(policy.origin), true);
  const refs = context.sourceQuery!({ x: 0, y: -0.18 }, 1, 1000, [policy.origin]);
  assert.equal(refs.length, 1);
  assert.equal(refs[0]!.entityId, "@edit-origin");
  const result = resolveToolSnap(
    policy,
    { x: 4, y: 0.78 },
    {
      ...context,
      activeReferences: [policy.origin],
      endpointRadiusPx: 10,
      gridSpacing: null,
    },
    { ortho: false, shift: true, featureSnap: true },
  );
  assert.ok(Math.abs(result.point.x - 3 - (result.point.y + 0.18)) < 1e-9);
  const off = resolveToolSnap(
    policy,
    { x: 4, y: 0.78 },
    {
      ...context,
      enabled: false,
      endpointRadiusPx: 10,
      gridSpacing: null,
    },
    { ortho: false, shift: false, featureSnap: false },
  );
  assert.deepEqual(off.point, { x: 4, y: 0.78 });
});

test("3D move uses the shared validated transaction, host opening, JSON and IFC", async () => {
  let state = start();
  const session = state.session!,
    project = state.history.present;
  const tool = editInteraction(
    session,
    project,
    selection,
    (point) => {
      state = editingReducer(state, { type: "confirm", session, selection, point });
    },
    noop,
  );
  const input = evaluateInteraction(tool, "90", "1", null);
  assert.ok(input.value);
  const preview = previewEdit(session, project, selection, input.value!.point);
  assert.equal(state.history.past.length, 0);
  assert.equal(state.history.present, project);
  assert.equal(editingReducer(state, { type: "cancel" }).history.present, project);
  assert.equal(evaluateInteraction(tool, "566", "1", null).value, null);
  assert.throws(() => confirmInteraction(tool, { x: NaN, y: 0 }));
  confirmInteraction(tool, input.value!.point);
  const moved = state.history.present;
  assert.deepEqual(moved, preview);
  assert.equal(state.history.past.length, 1);
  assert.equal(state.session, null);
  assert.equal(moved.storey.walls[0]!.start.y, 1);
  assert.equal(moved.storey.walls[0]!.end.y, 1);
  assert.deepEqual(moved.storey.windows, project.storey.windows);
  assert.equal(buildSolid(moved).min[2], 0);
  assert.equal(buildSolid(moved).max[2], 2.8);
  assert.ok(Math.abs(buildSolid(moved).min[1] - buildSolid(project).min[1] - 1) < 1e-9);
  assert.deepEqual(deserializeProject(serializeProject(moved)), moved);
  const ifc = await exportIfc(moved, new Date("2026-10-04T12:00:00Z"));
  assert.match(ifc, /IFCCARTESIANPOINT\(\(0\.,1\.,0\.\)\)/);
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, project);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, moved);
  assert.throws(() => previewEdit(session, moved, selection, input.value!.point), /geändert/);
  assert.throws(() => previewEdit(session, project, null, input.value!.point), /Auswahl/);
});

test("navigation preserves move origin while invalid inverse and changed interaction suspend/reset", () => {
  const state = start(),
    session = state.session!,
    project = state.history.present;
  const policy = editInteraction(session, project, selection, noop, noop).snapping;
  const a = createWallPreviewContext(project, projection, true, 0, policy, selection.id);
  const moved = previewEdit(session, project, selection, { x: 5, y: 1 });
  // A changing preview must not change the projection's fitting frame.
  const view = createProjectionState(
    projection.frame,
    { ...projection.camera, zoom: 0.8, panX: 0.1 },
    projection.viewport,
    projection.backbuffer,
  )!;
  const b = createWallPreviewContext(project, view, true, 0, policy, selection.id);
  assert.equal(sameHoverSession(a.context, b.context), true);
  assert.deepEqual(view.frame, projection.frame);
  assert.notDeepEqual(createProjectionFrame(buildSolid(moved)), projection.frame);
  assert.deepEqual(b.context.pinnedReferences, a.context.pinnedReferences);
  const side = createProjectionState(
    projection.frame,
    { ...projection.camera, pitch: 0 },
    projection.viewport,
    projection.backbuffer,
  )!;
  const paused = createWallPreviewContext(project, side, true, 0, policy, selection.id);
  assert.equal(paused.context.suspended, true);
  assert.deepEqual(paused.context.sourceQuery!({ x: 1, y: 1 }, 1, 10, []), []);
  assert.equal(
    sameHoverSession(a.context, createWallPreviewContext(project, projection, true, 0).context),
    false,
  );
});

test("stationary wall sources remain visible behind excluded moving material", () => {
  const two = addWall(project, {
    id: "back",
    start: { x: 0, y: 1 },
    end: { x: 3, y: 1 },
    thickness: 0.36,
    height: 2.8,
  });
  const state = editingReducer(createEditingState(two), {
    type: "begin",
    target: selection,
    action: "move",
    index: null,
    anchor: { x: 3, y: -0.18 },
  });
  const policy = editInteraction(state.session!, two, selection, noop, noop).snapping;
  const passive = createWallPreviewContext(two, projection, true, 0);
  const edit = createWallPreviewContext(two, projection, true, 0, policy, selection.id);
  const point = { x: 0, y: 0.82 };
  assert.equal(passive.adapter!.visibilityAt(point), "occluded");
  assert.equal(edit.adapter!.visibilityAt(point), "visible");
  const refs = edit.context.sourceQuery!(point, 1, 10, [policy.origin]);
  assert.ok(refs.some((r) => r.entityId === "back"));
  assert.ok(refs.every((r) => r.entityId !== "wall-1"));
});
