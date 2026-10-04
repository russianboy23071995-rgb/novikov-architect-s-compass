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
  supportsWallWorkplaneEdit,
} from "../../application/direct-edit/controller.ts";
import { editInteraction } from "../../application/tools/adapters.ts";
import { evaluateInteraction, confirmInteraction } from "../../application/tools/interaction.ts";
import { resolveToolSnap } from "../../application/tools/snapping.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";
import { exportIfc, stepReal } from "../../lib/bim/ifc.ts";
import { updateWall, wallLength } from "../../lib/bim/model.ts";
import {
  projectSnapPrimitives,
  wallEndpointIndex,
} from "../../application/snapping/project-references.ts";
import { createWallPointCandidates } from "./wall-point-candidates.ts";
import { numericMoveAxis } from "../../application/direct-edit/numeric.ts";

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

test("workplane capabilities keep point/stretch tied to endpoints and exclude other elements", () => {
  for (const action of ["move", "point", "stretch", "axis", "x", "y"] as const) {
    for (const kind of ["wall", "window", "line"] as const) {
      for (const index of [null, 0, 1, 2, -1]) {
        assert.equal(
          supportsWallWorkplaneEdit({ kind, id: "id" }, action, index),
          kind === "wall" && (!["point", "stretch"].includes(action) || index === 0 || index === 1),
        );
      }
    }
  }
});

test("3D axis/stretch use the existing fixed direction ahead of Shift/Ortho and numeric input", async () => {
  for (const action of ["axis", "x", "y", "stretch"] as const)
    for (const angle of [0.7, Math.PI])
      for (const index of [0, 1])
        for (const metres of [0.75, -0.5]) {
          let state = createEditingState(
            updateWall(project, "wall-1", {
              end: { x: 3 * Math.cos(angle), y: 3 * Math.sin(angle) },
            }),
          );
          const base = state.history.present;
          const ref = projectSnapPrimitives(base).references.find(
            (r) => r.feature === `corner-${index}--1`,
          )!;
          state = editingReducer(state, {
            type: "begin",
            target: selection,
            action,
            index,
            anchor: ref.point,
          });
          const session = state.session!;
          const tool = editInteraction(
            session,
            base,
            selection,
            (point) => {
              state = editingReducer(state, { type: "confirm", session, selection, point });
            },
            noop,
          );
          const axis = numericMoveAxis(session)!;
          assert.ok(axis);
          assert.equal(tool.click, "confirm");
          assert.equal(tool.input!.axisLabel, axis.label);
          const context = createWallPreviewContext(
            base,
            projection,
            true,
            0,
            tool.snapping,
            selection.id,
          ).context;
          assert.deepEqual(context.pinnedReferences![0]!.point, ref.point);
          const expected = {
            x: ref.point.x + axis.direction.x * metres,
            y: ref.point.y + axis.direction.y * metres,
          };
          // Cursor intentionally off the fixed axis; modifiers must not change that axis.
          const cursor = {
            x: expected.x - axis.direction.y * 0.17,
            y: expected.y + axis.direction.x * 0.17,
          };
          for (const enabled of [true, false]) {
            const result = resolveToolSnap(
              tool.snapping,
              cursor,
              {
                ...context,
                enabled,
                activeReferences: [tool.snapping.origin],
                endpointRadiusPx: 10,
                gridSpacing: null,
              },
              { ortho: true, shift: true, featureSnap: enabled },
            );
            assert.ok(Math.hypot(result.point.x - expected.x, result.point.y - expected.y) < 1e-9);
          }
          const input = evaluateInteraction(tool, "123", String(metres), cursor).value!;
          assert.ok(input);
          assert.equal(input.degrees, axis.degrees);
          const preview = previewEdit(session, base, selection, input.point);
          assert.equal(state.history.past.length, 0);
          assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
          confirmInteraction(tool, input.point);
          assert.deepEqual(state.history.present, preview);
          assert.equal(state.history.past.length, 1);
          const changed = state.history.present,
            wall = changed.storey.walls[0]!,
            before = base.storey.walls[0]!;
          if (action === "stretch") {
            assert.deepEqual(
              index === 0 ? wall.end : wall.start,
              index === 0 ? before.end : before.start,
            );
            assert.ok(Math.abs(wallLength(wall) - (3 + metres)) < 1e-9);
          } else {
            for (const p of ["start", "end"] as const) {
              assert.ok(
                Math.hypot(
                  wall[p].x - before[p].x - metres * axis.direction.x,
                  wall[p].y - before[p].y - metres * axis.direction.y,
                ) < 1e-9,
              );
            }
          }
          assert.equal(wall.thickness, 0.36);
          assert.equal(wall.height, 2.8);
          assert.deepEqual(changed.storey.windows, base.storey.windows);
          assert.deepEqual(deserializeProject(serializeProject(changed)), changed);
          const undone = editingReducer(state, { type: "undo" });
          assert.deepEqual(undone.history.present, base);
          assert.deepEqual(editingReducer(undone, { type: "redo" }).history.present, changed);
          const ifc = await exportIfc(changed, new Date("2026-10-04T12:00:00Z"));
          assert.ok(ifc.includes(`IFCLENGTHMEASURE(${stepReal(wallLength(wall))})`));
          assert.ok(
            ifc.includes(
              `IFCCARTESIANPOINT((${stepReal(wall.start.x)},${stepReal(wall.start.y)},0.))`,
            ),
          );
        }
});

test("3D stretch rejects window conflict and crossing the opposite end without an undo entry", () => {
  for (const index of [0, 1]) {
    let state = createEditingState(project);
    const base = state.history.present;
    const ref = projectSnapPrimitives(base).references.find(
      (r) => r.feature === `corner-${index}--1`,
    )!;
    state = editingReducer(state, {
      type: "begin",
      target: selection,
      action: "stretch",
      index,
      anchor: ref.point,
    });
    const session = state.session!;
    const tool = editInteraction(
      session,
      base,
      selection,
      (point) => {
        state = editingReducer(state, { type: "confirm", session, selection, point });
      },
      noop,
    );
    for (const length of ["-2.5", "-3", "-4", "Infinity"]) {
      assert.equal(evaluateInteraction(tool, "", length, null).value, null);
      assert.equal(state.history.present, base);
      assert.equal(state.history.past.length, 0);
    }
    const axis = numericMoveAxis(session)!;
    assert.throws(() =>
      confirmInteraction(tool, {
        x: ref.point.x - axis.direction.x * 2.5,
        y: ref.point.y - axis.direction.y * 2.5,
      }),
    );
    assert.equal(state.session, session);
    confirmInteraction(tool, evaluateInteraction(tool, "", "1", null).value!.point);
    assert.equal(wallLength(state.history.present.storey.walls[0]!), 4);
    assert.equal(state.history.past.length, 1);
  }
});

test("3D picking maps axis ends and all physical corners to their stable wall endpoint", () => {
  for (const angle of [0, 0.7, Math.PI, -1.9]) {
    const rotated = updateWall(project, "wall-1", {
      end: { x: 3 * Math.cos(angle), y: 3 * Math.sin(angle) },
    });
    const view = createProjectionState(
      createProjectionFrame(buildSolid(rotated)),
      { ...initialCamera, yaw: angle, pitch: 0.6 },
      projection.viewport,
      projection.backbuffer,
    )!;
    const plane = view.workplane(0);
    assert.equal(plane.status, "ok");
    if (plane.status !== "ok") throw Error("plane");
    const adapter = createWallPointCandidates(rotated, view);
    for (const ref of projectSnapPrimitives(rotated).references) {
      const screen = plane.value.toScreen(ref.point);
      if (screen.status !== "ok") throw Error("screen");
      const found = adapter.query(rotated, view, screen.value, 10);
      if (found.status !== "ok") throw Error("query");
      const candidate = found.candidates.find((c) => c.sourceFeature === ref.feature)!;
      assert.ok(candidate);
      const expected =
        ref.kind === "midpoint"
          ? null
          : ref.feature.startsWith("corner-0-") || ref.feature === "axis-start"
            ? 0
            : 1;
      assert.equal(candidate.pointIndex, expected);
      assert.deepEqual(candidate.worldPoint, ref.point);
      assert.equal(candidate.sourceEntityId, "wall-1");
    }
  }
  for (const feature of ["corner-2-1", "vertex-0", "intersection", "", "corner-0-1:stale"])
    assert.equal(wallEndpointIndex(feature), null);
});

test("picked 3D corners reuse polar input, offset geometry, pinned inference and one transaction", async () => {
  for (const feature of ["corner-0--1", "corner-0-1", "corner-1--1", "corner-1-1"]) {
    let state = createEditingState(project);
    const base = state.history.present;
    const ref = projectSnapPrimitives(base).references.find((r) => r.feature === feature)!;
    const index = wallEndpointIndex(ref.feature)!;
    state = editingReducer(state, {
      type: "begin",
      target: selection,
      action: "point",
      index,
      anchor: ref.point,
    });
    const session = state.session!;
    const tool = editInteraction(
      session,
      base,
      selection,
      (point) => {
        state = editingReducer(state, { type: "confirm", session, selection, point });
      },
      noop,
    );
    assert.equal(tool.click, "confirm");
    const context = createWallPreviewContext(
      base,
      projection,
      true,
      0,
      tool.snapping,
      selection.id,
    ).context;
    assert.deepEqual(context.pinnedReferences, [tool.snapping.origin]);
    assert.deepEqual(tool.snapping.origin.point, ref.point);
    assert.ok(
      context.sourceQuery!(ref.point, 1, 1000, [tool.snapping.origin]).every(
        (r) => r.entityId !== "wall-1",
      ),
    );
    // A sideways target exercises the corner-offset rule, not just an axial length change.
    const value = evaluateInteraction(tool, "90", "1", null).value!;
    assert.ok(value);
    const preview = previewEdit(session, base, selection, value.point);
    assert.equal(state.history.present, base);
    assert.equal(state.history.past.length, 0);
    assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
    confirmInteraction(tool, value.point);
    assert.equal(state.history.past.length, 1);
    const edited = state.history.present;
    assert.deepEqual(edited, preview);
    const wall = edited.storey.walls[0]!;
    assert.deepEqual(
      index === 0 ? wall.end : wall.start,
      index === 0 ? base.storey.walls[0]!.end : base.storey.walls[0]!.start,
    );
    assert.equal(wall.thickness, 0.36);
    assert.equal(wall.height, 2.8);
    assert.deepEqual(edited.storey.windows, base.storey.windows);
    const physicalCorner = projectSnapPrimitives(edited).references.find(
      (r) => r.feature === feature,
    )!.point;
    assert.ok(
      Math.hypot(physicalCorner.x - value.point.x, physicalCorner.y - value.point.y) < 1e-9,
    );
    assert.ok(
      buildSolid(edited).faces.some((f) =>
        f.vertices.some(
          (v) => v[2] === 0 && Math.hypot(v[0] - value.point.x, v[1] - value.point.y) < 1e-9,
        ),
      ),
    );
    assert.deepEqual(deserializeProject(serializeProject(edited)), edited);
    const ifc = await exportIfc(edited, new Date("2026-10-04T12:00:00Z"));
    assert.ok(ifc.includes(`IFCLENGTHMEASURE(${stepReal(wallLength(wall))})`));
    assert.ok(
      ifc.includes(`IFCCARTESIANPOINT((${stepReal(wall.start.x)},${stepReal(wall.start.y)},0.))`),
    );
    assert.ok(ifc.includes("IFCRATIOMEASURE(0.5)"));
    const undone = editingReducer(state, { type: "undo" });
    assert.deepEqual(undone.history.present, base);
    assert.deepEqual(editingReducer(undone, { type: "redo" }).history.present, edited);
  }
});

test("3D corner rejects impossible targets and too-short walls without losing the active edit", () => {
  let state = createEditingState(project);
  const base = state.history.present;
  state = editingReducer(state, {
    type: "begin",
    target: selection,
    action: "point",
    index: 1,
    anchor: { x: 3, y: -0.18 },
  });
  const session = state.session!;
  const tool = editInteraction(
    session,
    base,
    selection,
    (point) => {
      state = editingReducer(state, { type: "confirm", session, selection, point });
    },
    noop,
  );
  for (const point of [
    { x: 0, y: 0 },
    { x: 0.5, y: -0.18 },
    { x: Infinity, y: 0 },
  ]) {
    assert.throws(() => confirmInteraction(tool, point));
    assert.equal(state.history.present, base);
    assert.equal(state.session, session);
    assert.equal(state.history.past.length, 0);
  }
  assert.equal(evaluateInteraction(tool, "180", "2.5", null).value, null);
  confirmInteraction(tool, { x: 4, y: -0.18 });
  assert.equal(wallLength(state.history.present.storey.walls[0]!), 4);
  assert.equal(state.history.past.length, 1);
});

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
