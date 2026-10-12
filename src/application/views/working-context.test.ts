import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { resolveWorkingView, assertWorkingViewCurrent } from "./working-context.ts";
import { changeProjectScale } from "./project-scale.ts";
import { updateWall, serializeProject } from "../../lib/bim/model.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../../lib/bim/history.ts";
import { changeLayerVisibility, emptyVisibilityHistory } from "../layers/visibility-actions.ts";
import { visibleLayerTarget, isLayerVisible } from "../layers/visibility.ts";
import { createVisibleToolSourceQuery } from "../tools/snapping.ts";
import { visiblePlanGeometry } from "../../rendering/viewport/layer-display.ts";
import { resolveModelLength } from "../../domain/views/display-size.ts";
import { zoomPlan } from "../../rendering/viewport/plan-camera.ts";
import type { WorkingPlanIdentity } from "../../domain/views/scale.ts";

test("working binding rejects foreign, unknown and stale contexts without a fallback", () => {
  const p = createExampleProject(),
    context = resolveWorkingView(p);
  assert.deepEqual(context.binding, context.scale.view);
  assertWorkingViewCurrent(context, p);
  for (const binding of [
    { ...context.binding, projectId: "other" },
    { ...context.binding, storeyId: "other" },
    { kind: "drawing-document", documentId: "missing" },
  ])
    assert.throws(() => resolveWorkingView(p, binding as WorkingPlanIdentity));
  const loaded = readProjectFile(serializeProject(p));
  assert.throws(() => assertWorkingViewCurrent(context, loaded));
  const changed = updateWall(p, "wall-1", { height: 3 });
  assert.throws(() => assertWorkingViewCurrent(context, changed));
  assert.equal(
    context.visibility.evaluate(changed, context.visibility.context, "wall-1").eligible,
    false,
  );
});

test("explicit visibility overrides remain independent and gate rendering, selection and snap together", () => {
  const p = createExampleProject();
  const hiddenProject = changeLayerVisibility(p, p, emptyVisibilityHistory(), {
    kind: "set",
    layerId: p.defaultLayerIds.wall,
    visible: false,
  }).project;
  const hidden = resolveWorkingView(hiddenProject);
  const override = resolveWorkingView(hiddenProject, undefined, {
    scope: { kind: "drawing-document", documentId: "explicit-test-policy" },
    hiddenLayerIds: [],
  });
  assert.equal(override.visibility.context.scope.kind, "drawing-document");
  for (const id of ["wall-1", "window-1"]) {
    assert.equal(visibleLayerTarget(hiddenProject, hidden.visibility, { id }), null);
    assert.ok(visibleLayerTarget(hiddenProject, override.visibility, { id }));
  }
  const plan = visiblePlanGeometry(hiddenProject, (id) =>
    isLayerVisible(hiddenProject, hidden.visibility, id),
  );
  assert.equal(plan.walls.length, 0);
  assert.equal(plan.openings.length, 0);
  const query = (ctx: typeof hidden) =>
    createVisibleToolSourceQuery(hiddenProject, ctx.visibility, ctx.visibility.context, null);
  assert.deepEqual(query(hidden)({ x: 0, y: 0 }, 100, 10, []), []);
  assert.ok(query(override)({ x: 0, y: 0 }, 100, 10, []).length);
  assert.throws(() =>
    resolveWorkingView(p, undefined, {
      scope: { kind: "bim-project" },
      hiddenLayerIds: ["missing"],
    }),
  );
});

test("two panes share resolved paper scale while camera changes leave the context unchanged", () => {
  const p = createExampleProject(),
    first = resolveWorkingView(p);
  const context = resolveWorkingView(changeProjectScale(p, first.binding, 50));
  const a = { context, camera: { center: { x: 0, y: 0 }, pixelsPerMetre: 100 } };
  const b = { context, camera: { center: { x: 0, y: 0 }, pixelsPerMetre: 100 } };
  const scale = context.scale,
    visibility = context.visibility;
  a.camera = zoomPlan(a.camera, { width: 800, height: 600 }, 2);
  assert.equal(b.camera.pixelsPerMetre, 100);
  assert.equal(a.camera.pixelsPerMetre, 200);
  assert.equal(a.context.scale, scale);
  assert.equal(b.context.visibility, visibility);
  assert.equal(resolveModelLength({ mode: "paper", metres: 0.002 }, a.context.scale), 0.1);
  assert.equal(resolveModelLength({ mode: "paper", metres: 0.002 }, b.context.scale), 0.1);
});

test("resolved settings retain existing model undo, palette history and file round-trip rules", () => {
  const p = createExampleProject();
  let history = createHistory(p);
  history = commitProject(history, updateWall(p, "wall-1", { height: 3 }));
  history = commitProject(
    history,
    changeProjectScale(history.present, resolveWorkingView(history.present).binding, 50),
  );
  const filter = changeLayerVisibility(history.present, history.present, emptyVisibilityHistory(), {
    kind: "set",
    layerId: p.defaultLayerIds.wall,
    visible: false,
  });
  history = commitProject(history, filter.project);
  assert.equal(history.past.length, 1);
  history = undoProject(history);
  assert.equal(history.present.storey.walls[0]!.height, 2.8);
  for (const project of [
    history.present,
    redoProject(history).present,
    readProjectFile(serializeProject(history.present)),
  ]) {
    const context = resolveWorkingView(project);
    assert.equal(context.scale.denominator, 50);
    assert.equal(isLayerVisible(project, context.visibility, "window-1"), false);
  }
  const restored = changeLayerVisibility(history.present, history.present, filter.history, {
    kind: "undo",
  }).project;
  assert.equal(isLayerVisible(restored, resolveWorkingView(restored).visibility, "window-1"), true);
});
