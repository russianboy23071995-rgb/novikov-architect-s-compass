import test from "node:test";
import assert from "node:assert/strict";
import { createProject, serializeProject } from "../../lib/bim/model.ts";
import { createDrawing, defaultHatchFill, closedDrawingContour } from "./actions.ts";
import { drawingInteraction } from "../tools/adapters.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { projectSnapPrimitives } from "../snapping/project-references.ts";
import { createVisibleToolSourceQuery } from "../tools/snapping.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { selectedLayerElement } from "../layers/selection.ts";
import { visiblePlanGeometry } from "../../rendering/viewport/layer-display.ts";
import { planBounds } from "../../components/cad/bim-view.ts";
import { previewCommand } from "../../lib/bim/commands.ts";
const points = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 2 },
  { x: 0, y: 2 },
];
const request = { kind: "hatch" as const, points, fill: defaultHatchFill };

test("closed drawing uses the same numeric and snap origin contract, then commits one hatch", () => {
  const state = createEditingState(createProject("p", "s")),
    p = state.history.present;
  let picked = { x: 0, y: 0 };
  let cancelled = false;
  const adapter = drawingInteraction(
    p,
    p,
    points[0]!,
    (p) => {
      picked = p;
    },
    () => {
      cancelled = true;
    },
  );
  const numeric = adapter.preview("0", "3", null);
  assert.deepEqual(numeric.point, points[1]);
  adapter.validate(numeric.point);
  adapter.commit(numeric.point);
  assert.deepEqual(picked, points[1]);
  assert.deepEqual(adapter.snapping!.origin.point, points[0]);
  adapter.cancel();
  assert.equal(cancelled, true);
  assert.equal(state.history.past.length, 0);
  const created = createDrawing(p, p, "h", request);
  const next = editingReducer(state, { type: "project", project: created });
  assert.equal(next.history.past.length, 1);
  assert.deepEqual(next.history.present.storey.hatches[0]!.points, points);
  const undo = editingReducer(next, { type: "undo" });
  assert.equal(undo.history.present.storey.hatches.length, 0);
  assert.deepEqual(editingReducer(undo, { type: "redo" }).history.present, next.history.present);
  assert.deepEqual(readProjectFile(serializeProject(next.history.present)), next.history.present);
});

test("explicit closing point is normalized once; invalid and stale finishes never commit", () => {
  const p = createProject("p", "s");
  const closed = [...points, points[0]!];
  assert.deepEqual(closedDrawingContour(closed), points);
  assert.equal(closed.length, 5);
  assert.deepEqual(
    createDrawing(p, p, "h", { ...request, points: closed }).storey.hatches[0]!.points,
    points,
  );
  for (const ring of [[], points.slice(0, 2), [points[0]!, points[2]!, points[1]!, points[3]!]]) {
    assert.throws(() => createDrawing(p, p, "h", { ...request, points: ring }));
  }
  assert.throws(() => createDrawing(p, structuredClone(p), "h", request));
  assert.equal(p.storey.hatches.length, 0);
});

test("hatch vertices and every closed edge feed the shared local source query; hidden layer removes them", () => {
  const base = createProject("p", "s"),
    p = createDrawing(base, base, "h", request);
  const primitives = projectSnapPrimitives(p);
  assert.equal(primitives.segments.length, 4);
  assert.equal(primitives.references.filter((r) => r.feature.startsWith("vertex-")).length, 4);
  assert.ok(
    primitives.segments.some(
      (s) => s.start.x === 0 && s.start.y === 2 && s.end.x === 0 && s.end.y === 0,
    ),
  );
  const all = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const query = createVisibleToolSourceQuery(p, all, all.context, null);
  assert.ok(query({ x: 0, y: 1 }, 100, 10, []).some((r) => r.entityId === "h"));
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.line],
  });
  assert.deepEqual(
    createVisibleToolSourceQuery(p, hidden, hidden.context, null)({ x: 0, y: 1 }, 100, 10, []),
    [],
  );
  assert.equal(
    visiblePlanGeometry(p, (id) => hidden.evaluate(p, hidden.context, id).eligible).hatches.length,
    0,
  );
});

test("hatch selection supports layer assignment and plan extents without becoming a wall or voice target", () => {
  const base = createProject("p", "s"),
    p = createDrawing(base, base, "h", request);
  const target = { kind: "hatch" as const, id: "h" };
  assert.equal(selectedLayerElement(p, target)?.id, "h");
  const state = createEditingState(p),
    current = state.history.present;
  const layer = current.defaultLayerIds.wall;
  const assigned = editingReducer(state, {
    type: "assign-layer",
    base: current,
    target,
    selection: target,
    layerId: layer,
  });
  assert.equal(assigned.history.present.storey.hatches[0]!.layerId, layer);
  assert.equal(assigned.history.past.length, 1);
  assert.equal(planBounds(p), "-1.5 -3.5 6 5");
  assert.throws(() => previewCommand(p, target, "Wandlänge auf 6 m"));
});

import { editAtPointer } from "../../lib/bim/direct-edit.ts";
import type { EditAction } from "../../lib/bim/direct-edit.ts";
import { editInteraction } from "../tools/adapters.ts";
import { editDirection } from "../direct-edit/snapping.ts";

test("hatch direct edit shares all six actions, every vertex, pinned origin and model history", () => {
  const base = createProject("p", "s");
  const p = createDrawing(base, base, "h", request);
  const target = { kind: "hatch" as const, id: "h" };
  for (const index of [0, 1, 2, 3])
    for (const action of ["point", "move", "stretch", "axis", "x", "y"] as EditAction[]) {
      const anchor = points[index]!;
      const state = editingReducer(createEditingState(p), {
        type: "begin",
        target,
        action,
        index,
        anchor,
      });
      assert.equal(state.error, "");
      const session = state.session!;
      const adapter = editInteraction(
        session,
        session.base,
        target,
        () => {},
        () => {},
      );
      assert.deepEqual(adapter.snapping!.origin.point, anchor);
      const numeric = adapter.preview(
        action === "move" || action === "point" ? "30" : "",
        "0.1",
        null,
      );
      adapter.validate(numeric.point);
      const next = editAtPointer(session, session.base, numeric.point);
      const result = next.storey.hatches[0]!;
      const delta = { x: numeric.point.x - anchor.x, y: numeric.point.y - anchor.y };
      result.points.forEach((point, i) => {
        const moves = (action !== "point" && action !== "stretch") || i === index;
        assert.ok(Math.abs(point.x - points[i]!.x - (moves ? delta.x : 0)) < 1e-10);
        assert.ok(Math.abs(point.y - points[i]!.y - (moves ? delta.y : 0)) < 1e-10);
      });
      assert.deepEqual(result.fill, p.storey.hatches[0]!.fill);
      assert.equal(result.layerId, p.storey.hatches[0]!.layerId);
      assert.equal(result.id, "h");
      assert.deepEqual(p.storey.hatches[0]!.points, points);
      const committed = editingReducer(state, {
        type: "confirm",
        session,
        selection: target,
        point: numeric.point,
      });
      assert.equal(committed.history.past.length, 1);
      const undone = editingReducer(committed, { type: "undo" });
      assert.deepEqual(undone.history.present, p);
      assert.deepEqual(editingReducer(undone, { type: "redo" }).history.present, next);
      assert.deepEqual(readProjectFile(serializeProject(next)), next);
      if (action === "axis" || action === "stretch") assert.ok(editDirection(session));
    }
});

test("hatch corner rejects crossed or collapsed contours, stale context and invalid grips atomically", () => {
  const base = createProject("p", "s"),
    p = createDrawing(base, base, "h", request);
  const target = { kind: "hatch" as const, id: "h" };
  const state = editingReducer(createEditingState(p), {
    type: "begin",
    target,
    action: "point",
    index: 1,
    anchor: points[1]!,
  });
  for (const point of [{ x: -1, y: 1 }, points[0]!, { x: NaN, y: 0 }]) {
    assert.throws(() => editAtPointer(state.session!, state.session!.base, point));
    const rejected = editingReducer(state, {
      type: "confirm",
      session: state.session!,
      selection: target,
      point,
    });
    assert.equal(rejected.history.present, state.history.present);
    assert.equal(rejected.history.past.length, 0);
    assert.ok(rejected.error);
  }
  assert.throws(() => editAtPointer(state.session!, structuredClone(p), { x: 4, y: 0 }));
  const changed = editInteraction(
    state.session!,
    p,
    { kind: "hatch", id: "other" },
    () => {},
    () => {},
  );
  assert.throws(() => changed.validate({ x: 4, y: 0 }));
  for (const index of [-1, 4, 0.5, null]) {
    const invalid = editingReducer(createEditingState(p), {
      type: "begin",
      target,
      action: "point",
      index,
    });
    assert.equal(invalid.session, null);
    assert.ok(invalid.error);
  }
  assert.equal(editingReducer(state, { type: "cancel" }).history.present, state.history.present);
});
