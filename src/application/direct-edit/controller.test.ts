import test from "node:test";
import assert from "node:assert/strict";
import { createEditingState, editingReducer, previewEdit } from "./controller.ts";
import {
  createProject,
  addWall,
  addWindow,
  addLine,
  serializeProject,
  updateWall,
} from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";

const wall = { kind: "wall" as const, id: "wall" };
const initial = () =>
  createEditingState(
    addWindow(
      addWall(createProject("project", "storey"), {
        id: "wall",
        start: { x: 0, y: 0 },
        end: { x: 3, y: 0 },
        thickness: 0.36,
        height: 2.8,
      }),
      { id: "window", wallId: "wall", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 },
    ),
  );
const begin = () =>
  editingReducer(initial(), { type: "begin", target: wall, action: "move", index: null });

test("repeated previews preserve history and model; one confirmation has one reversible commit", () => {
  const state = begin();
  const before = serializeProject(state.history.present);
  for (let i = 1; i <= 40; i++) {
    const preview = previewEdit(state.session!, state.history.present, wall, { x: i, y: 2 });
    assert.deepEqual(preview.storey.walls[0]!.start, { x: i, y: 2 });
  }
  assert.equal(serializeProject(state.history.present), before);
  assert.equal(state.history.past.length, 0);
  const moved = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 4, y: 2 },
  });
  assert.equal(moved.error, "");
  assert.equal(moved.session, null);
  assert.equal(moved.history.past.length, 1);
  assert.deepEqual(moved.history.present.storey.windows, state.history.present.storey.windows);
  assert.equal(serializeProject(editingReducer(moved, { type: "undo" }).history.present), before);
  assert.deepEqual(
    editingReducer(editingReducer(moved, { type: "undo" }), { type: "redo" }).history.present,
    moved.history.present,
  );
});

test("cancel closes the interaction without changing history and rejects delayed confirmation", () => {
  const state = begin();
  const cancelled = editingReducer(state, { type: "cancel" });
  assert.equal(cancelled.history, state.history);
  assert.equal(cancelled.session, null);
  const late = editingReducer(cancelled, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 2, y: 0 },
  });
  assert.equal(late.history, state.history);
  assert.notEqual(late.error, "");
});

test("selection change, stale session and changed model cannot commit", () => {
  const state = begin();
  for (const selection of [
    null,
    { kind: "wall" as const, id: "other" },
    { kind: "line" as const, id: "wall" },
  ]) {
    const rejected = editingReducer(state, {
      type: "confirm",
      session: state.session!,
      selection,
      point: { x: 1, y: 0 },
    });
    assert.equal(rejected.history, state.history);
    assert.notEqual(rejected.error, "");
  }
  const restarted = editingReducer(state, {
    type: "begin",
    target: wall,
    action: "move",
    index: null,
  });
  assert.equal(
    editingReducer(restarted, {
      type: "confirm",
      session: state.session!,
      selection: wall,
      point: { x: 1, y: 0 },
    }).history,
    state.history,
  );
  const changed = editingReducer(state, {
    type: "project",
    project: updateWall(state.history.present, "wall", { height: 3 }),
  });
  assert.equal(changed.session, null);
  assert.throws(() => previewEdit(state.session!, changed.history.present, wall, { x: 1, y: 0 }));
  assert.equal(
    editingReducer(changed, {
      type: "confirm",
      session: state.session!,
      selection: wall,
      point: { x: 1, y: 0 },
    }).history,
    changed.history,
  );
});

test("invalid pointer is atomic and recoverable; no-op preserves redo history", () => {
  const state = begin();
  const invalid = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: NaN, y: 0 },
  });
  assert.equal(invalid.history, state.history);
  assert.equal(invalid.session, state.session);
  const moved = editingReducer(invalid, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 1, y: 0 },
  });
  assert.equal(moved.error, "");
  const undone = editingReducer(moved, { type: "undo" });
  const again = editingReducer(undone, {
    type: "begin",
    target: wall,
    action: "move",
    index: null,
  });
  const noop = editingReducer(again, {
    type: "confirm",
    session: again.session!,
    selection: wall,
    point: again.session!.anchor,
  });
  assert.equal(noop.history, undone.history);
  assert.equal(noop.history.future.length, 1);
});

test("invalid starts and window-invalid point edits leave the committed model intact", () => {
  const state = initial();
  const bad = editingReducer(state, {
    type: "begin",
    target: { kind: "wall", id: "missing" },
    action: "move",
    index: null,
  });
  assert.equal(bad.history, state.history);
  assert.equal(bad.session, null);
  assert.notEqual(bad.error, "");
  const point = editingReducer(state, {
    type: "begin",
    target: wall,
    action: "point",
    index: 1,
    anchor: { x: 3, y: 0 },
  });
  const invalid = editingReducer(point, {
    type: "confirm",
    session: point.session!,
    selection: wall,
    point: { x: 0.5, y: 0 },
  });
  assert.equal(invalid.history, state.history);
  assert.notEqual(invalid.error, "");
});

test("line movement uses the same lifecycle, retaining ID and style through JSON", () => {
  const base = initial();
  const project = addLine(base.history.present, {
    id: "line",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 3 },
    ],
    ...defaultLineAppearance,
  });
  const target = { kind: "line" as const, id: "line" };
  const state = editingReducer(createEditingState(project), {
    type: "begin",
    target,
    action: "move",
    index: null,
  });
  const moved = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: { x: 4, y: 2 },
  });
  const line = moved.history.present.storey.lines![0]!;
  assert.deepEqual(line, {
    ...project.storey.lines![0],
    points: [
      { x: 4, y: 2 },
      { x: 6, y: 2 },
      { x: 6, y: 5 },
    ],
  });
  assert.deepEqual(readProjectFile(serializeProject(moved.history.present)), moved.history.present);
  assert.deepEqual(editingReducer(moved, { type: "undo" }).history.present, project);
});

test("confirmed wall movement survives file, solid geometry and IFC adapters", async () => {
  const state = begin();
  const moved = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: { x: 4, y: 2 },
  });
  const restored = readProjectFile(serializeProject(moved.history.present));
  assert.deepEqual(buildSolid(restored).min, [4, 1.82, 0]);
  assert.deepEqual(buildSolid(restored).max, [7, 2.18, 2.8]);
  assert.equal(restored.storey.windows[0]!.position, 0.5);
  const ifc = await exportIfc(restored, new Date("2026-10-02T00:00:00Z"));
  assert.ok(ifc.includes("IFCCARTESIANPOINT((4.,2.,0.))"));
  assert.ok(ifc.includes("IFCLENGTHMEASURE(3.)"));
});

test("history navigation cancels pending work and duplicate confirmation cannot add another step", () => {
  const state = begin();
  assert.equal(editingReducer(state, { type: "undo" }).session, null);
  assert.equal(editingReducer(state, { type: "redo" }).session, null);
  const event = {
    type: "confirm" as const,
    session: state.session!,
    selection: wall,
    point: { x: 1, y: 2 },
  };
  const once = editingReducer(state, event);
  assert.equal(editingReducer(once, event).history, once.history);
});

import { editSnapReferences, resolveEditSnap } from "./snapping.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import type { SnapContext } from "../../constraints/snapping/engine.ts";

const snapContext = (state: ReturnType<typeof begin>): SnapContext => ({
  references: projectSnapReferences(state.history.present),
  pixelsPerMetre: 100,
  enabled: true,
  endpointRadiusPx: 10,
  gridSpacing: 0.1,
  orthoOrigin: null,
});
const withReference = () =>
  createEditingState(
    addLine(initial().history.present, {
      id: "reference",
      kind: "line",
      points: [
        { x: 4.037, y: 1.023 },
        { x: 6, y: 1.023 },
      ],
      ...defaultLineAppearance,
    }),
  );

test("direct edit excludes its own sources and moving windows exclude their host", () => {
  const state = begin();
  assert.equal(
    editSnapReferences(state.session!, projectSnapReferences(state.history.present)).length,
    0,
  );
  const windowState = editingReducer(initial(), {
    type: "begin",
    target: { kind: "window", id: "window" },
    action: "move",
    index: null,
  });
  assert.ok(windowState.session);
  assert.equal(
    editSnapReferences(windowState.session!, projectSnapReferences(windowState.history.present))
      .length,
    0,
  );
});

for (const action of ["move", "point"] as const)
  test(
    action + ": exact external endpoint gives identical preview and commit with one undo",
    () => {
      const state = editingReducer(withReference(), {
        type: "begin",
        target: wall,
        action,
        index: 1,
        anchor: { x: 3, y: 0 },
      });
      const resolved = resolveEditSnap(state.session!, { x: 4.06, y: 1.04 }, snapContext(state));
      assert.equal(resolved.candidate?.kind, "endpoint");
      assert.deepEqual(resolved.point, { x: 4.037, y: 1.023 });
      const preview = previewEdit(state.session!, state.history.present, wall, resolved.point);
      const committed = editingReducer(state, {
        type: "confirm",
        session: state.session!,
        selection: wall,
        point: resolved.point,
      });
      assert.deepEqual(committed.history.present, preview);
      assert.equal(committed.history.past.length, 1);
      assert.deepEqual(
        editingReducer(committed, { type: "undo" }).history.present,
        state.history.present,
      );
      assert.deepEqual(
        editingReducer(editingReducer(committed, { type: "undo" }), { type: "redo" }).history
          .present,
        preview,
      );
      assert.deepEqual(readProjectFile(serializeProject(preview)), preview);
    },
  );

test("edit endpoint radius is screen based; snap off and Shift use the shared rules", () => {
  const state = editingReducer(withReference(), {
    type: "begin",
    target: wall,
    action: "move",
    index: null,
  });
  const context = snapContext(state);
  for (const pixelsPerMetre of [40, 100, 400]) {
    assert.equal(
      resolveEditSnap(
        state.session!,
        { x: 4.037 + 9 / pixelsPerMetre, y: 1.023 },
        { ...context, pixelsPerMetre },
      ).candidate?.kind,
      "endpoint",
    );
    assert.notEqual(
      resolveEditSnap(
        state.session!,
        { x: 4.037 + 11 / pixelsPerMetre, y: 1.023 },
        { ...context, pixelsPerMetre },
      ).candidate?.kind,
      "endpoint",
    );
  }
  const cursor = { x: 4.06, y: 1.04 };
  assert.deepEqual(
    resolveEditSnap(state.session!, cursor, { ...context, enabled: false }).point,
    cursor,
  );
  const shifted = resolveEditSnap(
    state.session!,
    { x: 2, y: 1.8 },
    { ...context, angleOrigin: state.session!.anchor },
  );
  assert.equal(shifted.candidate?.kind, "angle");
  assert.ok(Math.abs(shifted.point.x - shifted.point.y) < 1e-9);
});

test("explicit edit axis wins over Shift and never labels projected off-axis endpoints", () => {
  const state = editingReducer(withReference(), {
    type: "begin",
    target: wall,
    action: "x",
    index: null,
  });
  const context = { ...snapContext(state), angleOrigin: state.session!.anchor };
  const resolved = resolveEditSnap(state.session!, { x: 4.04, y: 1.023 }, context);
  assert.equal(resolved.point.y, state.session!.anchor.y);
  assert.equal(resolved.candidate, null);
  const onAxis = {
    ...context,
    references: [{ entityId: "other", feature: "end", point: { x: 4.037, y: 0 } }],
  };
  const exact = resolveEditSnap(state.session!, { x: 4.04, y: 0.02 }, onAxis);
  assert.equal(exact.candidate?.kind, "endpoint");
  assert.deepEqual(exact.point, { x: 4.037, y: 0 });
});

test("direct edit reuses activated guide references without attracting to its preview", () => {
  const state = editingReducer(withReference(), {
    type: "begin",
    target: wall,
    action: "move",
    index: null,
  });
  const context = snapContext(state);
  const reference = context.references.find((r) => r.entityId === "reference")!;
  const resolved = resolveEditSnap(
    state.session!,
    { x: 8, y: 1.04 },
    { ...context, activeReferences: [reference] },
  );
  assert.equal(resolved.candidate?.kind, "extension");
  assert.equal(resolved.point.y, reference.point.y);
  assert.deepEqual(state.history.present, withReference().history.present);
});

test("line point editing snaps to wall corners and excludes every vertex of its own polyline", () => {
  const base = addLine(initial().history.present, {
    id: "polygon",
    kind: "polyline",
    points: [
      { x: 4, y: 1 },
      { x: 5, y: 1 },
      { x: 5, y: 2 },
      { x: 4, y: 1 },
    ],
    ...defaultLineAppearance,
  });
  const target = { kind: "line" as const, id: "polygon" };
  const state = editingReducer(createEditingState(base), {
    type: "begin",
    target,
    action: "point",
    index: 0,
    anchor: { x: 4, y: 1 },
  });
  assert.ok(
    editSnapReferences(state.session!, projectSnapReferences(base)).every(
      (r) => r.entityId !== "polygon",
    ),
  );
  const result = resolveEditSnap(state.session!, { x: 3.02, y: 0.19 }, snapContext(state));
  assert.equal(result.candidate?.kind, "endpoint");
  assert.deepEqual(result.point, { x: 3, y: 0.18 });
  const preview = previewEdit(state.session!, state.history.present, target, result.point);
  assert.equal(preview.storey.lines![0]!.points[0]!.x, result.point.x);
  assert.ok(Math.abs(preview.storey.lines![0]!.points[0]!.y - result.point.y) < 1e-12);
  assert.deepEqual(preview.storey.lines![0]!.points.at(-1), preview.storey.lines![0]!.points[0]);
});

test("window snapping stays on its host and invalid target preserves transaction and history", () => {
  const target = { kind: "window" as const, id: "window" };
  const state = editingReducer(initial(), { type: "begin", target, action: "move", index: null });
  const context = {
    ...snapContext(state),
    references: [{ entityId: "other", feature: "end", point: { x: 1.8, y: 0 } }],
  };
  const valid = resolveEditSnap(state.session!, { x: 1.82, y: 0.02 }, context);
  assert.equal(valid.candidate?.kind, "endpoint");
  assert.equal(
    previewEdit(state.session!, state.history.present, target, valid.point).storey.windows[0]!
      .position,
    0.6,
  );
  const invalid = resolveEditSnap(state.session!, { x: 4, y: 0 }, context);
  const rejected = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: invalid.point,
  });
  assert.notEqual(rejected.error, "");
  assert.equal(rejected.history, state.history);
  assert.equal(rejected.session, state.session);
});

test("stretch keeps the selected grip offset and rejects shortening beyond window limits", () => {
  const state = editingReducer(initial(), {
    type: "begin",
    target: wall,
    action: "stretch",
    index: 1,
    anchor: { x: 3, y: 0.18 },
  });
  const context = {
    ...snapContext(state),
    references: [{ entityId: "other", feature: "end", point: { x: 4.037, y: 0.18 } }],
  };
  const valid = resolveEditSnap(state.session!, { x: 4.04, y: 0.2 }, context);
  assert.equal(valid.candidate?.kind, "endpoint");
  assert.deepEqual(
    previewEdit(state.session!, state.history.present, wall, valid.point).storey.walls[0]!.end,
    { x: 4.037, y: 0 },
  );
  assert.throws(() =>
    previewEdit(
      state.session!,
      state.history.present,
      wall,
      resolveEditSnap(state.session!, { x: 0.5, y: 0.18 }, context).point,
    ),
  );
});

test("window host axis accepts external guides but excludes host and dependent sources", () => {
  const target = { kind: "window" as const, id: "window" };
  const state = editingReducer(initial(), { type: "begin", target, action: "move", index: null });
  const external = { entityId: "external", feature: "end", point: { x: 1.8, y: 1 } };
  const context = {
    ...snapContext(state),
    references: [external],
    activeReferences: [external],
    gridSpacing: null,
  };
  const result = resolveEditSnap(state.session!, { x: 1.82, y: 0.02 }, context);
  assert.equal(result.candidate?.kind, "axis-intersection");
  assert.ok(
    Math.abs(
      previewEdit(state.session!, state.history.present, target, result.point).storey.windows[0]!
        .position - 0.6,
    ) < 1e-12,
  );
  const host = { ...external, entityId: "wall" };
  const dependent = { ...external, entityId: "@construction", dependencies: [host] };
  for (const source of [host, dependent])
    assert.equal(
      resolveEditSnap(
        state.session!,
        { x: 1.8, y: 0 },
        { ...context, references: [source], activeReferences: [source] },
      ).candidate,
      null,
    );
  const stale = editingReducer(state, {
    type: "project",
    project: updateWall(state.history.present, "wall", { height: 3 }),
  });
  const rejected = editingReducer(stale, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: result.point,
  });
  assert.equal(rejected.history, stale.history);
  assert.notEqual(rejected.error, "");
});

import { numericMoveAxis, previewNumericMove } from "./numeric.ts";

test("numeric X/Y/element moves accept signed comma metres and share preview, commit, undo and JSON", () => {
  for (const action of ["x", "y", "axis"] as const)
    for (const text of ["1,25", "-1.25", "+0,5", "0"]) {
      const state = editingReducer(initial(), { type: "begin", target: wall, action, index: null });
      const session = state.session!;
      const result = previewNumericMove(session, state.history.present, wall, text);
      const committed = editingReducer(state, {
        type: "confirm",
        session,
        selection: wall,
        point: result.point,
      });
      assert.deepEqual(committed.history.present, result.project);
      const amount = Number(text.replace(",", "."));
      const moved = result.project.storey.walls[0]!;
      assert.equal(moved.start.x, action === "y" ? 0 : action === "axis" ? -amount || 0 : amount);
      assert.equal(moved.start.y, action === "y" ? amount : 0);
      assert.deepEqual(
        editingReducer(committed, { type: "undo" }).history.present,
        state.history.present,
      );
      assert.deepEqual(readProjectFile(serializeProject(result.project)), result.project);
      if (amount !== 0) {
        assert.equal(committed.history.past.length, 1);
        assert.deepEqual(
          editingReducer(editingReducer(committed, { type: "undo" }), { type: "redo" }).history
            .present,
          result.project,
        );
      }
    }
});

test("numeric movement rejects invalid values and stale selection/model without a transaction", () => {
  const state = editingReducer(initial(), {
    type: "begin",
    target: wall,
    action: "x",
    index: null,
  });
  for (const text of ["", "abc", "1,2,3", "Infinity", "1e999", "2 m"])
    assert.throws(() => previewNumericMove(state.session!, state.history.present, wall, text));
  assert.throws(() => previewNumericMove(state.session!, state.history.present, null, "1"));
  assert.throws(() =>
    previewNumericMove(
      state.session!,
      updateWall(state.history.present, "wall", { height: 3 }),
      wall,
      "1",
    ),
  );
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
  assert.equal(numericMoveAxis({ ...state.session!, action: "point" }), null);
  assert.throws(() =>
    previewNumericMove({ ...state.session!, action: "move" }, state.history.present, wall, "1"),
  );
});

test("oblique numeric movement uses normalized pinned direction with exact signed distance", () => {
  const project = addLine(initial().history.present, {
    id: "diagonal",
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
    ],
    ...defaultLineAppearance,
  });
  const target = { kind: "line" as const, id: "diagonal" };
  const state = editingReducer(createEditingState(project), {
    type: "begin",
    target,
    action: "axis",
    index: null,
  });
  const result = previewNumericMove(state.session!, state.history.present, target, "-2,5");
  assert.deepEqual(result.point, { x: 1.5, y: 2 });
  assert.match(numericMoveAxis(state.session!)!.label, /2 → 1/);
  assert.deepEqual(result.project.storey.lines![0]!.points, [
    { x: 1.5, y: 2 },
    { x: 4.5, y: 6 },
  ]);
});

import { movementDirection, previewMovementInput } from "./numeric.ts";
test("free polar move preserves clicked corner origin, dimensions and one reversible commit", () => {
  const state = editingReducer(initial(), {
    type: "begin",
    target: wall,
    action: "move",
    index: 1,
    anchor: { x: 3, y: 0.18 },
  });
  const session = state.session!;
  const aim = { x: 3, y: 2.18 };
  assert.equal(movementDirection(session, aim), 90);
  const result = previewMovementInput(session, state.history.present, wall, "90", "1,25", aim);
  assert.deepEqual(result.point, { x: 3, y: 1.43 });
  const moved = result.project.storey.walls[0]!;
  assert.deepEqual(moved.start, { x: 0, y: 1.25 });
  assert.deepEqual(moved.end, { x: 3, y: 1.25 });
  assert.equal(moved.thickness, 0.36);
  const committed = editingReducer(state, {
    type: "confirm",
    session,
    selection: wall,
    point: result.point,
  });
  assert.deepEqual(committed.history.present, result.project);
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(
    editingReducer(committed, { type: "undo" }).history.present,
    state.history.present,
  );
  assert.deepEqual(
    editingReducer(editingReducer(committed, { type: "undo" }), { type: "redo" }).history.present,
    result.project,
  );
  assert.deepEqual(readProjectFile(serializeProject(result.project)), result.project);
});
test("free polar input validates text and stale contexts while fixed axes remain alternatives", () => {
  const state = begin(),
    session = state.session!;
  for (const [angle, length] of [
    ["abc", "2"],
    ["90", "bad"],
    ["1e99", "2"],
  ])
    assert.throws(() =>
      previewMovementInput(session, state.history.present, wall, angle!, length!, null),
    );
  assert.throws(() => previewMovementInput(session, state.history.present, null, "90", "2", null));
  assert.throws(() =>
    previewMovementInput(
      session,
      updateWall(state.history.present, "wall", { height: 3 }),
      wall,
      "90",
      "2",
      null,
    ),
  );
  assert.deepEqual(
    previewMovementInput(session, state.history.present, wall, "", "2", { x: 0, y: 3 }).point,
    { x: 0, y: 2 },
  );
  const axis = editingReducer(initial(), { type: "begin", target: wall, action: "x", index: null });
  assert.deepEqual(
    previewMovementInput(axis.session!, axis.history.present, wall, "90", "2", null).point,
    { x: 2, y: 0 },
  );
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
});

import { editOriginReference } from "./snapping.ts";
test("free movement origin drives shared guides without restoring excluded model points", () => {
  const state = begin(),
    session = state.session!;
  const origin = editOriginReference(session)!;
  const refs = [
    ...editSnapReferences(session, projectSnapReferences(state.history.present)),
    origin,
  ];
  assert.equal(
    refs.some((r) => r.entityId === "wall"),
    false,
  );
  const result = resolveEditSnap(
    session,
    { x: 0.02, y: 2 },
    { ...snapContext(state), references: refs, activeReferences: [origin], gridSpacing: null },
  );
  assert.equal(result.candidate?.guideOrigin?.x, session.anchor.x);
  assert.deepEqual(result.point, { x: 0, y: 2 });
  assert.deepEqual(editOriginReference({ ...session, action: "x" }).point, session.anchor);
  for (const angle of ["566", "360,01", "-1"])
    assert.throws(
      () => previewMovementInput(session, state.history.present, wall, angle, "2", null),
      /0°.*360°/,
    );
  for (const angle of ["0", "360"])
    assert.deepEqual(
      previewMovementInput(session, state.history.present, wall, angle, "2", null).point,
      { x: 2, y: 0 },
    );
});

test("numeric stretch preserves wall corner offset and validates window and neighbour limits", () => {
  const state = editingReducer(initial(), {
    type: "begin",
    target: wall,
    action: "stretch",
    index: 1,
    anchor: { x: 3, y: 0.18 },
  });
  const session = state.session!;
  const result = previewMovementInput(session, state.history.present, wall, "", "1,25", null);
  assert.deepEqual(result.point, { x: 4.25, y: 0.18 });
  assert.deepEqual(result.project.storey.walls[0]!.end, { x: 4.25, y: 0 });
  assert.deepEqual(result.project.storey.walls[0]!.start, { x: 0, y: 0 });
  assert.equal(result.project.storey.windows[0]!.position, 0.5);
  const committed = editingReducer(state, {
    type: "confirm",
    session,
    selection: wall,
    point: result.point,
  });
  assert.deepEqual(committed.history.present, result.project);
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(
    editingReducer(committed, { type: "undo" }).history.present,
    state.history.present,
  );
  assert.deepEqual(
    editingReducer(editingReducer(committed, { type: "undo" }), { type: "redo" }).history.present,
    result.project,
  );
  assert.deepEqual(readProjectFile(serializeProject(result.project)), result.project);
  for (const text of ["-2", "-3", "-4", "abc"])
    assert.throws(() => previewMovementInput(session, state.history.present, wall, "", text, null));
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
  assert.equal(numericMoveAxis({ ...session, index: null }), null);
  assert.throws(() => previewMovementInput(session, state.history.present, null, "", "1", null));
  assert.throws(() =>
    previewMovementInput(
      session,
      updateWall(state.history.present, "wall", { height: 3 }),
      wall,
      "",
      "1",
      null,
    ),
  );
});

test("oblique numeric stretch moves only selected line or wall end in either signed direction", () => {
  for (const kind of ["line", "wall"] as const)
    for (const index of [0, 1])
      for (const distance of [2.5, -2.5]) {
        let project = createProject("p", "s");
        project =
          kind === "line"
            ? addLine(project, {
                id: "e",
                kind: "line",
                points: [
                  { x: 0, y: 0 },
                  { x: 3, y: 4 },
                ],
                ...defaultLineAppearance,
              })
            : addWall(project, {
                id: "e",
                start: { x: 0, y: 0 },
                end: { x: 3, y: 4 },
                thickness: 0.36,
                height: 2.8,
              });
        const target = { kind, id: "e" };
        const state = editingReducer(createEditingState(project), {
          type: "begin",
          target,
          action: "stretch",
          index,
          anchor: index === 0 ? { x: 0, y: 0 } : { x: 3, y: 4 },
        });
        const result = previewMovementInput(
          state.session!,
          state.history.present,
          target,
          "",
          String(distance),
          null,
        );
        const points =
          kind === "line"
            ? result.project.storey.lines![0]!.points
            : [result.project.storey.walls[0]!.start, result.project.storey.walls[0]!.end];
        const sign = index === 0 ? -1 : 1;
        assert.ok(
          Math.abs(points[index]!.x - (index === 0 ? 0 : 3) - sign * distance * 0.6) < 1e-12,
        );
        assert.ok(
          Math.abs(points[index]!.y - (index === 0 ? 0 : 4) - sign * distance * 0.8) < 1e-12,
        );
        assert.deepEqual(
          points[index === 0 ? 1 : 0],
          index === 0 ? { x: 3, y: 4 } : { x: 0, y: 0 },
        );
      }
});

test("every direct-edit action immediately pins its selected point, including wall corners and line vertices", () => {
  const base = addLine(initial().history.present, {
    id: "line",
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
    ],
    ...defaultLineAppearance,
  });
  for (const kind of ["wall", "line"] as const) {
    for (const action of ["point", "stretch", "move", "axis", "x", "y"] as const) {
      const state = editingReducer(createEditingState(base), {
        type: "begin",
        target: { kind, id: kind },
        action,
        index: 1,
        anchor: { x: 3, y: 0.18 },
      });
      assert.equal(state.error, "");
      const session = state.session!,
        origin = editOriginReference(session);
      assert.deepEqual(origin.point, { x: 3, y: 0.18 });
      assert.notEqual(origin.point, session.anchor);
      assert.ok(origin.directions?.length);
      const refs = [
        ...editSnapReferences(session, projectSnapReferences(state.history.present)),
        origin,
      ];
      assert.equal(
        refs.some((r) => r.entityId === kind),
        false,
      );
      const result = resolveEditSnap(
        session,
        { x: 3.02, y: 1.18 },
        { ...snapContext(state), references: refs, activeReferences: [origin], gridSpacing: null },
      );
      if (action === "point" || action === "move") {
        assert.deepEqual(result.point, { x: 3, y: 1.18 });
        assert.deepEqual(result.candidate?.guideOrigin, origin.point);
      }
      if (action === "x" || action === "axis" || action === "stretch")
        assert.equal(result.point.y, origin.point.y);
      if (action === "y") assert.equal(result.point.x, origin.point.x);
      assert.equal(editingReducer(state, { type: "cancel" }).session, null);
      assert.equal(state.history.past.length, 0);
    }
  }
});
test("window movement pins its chosen point while retaining host direction and exclusions", () => {
  const state = editingReducer(initial(), {
    type: "begin",
    target: { kind: "window", id: "window" },
    action: "move",
    index: null,
    anchor: { x: 1.5, y: 0.18 },
  });
  const session = state.session!,
    origin = editOriginReference(session);
  assert.deepEqual(origin.point, session.anchor);
  assert.deepEqual(origin.directions, [{ x: 3, y: 0 }]);
  const refs = [
    ...editSnapReferences(session, projectSnapReferences(state.history.present)),
    origin,
  ];
  assert.equal(
    refs.some((r) => r.entityId === "wall" || r.entityId === "window"),
    false,
  );
  const result = resolveEditSnap(
    session,
    { x: 1.7, y: 2 },
    { ...snapContext(state), references: refs, activeReferences: [origin], gridSpacing: null },
  );
  assert.equal(result.point.y, 0.18);
  const preview = previewEdit(session, state.history.present, session.target, result.point);
  assert.ok(Math.abs(preview.storey.windows[0]!.position - 1.7 / 3) < 1e-9);
  assert.equal(preview.storey.windows[0]!.wallId, "wall");
});

test("polar point input retains opposite wall endpoint and commits one undo step", () => {
  const state = editingReducer(initial(), {
    type: "begin",
    target: wall,
    action: "point",
    index: 1,
    anchor: { x: 3, y: 0.18 },
  });
  const result = previewMovementInput(state.session!, state.history.present, wall, "90", "1", null);
  assert.deepEqual(result.project.storey.walls[0]!.start, { x: 0, y: 0 });
  const end = result.project.storey.walls[0]!.end;
  const length = Math.hypot(end.x, end.y);
  assert.ok(Math.abs(end.x - (end.y / length) * 0.18 - 3) < 1e-10);
  assert.ok(Math.abs(end.y + (end.x / length) * 0.18 - 1.18) < 1e-10);
  const next = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: wall,
    point: result.point,
  });
  assert.equal(next.history.past.length, 1);
  assert.deepEqual(editingReducer(next, { type: "undo" }).history.present, state.history.present);
});

test("layer property assignment discards movement preview and produces one reversible membership change", () => {
  const state = begin(),
    base = state.history.present;
  const event = {
    type: "assign-layer" as const,
    base,
    target: wall,
    selection: wall,
    layerId: base.defaultLayerIds.line,
  };
  previewEdit(state.session!, base, wall, { x: 10, y: 10 });
  const next = editingReducer(state, event);
  assert.equal(next.error, "");
  assert.equal(next.session, null);
  assert.equal(next.history.past.length, 1);
  assert.deepEqual(next.history.present.storey.walls[0]!.start, base.storey.walls[0]!.start);
  assert.equal(next.history.present.storey.walls[0]!.layerId, event.layerId);
  assert.deepEqual(readProjectFile(serializeProject(next.history.present)), next.history.present);
  const undo = editingReducer(next, { type: "undo" });
  assert.deepEqual(undo.history.present, base);
  assert.deepEqual(editingReducer(undo, { type: "redo" }).history.present, next.history.present);
  const noop = editingReducer(next, { ...event, base: next.history.present });
  assert.equal(noop.history, next.history);
});

test("layer properties reject changed selection, stale model and invalid typed targets", () => {
  const state = begin(),
    base = state.history.present;
  const event = {
    type: "assign-layer" as const,
    base,
    target: wall,
    selection: wall,
    layerId: base.defaultLayerIds.line,
  };
  const cases = [
    { ...event, selection: null },
    { ...event, selection: { kind: "window" as const, id: "window" } },
    { ...event, base: structuredClone(base) },
    {
      ...event,
      target: { kind: "window" as const, id: "wall" },
      selection: { kind: "window" as const, id: "wall" },
    },
    { ...event, layerId: "missing" },
  ];
  for (const invalid of cases) {
    const next = editingReducer(state, invalid);
    assert.notEqual(next.error, "");
    assert.equal(next.history, state.history);
    assert.equal(next.session, state.session);
  }
});

test("window and line properties share the same layer transition without changing their host or geometry", () => {
  const original = initial().history.present;
  const state = createEditingState(
    addLine(original, {
      id: "line",
      kind: "line",
      points: [
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ],
      ...defaultLineAppearance,
    }),
  );
  for (const target of [
    { kind: "window" as const, id: "window" },
    { kind: "line" as const, id: "line" },
  ]) {
    const next = editingReducer(state, {
      type: "assign-layer",
      base: state.history.present,
      target,
      selection: target,
      layerId: original.defaultLayerIds.wall,
    });
    assert.equal(next.error, "");
    assert.equal(next.history.past.length, 1);
    assert.equal(next.history.present.storey.windows[0]!.wallId, "wall");
    assert.deepEqual(buildSolid(next.history.present), buildSolid(state.history.present));
  }
});
