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

test("window dimensions parse comma decimals and reject incomplete or invalid measures", async () => {
  const { parseWindowDimensions } = await import("./window-placement.ts");
  const draft = { width: "0,8", height: "1.1", sillHeight: "0" };
  assert.deepEqual(parseWindowDimensions(draft), { width: 0.8, height: 1.1, sillHeight: 0 });
  for (const key of ["width", "height", "sillHeight"] as const)
    for (const invalid of ["", "-1", "NaN", "Infinity", "1,", "abc"])
      assert.throws(() => parseWindowDimensions({ ...draft, [key]: invalid }));
  for (const key of ["width", "height"] as const)
    assert.throws(() => parseWindowDimensions({ ...draft, [key]: "0" }));
});

test("dimension revisions invalidate old previews and new values reach the same creation action", async () => {
  const { windowPlacementInteraction } = await import("./window-placement.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const { confirmInteraction } = await import("../tools/interaction.ts");
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
  let draft = { width: "0,8", height: "1,1", sillHeight: "0,7" };
  let committed = base;
  const adapter = () =>
    windowPlacementInteraction(
      base,
      visibility,
      "new-window",
      () => ({ project: base, visibility }),
      (next) => {
        committed = next;
      },
      () => {},
      { draft, currentDraft: () => draft },
    );
  const old = adapter(),
    point = { x: 1.5, y: 0.18 };
  const preview = old.previewProject!(point);
  assert.equal(preview.storey.windows[0]!.width, 0.8);
  assert.equal(base.storey.windows.length, 0);
  draft = { ...draft, width: "1,0" };
  assert.throws(() => confirmInteraction(old, point), /Fenstermaße/);
  assert.equal(committed, base);
  const current = adapter();
  const next = current.previewProject!(point);
  confirmInteraction(current, point);
  assert.deepEqual(committed, next);
  assert.equal(committed.storey.windows[0]!.width, 1);
  assert.equal(committed.storey.windows[0]!.height, 1.1);
  assert.equal(committed.storey.windows[0]!.sillHeight, 0.7);
  draft = { ...draft, width: "4" };
  assert.throws(() => confirmInteraction(adapter(), point));
  draft = { ...draft, width: "1", height: "3" };
  assert.throws(() => confirmInteraction(adapter(), point));
  draft = { ...draft, height: "" };
  assert.throws(() => adapter().previewProject!(point));
  assert.deepEqual(committed, next);
});

test("pinned window host uses exact signed distance and retains its explicit host", async () => {
  const { windowPlacementInteraction, windowPlacementHost } = await import("./window-placement.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const { confirmInteraction } = await import("../tools/interaction.ts");
  for (const end of [
    { x: 6, y: 0 },
    { x: 0, y: 6 },
    { x: -6, y: 0 },
    { x: 4.8, y: 3.6 },
  ]) {
    const empty = createProject("p", "s");
    const base = createDrawing(empty, empty, "host", {
      kind: "wall",
      start: { x: 0, y: 0 },
      end,
      ...defaultDrawingWall,
    });
    const visibility = createLayerVisibilityPolicy(base, {
      scope: { kind: "bim-project" },
      hiddenLayerIds: [],
    });
    let committed = base;
    const tool = windowPlacementInteraction(
      base,
      visibility,
      "win",
      () => ({ project: base, visibility }),
      (next) => {
        committed = next;
      },
      () => {},
      undefined,
      "host",
    );
    const result = tool.preview("566", "2,00", { x: 99, y: 99 });
    const preview = tool.previewProject!(result.point);
    assert.ok(Math.abs(preview.storey.windows[0]!.position - 1 / 3) < 1e-12);
    assert.equal(preview.storey.windows[0]!.wallId, "host");
    assert.equal(base.storey.windows.length, 0);
    assert.equal(tool.input!.axisLabel, "Fenstermitte ab Wandanfang");
    for (const invalid of ["NaN"]) assert.throws(() => tool.preview("", invalid, null));
    for (const [input, expected] of [
      ["-100", 0.1],
      ["100", 0.9],
    ] as const) {
      const capped = tool.preview("", input, null);
      assert.ok(
        Math.abs(tool.previewProject!(capped.point).storey.windows[0]!.position - expected) < 1e-9,
      );
    }
    confirmInteraction(tool, result.point);
    assert.deepEqual(committed, preview);
    const origin = tool.snapping.origin!.point;
    assert.equal(
      windowPlacementHost(base, visibility, { x: origin.x + end.x / 2, y: origin.y + end.y / 2 }),
      "host",
    );
  }
});

test("window tool in connected plan preserves preview, edits, history, reload and IFC", async () => {
  const { addWall, updateWindow } = await import("../../lib/bim/model.ts");
  const { windowPlacementInteraction } = await import("./window-placement.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const { confirmInteraction } = await import("../tools/interaction.ts");
  const { moveWindowAlongWall } = await import("../direct-edit/transforms.ts");
  const { previewTConnection } = await import("../walls/t-connections.ts");
  const { exportIfc } = await import("../../lib/bim/ifc.ts");
  for (const closed of [false, true]) {
    let base = createProject("connected-windows", "level");
    for (const wall of [
      { id: "host", start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
      { id: "east", start: { x: 6, y: 0 }, end: { x: 6, y: 4 } },
      { id: "north", start: { x: 6, y: 4 }, end: { x: 0, y: 4 } },
      ...(closed
        ? [{ id: "west", start: { x: 0, y: 4 }, end: { x: 0, y: 0 } }]
        : [{ id: "partition", start: { x: 3, y: 2 }, end: { x: 3, y: 0 } }]),
    ])
      base = addWall(base, { ...wall, thickness: 0.36, height: 2.8 });
    if (!closed)
      base = previewTConnection(base, base, {
        projectId: base.id,
        kind: "connect",
        relation: { hostWallId: "host", incoming: { wallId: "partition", endpoint: 1 } },
      });
    assert.equal(base.storey.wallJoins.length, closed ? 4 : 2);
    assert.equal(base.storey.wallTJunctions.length, closed ? 0 : 1);
    let state = createEditingState(base);
    base = state.history.present;
    const visibility = createLayerVisibilityPolicy(base, {
      scope: { kind: "bim-project" },
      hiddenLayerIds: [],
    });
    const tool = windowPlacementInteraction(
      base,
      visibility,
      "placed",
      () => ({ project: state.history.present, visibility }),
      (next) => {
        state = editingReducer(state, { type: "project", project: next });
      },
      () => {},
      undefined,
      "host",
    );
    const point = tool.preview("", "1.5", null).point;
    const preview = tool.previewProject!(point);
    assert.equal(state.history.past.length, 0);
    assert.equal(base.storey.windows.length, 0);
    confirmInteraction(tool, point);
    assert.deepEqual(state.history.present, preview);
    assert.equal(state.history.past.length, 1);
    const resized = updateWindow(state.history.present, "placed", {
      width: 1,
      height: 1.1,
      sillHeight: 0.8,
    });
    state = editingReducer(state, { type: "project", project: resized });
    // Pass straight through the T contact on the original host.
    const moved = moveWindowAlongWall(state.history.present, "placed", 3);
    state = editingReducer(state, { type: "project", project: moved });
    assert.equal(state.history.past.length, 3);
    assert.equal(moved.storey.windows[0]!.position, 0.75);
    state = editingReducer(state, { type: "undo" });
    assert.deepEqual(state.history.present, resized);
    state = editingReducer(state, { type: "redo" });
    assert.deepEqual(state.history.present, moved);
    const restored = readProjectFile(serializeProject(state.history.present));
    assert.deepEqual(restored, moved);
    assert.deepEqual(buildSolid(restored), buildSolid(moved));
    const date = new Date("2026-10-06T12:00:00Z");
    const ifc = await exportIfc(restored, date);
    assert.equal(ifc, await exportIfc(moved, date));
    assert.equal((ifc.match(/=IFCWALL\(/g) || []).length, 4);
    assert.equal((ifc.match(/=IFCWINDOW\(/g) || []).length, 1);
    assert.equal((ifc.match(/=IFCRELVOIDSELEMENT\(/g) || []).length, 1);
    assert.equal((ifc.match(/=IFCRELFILLSELEMENT\(/g) || []).length, 1);
    assert.match(ifc, /1\.1,1\.,\.WINDOW\.,\.NOTDEFINED\./);
    assert.ok(ifc.includes("IFCRATIOMEASURE(0.75)"));
    assert.ok(ifc.includes("IFCLENGTHMEASURE(0.8)"));
  }
});
