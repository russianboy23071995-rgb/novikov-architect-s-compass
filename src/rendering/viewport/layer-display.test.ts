import assert from "node:assert/strict";
import { test } from "node:test";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addWall, addLine, updateWall, serializeProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { createLayerVisibilityPolicy } from "../../application/layers/visibility.ts";
import { createLayerDisplay } from "./layer-display.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { pickWallInProjection } from "../../lib/bim/picking.ts";
import { classifyAnchorVisibility } from "./anchor-visibility.ts";

const camera = { yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 };
const projection = (solid: ReturnType<typeof buildSolid>) =>
  createProjectionState(
    createProjectionFrame(solid),
    camera,
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;

test("all-visible display matches complete geometry and plan; hidden symbols retain physical voids", async () => {
  const p = addLine(createExampleProject(), {
    id: "l",
    kind: "line",
    points: [
      { x: 0, y: 2 },
      { x: 3, y: 2 },
    ],
    ...defaultLineAppearance,
  });
  const json = serializeProject(p),
    solid = buildSolid(p);
  const date = new Date("2026-10-05T00:00:00Z"),
    ifc = await exportIfc(p, date);
  const all = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const visible = createLayerDisplay(p, all, all.context);
  assert.deepEqual(visible.surfaces.faces, solid.faces);
  assert.deepEqual(visible.plan.walls, p.storey.walls);
  assert.deepEqual(visible.plan.windows, p.storey.windows);
  assert.deepEqual(visible.plan.lines, p.storey.lines);
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.window, p.defaultLayerIds.line],
  });
  const display = createLayerDisplay(p, hidden, hidden.context);
  assert.equal(display.plan.windows.length, 0);
  assert.equal(display.plan.lines.length, 0);
  assert.deepEqual(display.plan.openings, p.storey.windows);
  assert.deepEqual(display.surfaces, visible.surfaces);
  assert.equal(display.canPick(p, hidden.context, "window-1"), false);
  assert.equal(display.canPick(p, hidden.context, "l"), false);
  const view = projection(solid),
    point = view.project([1.5, -0.18, 1.5]);
  assert.equal(
    pickWallInProjection(display.surfaces, view.frame, camera, view.aspect, point[0], point[1]),
    null,
  );
  assert.equal(serializeProject(p), json);
  assert.equal(await exportIfc(p, date), ifc);
});

test("hidden front wall neither picks nor occludes the visible wall behind it", () => {
  const p0 = createExampleProject();
  const frontLayer = p0.layers.find((l) => l.name === "Innenwand")!.id;
  const p = addWall(p0, {
    id: "front",
    start: { x: 0, y: -1 },
    end: { x: 3, y: -1 },
    thickness: 0.36,
    height: 2.8,
    layerId: frontLayer,
  });
  const solid = buildSolid(p),
    view = projection(solid),
    point = view.project([0.3, -0.18, 1.5]);
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [frontLayer],
  });
  const display = createLayerDisplay(p, hidden, hidden.context);
  assert.equal(
    pickWallInProjection(solid, view.frame, camera, view.aspect, point[0], point[1]),
    "front",
  );
  assert.equal(
    pickWallInProjection(display.surfaces, view.frame, camera, view.aspect, point[0], point[1]),
    "wall-1",
  );
  assert.equal(classifyAnchorVisibility(solid, view, [0.3, -0.18, 1.5]), "occluded");
  assert.equal(classifyAnchorVisibility(display.surfaces, view, [0.3, -0.18, 1.5]), "visible");
  assert.deepEqual(display.surfaces.min, solid.min);
  assert.deepEqual(display.surfaces.max, solid.max);
  assert.equal(
    display.plan.walls.some((w) => w.id === "front"),
    false,
  );
  assert.equal(display.canPick(p, hidden.context, "front"), false);
});

test("hidden host removes plan symbols and solid surfaces but independent drawing retains them", () => {
  const p = createExampleProject();
  const bim = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.wall],
  });
  const drawing = createLayerVisibilityPolicy(p, {
    scope: { kind: "drawing-document", documentId: "d" },
    hiddenLayerIds: [],
  });
  const hidden = createLayerDisplay(p, bim, bim.context),
    visible = createLayerDisplay(p, drawing, drawing.context);
  assert.deepEqual(hidden.plan, { walls: [], windows: [], lines: [], openings: [] });
  assert.equal(hidden.surfaces.faces.length, 0);
  assert.ok(hidden.surfaces.min.every(Number.isFinite));
  assert.equal(hidden.canPick(p, bim.context, "window-1"), false);
  assert.equal(visible.plan.windows.length, 1);
  assert.ok(visible.surfaces.faces.length > 0);
  assert.equal(visible.canPick(p, drawing.context, "window-1"), true);
});

test("stale display construction and delayed hit events cannot revive hidden targets", () => {
  const p = createExampleProject();
  const all = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const display = createLayerDisplay(p, all, all.context);
  const next = updateWall(p, "wall-1", { height: 3 });
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.wall],
  });
  assert.throws(() => createLayerDisplay(next, all, all.context), /Stale/);
  assert.throws(() => createLayerDisplay(p, all, hidden.context), /Stale/);
  assert.equal(display.canPick(next, all.context, "wall-1"), false);
  assert.equal(display.canPick(p, hidden.context, "wall-1"), false);
  assert.equal(display.canPick(p, all.context, "missing"), false);
});
