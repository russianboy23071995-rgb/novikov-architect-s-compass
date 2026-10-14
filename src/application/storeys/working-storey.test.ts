import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addStorey, setStoreyHeight } from "./actions.ts";
import { selectWorkingStorey } from "./working-storey.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { addWall, addWindow, serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { windowSelectionSurfaces } from "../../rendering/viewport/window-selection.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { changeDrawingDocument } from "../views/documents.ts";
import { resolveDocumentView, resolveWorkingView } from "../views/working-context.ts";
function fixture() {
  const initial = createExampleProject();
  const ground = setStoreyHeight(initial, initial, {
    projectId: initial.id,
    storeyId: initial.groundStoreyId,
    height: 3,
  });
  return addStorey(ground, ground, {
    projectId: ground.id,
    storeyId: ground.groundStoreyId,
    side: "above",
    id: "og",
    height: 3.2,
  });
}
test("active storey routes existing wall/window actions and derives world height once", async () => {
  const ground = fixture();
  const active = selectWorkingStorey(ground, ground, "og");
  assert.equal(active.groundStoreyId, ground.groundStoreyId);
  assert.equal(resolveWorkingView(active).storey.id, "og");
  const wall = addWall(active, {
    id: "og-wall",
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    thickness: 0.3,
    height: 2.8,
  });
  const project = addWindow(wall, {
    id: "og-window",
    wallId: "og-wall",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  assert.deepEqual(project.storeys[0], ground.storeys[0]);
  assert.equal(storeyOf(project).walls[0]!.id, "og-wall");
  assert.equal(workingStoreyElevation(project), 3);
  const solid = buildSolid(project);
  assert.equal(solid.min[2], 3);
  assert.equal(solid.max[2], 5.8);
  assert.equal(windowSelectionSurfaces(project, () => true)[0]!.vertices[0]![2], 3.9);
  assert.deepEqual(readProjectFile(serializeProject(project)), project);
  const { createProjectRecoveryCodec } =
    await import("../../interop/project-file/recovery-codec.ts");
  const codec = createProjectRecoveryCodec();
  assert.deepEqual(await codec.restore(await codec.prepare(project)), project);
  const time = new Date("2026-10-14T00:00:00Z");
  const back = selectWorkingStorey(project, project, project.groundStoreyId);
  assert.equal(await exportIfc(back, time), await exportIfc(project, time));
  assert.equal(buildSolid(back).min[2], 0);
  assert.throws(() =>
    addWindow(project, {
      id: "bad",
      wallId: "wall-1",
      width: 1,
      height: 1,
      sillHeight: 0.5,
      position: 0.5,
    }),
  );
});
test("storey selection is not model Undo, preserves Redo and rejects stale context", () => {
  let state = createEditingState(fixture());
  const base = state.history.present;
  state = editingReducer(state, { type: "working-storey", base, storeyId: "og" });
  assert.equal(state.history.past.length, 0);
  assert.equal(storeyOf(state.history.present).id, "og");
  const active = state.history.present;
  const next = addWall(active, {
    id: "new",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.3,
    height: 2.8,
  });
  state = editingReducer(state, { type: "project", project: next });
  state = editingReducer(state, {
    type: "working-storey",
    base: state.history.present,
    storeyId: base.groundStoreyId,
  });
  state = editingReducer(state, { type: "undo" });
  assert.equal(storeyOf(state.history.present).id, base.groundStoreyId);
  assert.equal(state.history.present.storeys[1]!.walls.length, 0);
  state = editingReducer(state, {
    type: "working-storey",
    base: state.history.present,
    storeyId: "og",
  });
  state = editingReducer(state, { type: "redo" });
  assert.equal(storeyOf(state.history.present).walls[0]!.id, "new");
  assert.throws(() => selectWorkingStorey(base, active, "og"));
  assert.throws(() => selectWorkingStorey(base, base, "missing"));
});
test("drawing document creation binds the active storey, not the ground datum", () => {
  const p = fixture(),
    active = selectWorkingStorey(p, p, "og");
  const created = changeDrawingDocument(active, active, {
    kind: "create",
    id: "doc",
    modelViewId: "view",
    name: "OG",
    denominator: 100,
  });
  assert.equal(
    resolveDocumentView(created, { kind: "drawing-document", projectId: p.id, documentId: "doc" })
      .storey.id,
    "og",
  );
});

test("elevated 3D feet, axes, workplane and picking share the same Z", async () => {
  const { createProjectionFrame } = await import("../../geometry/projections/orthographic.ts");
  const { createProjectionState } = await import("../../rendering/viewport/projection-state.ts");
  const { createWallPointCandidates } =
    await import("../../rendering/viewport/wall-point-candidates.ts");
  const { getWallFootSources } = await import("../../rendering/viewport/wall-foot-sources.ts");
  const { selectedWallAxis } = await import("../../rendering/viewport/wall-axis.ts");
  const { initialCamera } = await import("../../lib/bim/geometry.ts");
  const { pickWallInProjection } = await import("../../lib/bim/picking.ts");
  const p = fixture(),
    active = selectWorkingStorey(p, p, "og");
  const project = addWall(active, {
    id: "og-wall",
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    thickness: 0.3,
    height: 2.8,
  });
  const solid = buildSolid(project),
    frame = createProjectionFrame(solid);
  const projection = createProjectionState(
    frame,
    { ...initialCamera, yaw: 0, pitch: 0.5 },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
  const plane = projection.workplane(3);
  assert.equal(plane.status, "ok");
  if (plane.status !== "ok") return;
  const screen = plane.value.toScreen({ x: 0, y: 0 });
  assert.equal(screen.status, "ok");
  if (screen.status !== "ok") return;
  const candidates = createWallPointCandidates(project, projection).query(
    project,
    projection,
    screen.value,
    10,
  );
  assert.equal(candidates.status, "ok");
  if (candidates.status !== "ok") return;
  assert.ok(
    candidates.candidates.some((c) => c.sourceEntityId === "og-wall" && c.modelPoint[2] === 3),
  );
  assert.ok(
    getWallFootSources(project).queryPrimitives({ x: 2.5, y: 0 }, plane.value.metric, 30).segments
      .length > 0,
  );
  const axis = selectedWallAxis(project, { kind: "wall", id: "og-wall" }, () => true, projection)!;
  assert.ok(Math.abs(axis.start.x - screen.value.x) < 1e-8);
  assert.ok(Math.abs(axis.start.y - screen.value.y) < 1e-8);
  const hit = projection.project([2.5, 0, 4]);
  assert.equal(
    pickWallInProjection(solid, frame, projection.camera, projection.aspect, hit[0], hit[1]),
    "og-wall",
  );
});

test("undoing the selected storey's creation returns to EG without a dangling view", () => {
  const initial = createExampleProject();
  let state = createEditingState(initial);
  const p = state.history.present;
  const basement = addStorey(p, p, {
    projectId: p.id,
    storeyId: p.groundStoreyId,
    side: "below",
    id: "kg",
    height: 2.7,
  });
  state = editingReducer(state, { type: "project", project: basement });
  state = editingReducer(state, {
    type: "working-storey",
    base: state.history.present,
    storeyId: "kg",
  });
  assert.equal(workingStoreyElevation(state.history.present), -2.7);
  state = editingReducer(state, { type: "undo" });
  assert.equal(storeyOf(state.history.present).id, p.groundStoreyId);
  assert.equal(state.history.present.workingStoreyId, undefined);
  assert.deepEqual(readProjectFile(serializeProject(state.history.present)), state.history.present);
});

import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import {
  buildingWindowSelectionSurfaces,
  pickSolidElement,
} from "../../rendering/viewport/window-selection.ts";
import { workingStoreyForTarget } from "./working-storey.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { visibleSurfaces } from "../../rendering/viewport/layer-display.ts";

test("building scene includes EG, OG and basement independently of the active storey", async () => {
  let p = fixture();
  p = selectWorkingStorey(p, p, "og");
  p = addWall(p, {
    id: "upper",
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    thickness: 0.3,
    height: 2.8,
  });
  p = addWindow(p, {
    id: "upper-window",
    wallId: "upper",
    width: 1,
    height: 1,
    sillHeight: 1,
    position: 0.5,
  });
  p = addStorey(p, p, {
    projectId: p.id,
    storeyId: p.groundStoreyId,
    side: "below",
    id: "kg",
    height: 2.7,
  });
  p = selectWorkingStorey(p, p, "kg");
  p = addWall(p, {
    id: "lower",
    start: { x: 0, y: 0 },
    end: { x: 5, y: 0 },
    thickness: 0.3,
    height: 2.5,
  });
  const scene = buildBuildingSolid(p);
  assert.equal(scene.min[2], -2.7);
  assert.equal(scene.max[2], 5.8);
  assert.equal(new Set(scene.faces.map((f) => f.wallId)).size, 3);
  assert.equal(buildBuildingSolid(p), scene);
  const ground = selectWorkingStorey(p, p, p.groundStoreyId);
  assert.deepEqual(buildBuildingSolid(ground), scene);
  assert.equal(workingStoreyForTarget(ground, { kind: "wall", id: "upper" }), "og");
  assert.equal(workingStoreyForTarget(ground, { kind: "window", id: "upper-window" }), "og");
  assert.equal(workingStoreyForTarget(ground, { kind: "wall", id: "missing" }), null);
  const windows = buildingWindowSelectionSurfaces(ground, () => true);
  assert.equal(windows.length, 2);
  assert.equal(
    Math.min(...windows.find((w) => w.id === "upper-window")!.vertices.map((v) => v[2])),
    4,
  );
  const policy = createLayerVisibilityPolicy(ground, ALL_LAYERS_VISIBLE);
  assert.equal(policy.evaluate(ground, policy.context, "upper").eligible, true);
  assert.equal(policy.evaluate(ground, policy.context, "lower").eligible, true);
  const hidden = createLayerVisibilityPolicy(ground, {
    ...ALL_LAYERS_VISIBLE,
    hiddenLayerIds: [ground.storeys.find((s) => s.id === "og")!.walls[0]!.layerId],
  });
  const allows = (id: string) => hidden.evaluate(ground, hidden.context, id).eligible;
  assert.equal(visibleSurfaces(scene, allows).faces.length, 0);
  assert.equal(buildingWindowSelectionSurfaces(ground, allows).length, 0);
  assert.deepEqual(buildBuildingSolid(readProjectFile(serializeProject(ground))), scene);
  assert.equal(await exportIfc(ground, new Date(0)), await exportIfc(p, new Date(0)));
  const raised = setStoreyHeight(ground, ground, {
    projectId: ground.id,
    storeyId: ground.groundStoreyId,
    height: 4,
  });
  assert.equal(buildBuildingSolid(raised).max[2], 6.8);
  assert.equal(buildBuildingSolid(raised).min[2], -2.7);
});

test("whole-building picking uses common depth, including material in another storey", () => {
  let p = fixture();
  p = selectWorkingStorey(p, p, "og");
  p = addWall(p, {
    id: "upper",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  const scene = buildBuildingSolid(p);
  // Top-down: identical XY footprint, the upper wall occludes the ground wall.
  const projection = ([x, y, z]: readonly [number, number, number]): [number, number, number] => [
    (x - 1.5) / 3,
    y,
    -z / 10,
  ];
  assert.deepEqual(pickSolidElement(scene, [], projection, 0, 0), { kind: "wall", id: "upper" });
  const withoutUpper = visibleSurfaces(scene, (id) => id !== "upper");
  assert.equal(pickSolidElement(withoutUpper, [], projection, 0, 0)?.id, "wall-1");
});
