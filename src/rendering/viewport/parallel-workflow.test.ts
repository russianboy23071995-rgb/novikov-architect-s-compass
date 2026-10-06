import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addWall, serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";
import { editInteraction } from "../../application/tools/adapters.ts";
import { evaluateInteraction, confirmInteraction } from "../../application/tools/interaction.ts";
import { resolveToolSnap } from "../../application/tools/snapping.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import { getWallFootSources } from "./wall-foot-sources.ts";
import {
  hoveredSegment,
  withParallelDirections,
} from "../../constraints/inference/segment-hover.ts";
import {
  advanceHoverReference,
  emptyHoverReference,
} from "../../constraints/inference/hover-reference.ts";
import { advanceGuideDirections } from "../../constraints/guides/directions.ts";

test("two-wall 3D parallel workflow: acquire, precise preview, cancel, commit, undo, reload and IFC", async () => {
  let state = createEditingState(
    addWall(createExampleProject(), {
      id: "reference-wall",
      start: { x: 0, y: -3 },
      end: { x: 2.4, y: -1.2 },
      thickness: 0.36,
      height: 2.8,
    }),
  );
  const before = state.history.present,
    selection = { kind: "wall" as const, id: "wall-1" },
    anchor = { x: 3, y: -0.18 };
  const begin = () => {
    state = editingReducer(state, {
      type: "begin",
      target: selection,
      action: "move",
      index: 0,
      anchor,
    });
  };
  begin();
  const createTool = () => {
    const session = state.session!;
    return editInteraction(
      session,
      state.history.present,
      selection,
      (point) => {
        state = editingReducer(state, { type: "confirm", session, selection, point });
      },
      () => {
        state = editingReducer(state, { type: "cancel" });
      },
    );
  };
  let tool = createTool();
  const projection = createProjectionState(
    createProjectionFrame(buildSolid(before)),
    { ...initialCamera, yaw: 0, pitch: 0.5 },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
  const { context } = createWallPreviewContext(
    before,
    projection,
    true,
    0,
    tool.snapping,
    selection.id,
  );
  const segment = getWallFootSources(before).allSegments.find(
    (s) =>
      s.source.entityId === "reference-wall" &&
      Math.abs(s.end.x - s.start.x) > 2 &&
      context.acceptReference!(s.source),
  )!;
  assert.ok(segment);
  const cursor = {
    x: segment.start.x * 0.7 + segment.end.x * 0.3,
    y: segment.start.y * 0.7 + segment.end.y * 0.3,
  };
  const ref = hoveredSegment(
    cursor,
    context.sourceQuery!(cursor, 1, 10, [tool.snapping.origin]),
    context.metric!,
  )!;
  assert.ok(ref?.segment);
  let hover = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  assert.equal(advanceHoverReference(hover, ref, 599, 600).references.length, 0);
  hover = advanceHoverReference(hover, ref, 600, 600);
  const active = withParallelDirections([tool.snapping.origin, ...hover.references]);
  const aim = { x: 4.6, y: 1.025 };
  const result = resolveToolSnap(
    tool.snapping,
    aim,
    {
      ...context,
      activeReferences: active,
      guideDirections: advanceGuideDirections(aim, active, []),
      endpointRadiusPx: 10,
      gridSpacing: null,
    },
    { ortho: false, shift: false, featureSnap: true },
  );
  assert.ok(
    Math.abs((result.point.y - anchor.y) * 0.8 - (result.point.x - anchor.x) * 0.6) < 1e-9,
    JSON.stringify({ ref, result }),
  );
  const input = evaluateInteraction(tool, "", "2,5", result.point);
  assert.equal(input.error, "");
  assert.ok(input.value);
  assert.ok(Math.abs(input.value.point.x - 5) < 1e-9);
  assert.ok(Math.abs(input.value.point.y - 1.32) < 1e-9);
  const preview = previewEdit(state.session!, before, selection, input.value.point);
  assert.equal(state.history.past.length, 0);
  tool.cancel();
  assert.equal(state.history.present, before);
  begin();
  tool = createTool();
  assert.equal(evaluateInteraction(tool, "566", "2.5", result.point).value, null);
  assert.equal(state.history.past.length, 0);
  confirmInteraction(tool, input.value.point);
  assert.deepEqual(state.history.present, preview);
  assert.equal(state.history.past.length, 1);
  const moved = state.history.present,
    wall = moved.storey.walls[0]!;
  assert.ok(Math.abs(wall.start.x - 2) < 1e-9 && Math.abs(wall.start.y - 1.5) < 1e-9);
  assert.ok(Math.abs(wall.end.x - 5) < 1e-9 && Math.abs(wall.end.y - 1.5) < 1e-9);
  assert.deepEqual(moved.storey.walls[1], before.storey.walls[1]);
  assert.deepEqual(moved.storey.windows, before.storey.windows);
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, before);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, moved);
  const restored = readProjectFile(serializeProject(moved));
  assert.deepEqual(restored, moved);
  assert.deepEqual(buildSolid(restored), buildSolid(preview));
  const date = new Date("2026-10-04T12:00:00Z");
  const ifc = await exportIfc(restored, date);
  assert.equal(ifc, await exportIfc(moved, date));
  assert.equal(ifc.split("\n").filter((r) => r.includes("=IFCWALL(")).length, 2);
  assert.equal(ifc.split("\n").filter((r) => r.includes("=IFCWINDOW(")).length, 1);
  assert.match(ifc, /IFCCARTESIANPOINT\(\(2\.,1\.5,0\.\)\)/);
  assert.match(ifc, /IFCLENGTHMEASURE\(3\.\)/);
});
