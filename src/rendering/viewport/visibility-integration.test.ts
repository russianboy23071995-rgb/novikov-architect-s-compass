import assert from "node:assert/strict";
import test from "node:test";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import {
  createLayerVisibilityPolicy,
  visibleLayerTarget,
  isLayerVisible,
} from "../../application/layers/visibility.ts";
import { createVisibleToolSourceQuery } from "../../application/tools/snapping.ts";
import { createEditingState, editingReducer } from "../../application/direct-edit/controller.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { updateWall } from "../../lib/bim/model.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import { visiblePlanGeometry, visibleSurfaces } from "./layer-display.ts";

const p = createExampleProject();
const visible = createLayerVisibilityPolicy(p, {
  scope: { kind: "bim-project" },
  hiddenLayerIds: [],
});
const hidden = createLayerVisibilityPolicy(p, {
  scope: { kind: "bim-project" },
  hiddenLayerIds: [p.defaultLayerIds.wall],
});
const view = createProjectionState(
  createProjectionFrame(buildSolid(p)),
  { ...initialCamera, yaw: 0, pitch: 0.5 },
  { left: 0, top: 0, width: 800, height: 600 },
  { width: 800, height: 600 },
)!;

test("3D footpoint and edge sources obey layer visibility, including remote active references", () => {
  const a = createWallPreviewContext(p, view, true, 0, null, undefined, visible);
  const b = createWallPreviewContext(p, view, true, 0, null, undefined, hidden);
  const cursor = { x: 0, y: -0.18 };
  const references = a.context.sourceQuery!(cursor, 1, 10, []);
  assert.ok(references.length > 0);
  assert.deepEqual(b.context.sourceQuery!(cursor, 1, 10, references), []);
  for (const r of references) assert.equal(b.context.acceptReference!(r), false);
  const screen = view.workplane(0);
  assert.equal(screen.status, "ok");
  if (screen.status !== "ok") return;
  const hit = screen.value.toScreen(cursor);
  assert.equal(hit.status, "ok");
  if (hit.status !== "ok") return;
  const result = b.adapter!.query(p, view, hit.value, 10);
  assert.deepEqual(result, { status: "ok", candidates: [] });
});

test("active 2D references are rejected before Shift origin selection; independent drawing can keep them", () => {
  const a = createVisibleToolSourceQuery(p, visible, visible.context, null);
  const b = createVisibleToolSourceQuery(p, hidden, hidden.context, null);
  const refs = a({ x: 0, y: 0 }, 100, 10, []);
  assert.ok(refs.length);
  assert.ok(refs.some(a.accepts));
  assert.equal(refs.filter(b.accepts).length, 0);
  const drawing = createLayerVisibilityPolicy(p, {
    scope: { kind: "drawing-document", documentId: "drawing" },
    hiddenLayerIds: [],
  });
  const c = createVisibleToolSourceQuery(p, drawing, drawing.context, null);
  assert.equal(refs.filter(c.accepts).length, refs.length);
});

test("hiding a selected editing target cancels without history mutation and rejects host windows", () => {
  const target = { kind: "wall" as const, id: "wall-1" };
  const state = editingReducer(createEditingState(p), {
    type: "begin",
    target,
    action: "move",
    index: 0,
  });
  assert.ok(state.session);
  assert.equal(visibleLayerTarget(p, visible, target), target);
  assert.equal(visibleLayerTarget(p, hidden, target), null);
  assert.equal(visibleLayerTarget(p, hidden, { id: "window-1" }), null);
  const cancelled = editingReducer(state, { type: "cancel" });
  assert.equal(cancelled.session, null);
  assert.equal(cancelled.history, state.history);
  assert.deepEqual(cancelled.history.present, p);
  const changed = updateWall(p, "wall-1", { height: 3 });
  assert.equal(visibleLayerTarget(changed, visible, target), null);
});

test("edit previews use committed eligibility for both plan and surfaces, retaining full bounds", () => {
  const preview = updateWall(p, "wall-1", { end: { x: 6, y: 0 } });
  const geometry = buildSolid(preview);
  const allowed = (id: string) => isLayerVisible(p, visible, id);
  const denied = (id: string) => isLayerVisible(p, hidden, id);
  assert.equal(visiblePlanGeometry(preview, allowed).walls[0]!.end.x, 6);
  assert.equal(visiblePlanGeometry(preview, denied).walls.length, 0);
  assert.equal(visiblePlanGeometry(preview, denied).openings.length, 0);
  const surfaces = visibleSurfaces(geometry, denied);
  assert.equal(surfaces.faces.length, 0);
  assert.equal(surfaces.min, geometry.min);
  assert.equal(surfaces.max, geometry.max);
  assert.equal(p.storey.walls[0]!.end.x, 3);
});
