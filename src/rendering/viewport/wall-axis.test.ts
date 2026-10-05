import test from "node:test";
import assert from "node:assert/strict";
import { selectedWallAxis } from "./wall-axis.ts";
import { createProjectionState } from "./projection-state.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { updateWall } from "../../lib/bim/model.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";

const project = createExampleProject();
const selection = { kind: "wall" as const, id: "wall-1" };
const frame = createProjectionFrame(buildSolid(project));
const viewport = { left: 40, top: 70, width: 800, height: 600 };
const projection = createProjectionState(frame, initialCamera, viewport, {
  width: 800,
  height: 600,
})!;
const axis = (p = project, view = projection) => selectedWallAxis(p, selection, () => true, view)!;

test("3D axis stays on drawing endpoints despite signed body offset; selection and visibility gate it", () => {
  for (const offset of [-0.18, 0, 0.09, 0.18]) {
    const p = updateWall(project, selection.id, { bodyOffset: offset });
    assert.deepEqual(axis(p), axis());
  }
  assert.equal(
    selectedWallAxis(project, null, () => true, projection),
    null,
  );
  assert.equal(
    selectedWallAxis(project, { kind: "window", id: "window-1" }, () => true, projection),
    null,
  );
  assert.equal(
    selectedWallAxis(project, selection, () => false, projection),
    null,
  );
  assert.equal(
    selectedWallAxis(project, { kind: "wall", id: "missing" }, () => true, projection),
    null,
  );
  for (const zoom of [0.2, 1, 5]) {
    const view = createProjectionState(
      frame,
      { ...initialCamera, zoom, yaw: 0.9, pitch: 0.5 },
      viewport,
      { width: 1600, height: 1200 },
    )!;
    const result = axis(project, view);
    const ndc = view.project([3, 0, 0]);
    assert.deepEqual(result.end, { x: (ndc[0] + 1) * 400, y: (1 - ndc[1]) * 300 });
  }
});

test("axis follows the shared move preview, cancellation, commit and undo/redo", () => {
  const begin = editingReducer(createEditingState(project), {
    type: "begin",
    target: selection,
    action: "move",
    index: null,
    anchor: { x: 0, y: 0 },
  });
  const preview = previewEdit(begin.session!, begin.history.present, selection, { x: 2, y: 1 });
  assert.notDeepEqual(axis(preview), axis());
  assert.deepEqual(preview.storey.walls[0]!.start, { x: 2, y: 1 });
  assert.deepEqual(axis(editingReducer(begin, { type: "cancel" }).history.present), axis());
  const committed = editingReducer(begin, {
    type: "confirm",
    session: begin.session!,
    selection,
    point: { x: 2, y: 1 },
  });
  assert.deepEqual(axis(committed.history.present), axis(preview));
  const undone = editingReducer(committed, { type: "undo" });
  assert.deepEqual(axis(undone.history.present), axis());
  assert.deepEqual(axis(editingReducer(undone, { type: "redo" }).history.present), axis(preview));
});
