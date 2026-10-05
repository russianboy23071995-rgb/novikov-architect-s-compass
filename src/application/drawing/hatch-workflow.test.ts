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
