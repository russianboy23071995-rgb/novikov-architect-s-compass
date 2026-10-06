import test from "node:test";
import assert from "node:assert/strict";
import { createDrawing, previewDrawingInput, defaultDrawingWall } from "./actions.ts";
import { createProject, serializeProject, wallLength } from "../../lib/bim/model.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
test("shared drawing creates exact wall dimensions with one history step and matching JSON/solid", () => {
  const base = createProject("p", "s"),
    start = { x: 0, y: 0 };
  const target = previewDrawingInput(base, base, start, { x: 9, y: 9 }, "0", "3,00").point;
  assert.deepEqual(target, { x: 3, y: 0 });
  const request = { kind: "wall" as const, start, end: target, ...defaultDrawingWall };
  const preview = createDrawing(base, base, "w", request);
  assert.equal(base.storey.walls.length, 0);
  assert.equal(wallLength(preview.storey.walls[0]!), 3);
  const solid = buildSolid(preview);
  assert.deepEqual(solid.min, [0, 0, 0]);
  assert.deepEqual(solid.max, [3, 0.36, 2.8]);
  let state = createEditingState(base);
  assert.equal(editingReducer(state, { type: "cancel" }).history.past.length, 0);
  state = editingReducer(state, { type: "project", project: preview });
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, base);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, preview);
  assert.deepEqual(readProjectFile(serializeProject(preview)), preview);
});
test("drawing validation rejects stale context, zero length, invalid angles and wall dimensions", () => {
  const base = createProject("p", "s"),
    o = { x: 0, y: 0 };
  for (const angle of ["566", "-1", "NaN"])
    assert.throws(() => previewDrawingInput(base, base, o, null, angle, "3"));
  assert.throws(() => previewDrawingInput(base, base, o, null, "0", "0"));
  const request = { kind: "wall" as const, start: o, end: { x: 3, y: 0 }, ...defaultDrawingWall };
  assert.throws(() => createDrawing(base, createProject("p", "s"), "w", request), /Modell/);
  for (const patch of [{ height: 0 }, { thickness: -1 }, { end: o }])
    assert.throws(() => createDrawing(base, base, "w", { ...request, ...patch }));
  assert.throws(
    () => previewDrawingInput(base, createProject("p", "s"), o, null, "0", "3"),
    /Modell/,
  );
  const result = previewDrawingInput(base, base, o, null, "45", "3");
  assert.ok(Math.abs(Math.hypot(result.point.x, result.point.y) - 3) < 1e-12);
});
test("shared creation retains line and polyline appearance and validates stale requests", () => {
  const base = createProject("p", "s");
  for (const lineKind of ["line", "polyline"] as const) {
    const request = {
      kind: "line" as const,
      lineKind,
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 0 },
      ],
      appearance: defaultLineAppearance,
    };
    const next = createDrawing(base, base, "l", request);
    assert.equal(next.storey.lines![0]!.kind, lineKind);
    assert.equal(next.storey.lines![0]!.penWidth, 0.25);
    assert.throws(() => createDrawing(base, next, "l2", request), /Modell/);
  }
});

test("window placement previews without mutation and commits one undoable serializable opening", async () => {
  const { placeWindow, windowPlacementInteraction } = await import("./window-placement.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const { confirmInteraction } = await import("../tools/interaction.ts");
  const { drawingWallVisibility } = await import("../../rendering/viewport/layer-display.ts");
  const empty = createProject("p", "s");
  const base = createDrawing(empty, empty, "wall", {
    kind: "wall",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    ...defaultDrawingWall,
  });
  const visibility = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  let state = createEditingState(base),
    cancelled = false;
  const tool = windowPlacementInteraction(
    base,
    visibility,
    "win",
    () => ({ project: base, visibility }),
    (next) => {
      state = editingReducer(state, { type: "project", project: next });
    },
    () => {
      cancelled = true;
    },
  );
  const point = { x: 1.5, y: 0.18 };
  const preview = tool.previewProject!(point);
  assert.equal(base.storey.windows.length, 0);
  assert.equal(state.history.past.length, 0);
  assert.equal(preview.storey.windows[0]!.position, 0.5);
  assert.equal(drawingWallVisibility(base, preview, visibility)("win"), true);
  assert.equal(tool.snapping.origin, null);
  const snap = tool.snapping.resolve(
    { x: 1.5, y: 0.3 },
    {
      references: [],
      pixelsPerMetre: 100,
      enabled: false,
      endpointRadiusPx: 10,
      gridSpacing: null,
      orthoOrigin: null,
    },
  );
  assert.ok(Math.abs(snap.point.y - 0.18) < 1e-12);
  tool.cancel();
  assert.equal(cancelled, true);
  assert.equal(state.history.past.length, 0);
  confirmInteraction(tool, point);
  assert.equal(state.history.past.length, 1);
  assert.deepEqual(state.history.present, placeWindow(base, base, visibility, "win", point));
  assert.deepEqual(readProjectFile(serializeProject(state.history.present)), state.history.present);
  assert.ok(buildSolid(state.history.present).volume < buildSolid(base).volume);
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, base);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, preview);
});

test("window placement rejects hidden hosts/layers, stale context and invalid geometry", async () => {
  const { placeWindow, windowPlacementInteraction } = await import("./window-placement.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const empty = createProject("p", "s");
  const base = createDrawing(empty, empty, "wall", {
    kind: "wall",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    ...defaultDrawingWall,
  });
  const policy = (hiddenLayerIds: string[]) =>
    createLayerVisibilityPolicy(base, { scope: { kind: "bim-project" }, hiddenLayerIds });
  const visible = policy([]);
  for (const point of [
    { x: 0, y: 0.18 },
    { x: 5, y: 3 },
    { x: NaN, y: 0 },
  ])
    assert.throws(() => placeWindow(base, base, visible, "win", point));
  assert.throws(() =>
    placeWindow(base, base, policy([base.storey.walls[0]!.layerId]), "win", { x: 1.5, y: 0.18 }),
  );
  assert.throws(() =>
    placeWindow(base, base, policy([base.defaultLayerIds.window]), "win", { x: 1.5, y: 0.18 }),
  );
  assert.throws(() => placeWindow(base, empty, visible, "win", { x: 1.5, y: 0.18 }), /aktuell/);
  let commits = 0;
  const adapter = windowPlacementInteraction(
    base,
    visible,
    "win",
    () => ({ project: base, visibility: policy([]) }),
    () => commits++,
    () => {},
  );
  assert.throws(() => adapter.commit({ x: 1.5, y: 0.18 }), /Sichtbarkeit/);
  assert.equal(commits, 0);
});

test("window placement follows diagonal physical wall instead of drawing axis", async () => {
  const { placeWindow } = await import("./window-placement.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const { wallBody } = await import("../../domain/elements/wall/body.ts");
  const empty = createProject("p", "s");
  const base = createDrawing(empty, empty, "wall", {
    kind: "wall",
    start: { x: 2, y: 4 },
    end: { x: 5, y: 7 },
    ...defaultDrawingWall,
  });
  const body = wallBody(base.storey.walls[0]!);
  const visibility = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const next = placeWindow(base, base, visibility, "win", {
    x: body.start.x + 0.6 * (body.end.x - body.start.x),
    y: body.start.y + 0.6 * (body.end.y - body.start.y),
  });
  assert.ok(Math.abs(next.storey.windows[0]!.position - 0.6) < 1e-12);
});
