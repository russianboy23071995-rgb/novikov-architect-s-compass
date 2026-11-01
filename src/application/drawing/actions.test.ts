import { storeyOf } from "../../domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { createDrawing, previewDrawingInput, defaultDrawingWall } from "./actions.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { createProject } from "../projects/create.ts";
import { wallLength } from "../../domain/project/schema.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid } from "../../rendering/viewport/storey-solid.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { capturedStart, closesAtStart, resolvePathClick } from "./path-closure.ts";
import { mergeOntoVertex, moveVertex } from "../../geometry/polygons/vertex-merge.ts";
import { capturedVertex } from "../direct-edit/transforms.ts";
import { updateRoof } from "../roofs/actions.ts";
test("shared drawing creates exact wall dimensions with one history step and matching JSON/solid", () => {
  const base = createProject("p", "s"),
    start = { x: 0, y: 0 };
  const target = previewDrawingInput(base, base, start, { x: 9, y: 9 }, "0", "3,00").point;
  assert.deepEqual(target, { x: 3, y: 0 });
  const request = { kind: "wall" as const, start, end: target, ...defaultDrawingWall };
  const preview = createDrawing(base, base, "w", request);
  assert.equal(storeyOf(base).walls.length, 0);
  assert.equal(wallLength(storeyOf(preview).walls[0]!), 3);
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
    assert.equal(storeyOf(next).lines![0]!.kind, lineKind);
    assert.equal(storeyOf(next).lines![0]!.penWidth, 0.25);
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
  assert.equal(storeyOf(base).windows.length, 0);
  assert.equal(state.history.past.length, 0);
  assert.equal(storeyOf(preview).windows[0]!.position, 0.5);
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
    placeWindow(base, base, policy([storeyOf(base).walls[0]!.layerId]), "win", { x: 1.5, y: 0.18 }),
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
  const body = wallBody(storeyOf(base).walls[0]!);
  const visibility = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const next = placeWindow(base, base, visibility, "win", {
    x: body.start.x + 0.6 * (body.end.x - body.start.x),
    y: body.start.y + 0.6 * (body.end.y - body.start.y),
  });
  assert.ok(Math.abs(storeyOf(next).windows[0]!.position - 0.6) < 1e-12);
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
  assert.equal(storeyOf(preview).windows[0]!.width, 0.8);
  assert.equal(storeyOf(base).windows.length, 0);
  draft = { ...draft, width: "1,0" };
  assert.throws(() => confirmInteraction(old, point), /Fenstermaße/);
  assert.equal(committed, base);
  const current = adapter();
  const next = current.previewProject!(point);
  confirmInteraction(current, point);
  assert.deepEqual(committed, next);
  assert.equal(storeyOf(committed).windows[0]!.width, 1);
  assert.equal(storeyOf(committed).windows[0]!.height, 1.1);
  assert.equal(storeyOf(committed).windows[0]!.sillHeight, 0.7);
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
    assert.ok(Math.abs(storeyOf(preview).windows[0]!.position - 1 / 3) < 1e-12);
    assert.equal(storeyOf(preview).windows[0]!.wallId, "host");
    assert.equal(storeyOf(base).windows.length, 0);
    assert.equal(tool.input!.axisLabel, "Fenstermitte ab Wandanfang");
    for (const invalid of ["NaN"]) assert.throws(() => tool.preview("", invalid, null));
    for (const [input, expected] of [
      ["-100", 0.1],
      ["100", 0.9],
    ] as const) {
      const capped = tool.preview("", input, null);
      assert.ok(
        Math.abs(storeyOf(tool.previewProject!(capped.point)).windows[0]!.position - expected) <
          1e-9,
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
  const { updateWindow } = await import("../windows/actions.ts");
  const { addWall } = await import("../walls/actions.ts");
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
      ...(closed ? [{ id: "west", start: { x: 0, y: 4 }, end: { x: 0, y: 0 } }] : []),
      { id: "partition", start: { x: 3, y: 2 }, end: { x: 3, y: 0 } },
    ])
      base = addWall(base, { ...wall, thickness: 0.36, height: 2.8 });
    base = previewTConnection(base, base, {
      projectId: base.id,
      kind: "connect",
      relation: { hostWallId: "host", incoming: { wallId: "partition", endpoint: 1 } },
    });
    assert.equal(storeyOf(base).wallJoins.length, closed ? 4 : 2);
    assert.equal(storeyOf(base).wallTJunctions.length, 1);
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
    assert.equal(storeyOf(base).windows.length, 0);
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
    assert.equal(storeyOf(moved).windows[0]!.position, 0.75);
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
    assert.equal((ifc.match(/=IFCWALL\(/g) || []).length, closed ? 5 : 4);
    assert.equal((ifc.match(/=IFCWINDOW\(/g) || []).length, 1);
    assert.equal((ifc.match(/=IFCRELVOIDSELEMENT\(/g) || []).length, 1);
    assert.equal((ifc.match(/=IFCRELFILLSELEMENT\(/g) || []).length, 1);
    // The tool places a window element: one fixed panel (FL4).
    assert.match(ifc, /1\.1,1\.,\.WINDOW\.,\.SINGLE_PANEL\./);
    assert.ok(ifc.includes("IFCRATIOMEASURE(0.75)"));
    assert.ok(ifc.includes("IFCLENGTHMEASURE(0.8)"));
  }
});

// Decken, Teil A (docs/SLAB_ELEMENT.md): model, drawing, levels, file and plan.
import { addSlab, updateSlab } from "../slabs/actions.ts";
import { SLAB_DEFAULTS, storeySlabLevels, slabArea } from "../../domain/elements/slab/model.ts";
import { ELEMENT_KINDS as SLAB_KINDS, storeyElements } from "../../domain/elements/registry.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { setStoreyHeight } from "../storeys/actions.ts";
import { createHistory, commitProject, undoProject } from "../history/project-history.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { beginSelectionMove, previewSelectionMove } from "../selection/move.ts";
import { previewSlabCommand } from "../slabs/command.ts";
import { projectSnapPrimitives } from "../snapping/project-references.ts";
import { addWall } from "../walls/actions.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import type { Project } from "../../domain/project/schema.ts";

const slabBase = (): Project => {
  const p = createProject("p", "eg");
  return setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3 });
};
const lShape = [
  { x: 0, y: 0 },
  { x: 6, y: 0 },
  { x: 6, y: 3 },
  { x: 3, y: 3 },
  { x: 3, y: 5 },
  { x: 0, y: 5 },
];

test("a slab drawn in a storey is its ceiling on the Decke layer and round-trips", () => {
  const base = slabBase();
  const p = createDrawing(base, base, "slab-1", {
    kind: "slab",
    points: [...lShape, { x: 0, y: 0 }],
    ...SLAB_DEFAULTS,
  });
  const slab = storeyOf(p).slabs![0]!;
  // The explicit return to the first point closes the ring implicitly.
  assert.equal(slab.points.length, 6);
  assert.equal(slab.layerId, "layer:slab");
  assert.equal(slab.thickness, 0.2);
  assert.equal(SLAB_KINDS.slab.label, "Decke");
  assert.deepEqual(storeyElements(storeyOf(p), "slab"), [slab]);
  assert.equal(slabArea(slab), 24);
  // Top on the raw floor of the storey above (EG 3,00 m), thickness downward.
  assert.deepEqual(storeySlabLevels(p, "eg", slab), { top: 3, bottom: 2.8 });
  const reopened = readProjectFile(serializeProject(p));
  assert.equal(reopened.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(PROJECT_SCHEMA_VERSION, 43);
  assert.deepEqual(reopened, p);
});

test("thickness keeps the slab top and moves the underside; the top follows the storey height", () => {
  const p = addSlab(slabBase(), { id: "s", points: lShape, ...SLAB_DEFAULTS });
  const thicker = updateSlab(p, "s", { thickness: 0.3 });
  assert.deepEqual(storeySlabLevels(thicker, "eg", storeyOf(thicker).slabs![0]!), {
    top: 3,
    bottom: 2.7,
  });
  const offset = updateSlab(p, "s", { topOffset: -0.05 });
  assert.deepEqual(storeySlabLevels(offset, "eg", storeyOf(offset).slabs![0]!), {
    top: 2.95,
    bottom: 2.75,
  });
  // Nothing is stored: a new storey height moves the slab with it.
  const higher = setStoreyHeight(p, p, { projectId: "p", storeyId: "eg", height: 3.2 });
  assert.equal(storeySlabLevels(higher, "eg", storeyOf(higher).slabs![0]!)!.top, 3.2);
  // Unknown storey height: no invented level.
  const unknown = addSlab(createProject("q", "eg"), { id: "s", points: lShape, ...SLAB_DEFAULTS });
  assert.equal(storeySlabLevels(unknown, "eg", storeyOf(unknown).slabs![0]!), null);
});

test("invalid slabs are rejected without changing the model; one undo per change", () => {
  const p = addSlab(slabBase(), { id: "s", points: lShape, ...SLAB_DEFAULTS });
  const bowTie = [
    { x: 0, y: 0 },
    { x: 2, y: 2 },
    { x: 2, y: 0 },
    { x: 0, y: 2 },
  ];
  assert.throws(() => addSlab(p, { id: "x", points: bowTie, ...SLAB_DEFAULTS }));
  assert.throws(() => updateSlab(p, "s", { thickness: 0 }));
  assert.throws(() => updateSlab(p, "s", { thickness: Number.NaN }));
  assert.throws(() => addSlab(p, { id: "s", points: lShape, ...SLAB_DEFAULTS }), /Duplicate ID/);
  assert.throws(() => updateSlab(p, "missing", { thickness: 0.3 }), /Unbekannte Decke/);
  assert.equal(storeyOf(p).slabs!.length, 1);
  const h0 = createHistory(p);
  const h1 = commitProject(h0, updateSlab(h0.present, "s", { thickness: 0.25 }));
  assert.equal(storeyOf(h1.present).slabs![0]!.thickness, 0.25);
  assert.equal(undoProject(h1).present, h0.present);
});

test("schema 28 files migrate without slabs and cannot smuggle slabs in", () => {
  const raw = JSON.parse(serializeProject(slabBase()));
  raw.schemaVersion = 28;
  const migrated = readProjectFile(JSON.stringify(raw));
  assert.equal(migrated.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(migrated.storeys[0]!.slabs, undefined);
  raw.storeys[0].slabs = [{ id: "s", layerId: "layer:slab", points: lShape, ...SLAB_DEFAULTS }];
  assert.throws(() => readProjectFile(JSON.stringify(raw)));
  raw.schemaVersion = 27;
  assert.throws(() => readProjectFile(JSON.stringify(raw)));
  delete raw.storeys[0].slabs;
  assert.equal(readProjectFile(JSON.stringify(raw)).schemaVersion, PROJECT_SCHEMA_VERSION);
});

test("the plan draws slabs first and hides them with their layer; delete, move, commands, snaps", () => {
  const hatchBase = slabBase();
  const withHatch = createDrawing(hatchBase, hatchBase, "h", {
    kind: "hatch",
    points: [
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
    fill: { color: "#94a3b8", opacity: 0.35 },
  });
  const p = addSlab(withHatch, { id: "s", points: lShape, ...SLAB_DEFAULTS });
  const scene = derivePlanScene(p, () => true);
  assert.deepEqual(
    planSceneRuns(scene, []).map((r) => r.kind),
    ["slab", "hatch"],
  );
  assert.equal(derivePlanScene(p, (id) => id !== "s").slabs.size, 0);
  const deleted = previewDeleteSelection(p, [{ kind: "slab", id: "s" }], undefined).result;
  assert.equal(storeyOf(deleted).slabs!.length, 0);
  // Teil B3: a slab moves as a whole, alone or with a wall; one undo step.
  const session = beginSelectionMove(p, [{ kind: "slab", id: "s" }], { x: 0, y: 0 });
  const moved = previewSelectionMove(session, p, [{ kind: "slab", id: "s" }], { x: 2, y: 1 });
  assert.deepEqual(storeyOf(moved).slabs![0]!.points[0], { x: 2, y: 1 });
  assert.deepEqual(storeyOf(moved).hatches, storeyOf(p).hatches);
  const h0 = createHistory(p);
  const h1 = commitProject(h0, moved);
  assert.equal(h1.past.length, 1);
  assert.equal(undoProject(h1).present, h0.present);
  const withWall = addWall(p, {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  const both = [
    { kind: "wall" as const, id: "w" },
    { kind: "slab" as const, id: "s" },
  ];
  const group = previewSelectionMove(
    beginSelectionMove(withWall, both, { x: 0, y: 0 }),
    withWall,
    both,
    { x: 0, y: 3 },
  );
  assert.deepEqual(storeyOf(group).walls[0]!.start, { x: 0, y: 3 });
  assert.deepEqual(storeyOf(group).slabs![0]!.points[0], { x: 0, y: 3 });
  // Text and voice: thickness and offset of the selected slab, units, errors.
  const command = (text: string, target = { kind: "slab" as const, id: "s" }) =>
    previewSlabCommand(p, target, text);
  assert.equal(storeyOf(command("Deckenstärke 25 cm")!.result).slabs![0]!.thickness, 0.25);
  assert.equal(storeyOf(command("deckenversatz auf -5 cm")!.result).slabs![0]!.topOffset, -0.05);
  assert.match(command("Deckenstärke 25 cm")!.summary, /0,2 → 0,25 m/);
  assert.equal(command("Wandlänge auf 6 m"), null);
  assert.throws(() => command("Deckenstärke 0 m"), /größer als null/);
  assert.throws(
    () => command("Deckenstärke 25 cm", { kind: "hatch", id: "h" } as never),
    /Decke auswählen/,
  );
  // Snap points at the slab corners and edge midpoints, like a hatch outline.
  const features = projectSnapPrimitives(p)
    .references.filter((r) => r.entityId === "s")
    .map((r) => r.feature);
  assert.deepEqual(features.filter((f) => f.startsWith("vertex-")).length, 6);
  assert.equal(features.filter((f) => f.startsWith("segment-")).length, 6);
});

test("a storey with only a ceiling slab has a 3D body and an IfcSlab (Teil B)", async () => {
  const base = slabBase();
  const p = addSlab(base, { id: "s", points: lShape, ...SLAB_DEFAULTS });
  assert.equal(buildBuildingSolid(base).faces.length, 0);
  assert.equal(buildBuildingSolid(p).faces.length, 14);
  const date = new Date(0);
  assert.ok((await exportIfc(p, date)).includes("IFCSLAB"));
});

// Decken E1 (docs/SLAB_ELEMENT.md): outline editing through the shared hatch edit path.
import { prepareDirectEditPreview } from "../direct-edit/prepared-preview.ts";
import { editAtPointer, type EditSession } from "../direct-edit/session.ts";
import { closedContour } from "../direct-edit/contour.ts";

test("slab corners, sides and offset edit through the shared path; preview equals commit", () => {
  const base = addSlab(slabBase(), {
    id: "s",
    points: lShape,
    thickness: 0.25,
    topOffset: -0.05,
  });
  assert.deepEqual(closedContour(base, { kind: "slab", id: "s" }), lShape);
  const cases: [
    EditSession["action"],
    number,
    { x: number; y: number },
    { x: number; y: number },
  ][] = [
    ["point", 1, { x: 6, y: 0 }, { x: 7, y: -0.5 }],
    ["stretch", 2, { x: 6, y: 3 }, { x: 6.5, y: 3.5 }],
    ["edge", 1, { x: 6, y: 1.5 }, { x: 7, y: 1.5 }],
    ["insert", 0, { x: 3, y: 0 }, { x: 3, y: -1 }],
  ];
  for (const [action, index, anchor, pointer] of cases) {
    const session: EditSession = { base, target: { kind: "slab", id: "s" }, action, index, anchor };
    const full = editAtPointer(session, base, pointer);
    const slab = storeyOf(full).slabs![0]!;
    assert.notDeepEqual(slab.points, lShape, action);
    assert.equal(slab.thickness, 0.25);
    assert.equal(slab.topOffset, -0.05);
    if (action === "insert") assert.equal(slab.points.length, 7);
    const prepared = prepareDirectEditPreview(session)!;
    const selection = { kind: "slab", id: "s" } as const;
    const view = prepared.materialize!(base, selection, pointer);
    assert.deepEqual(storeyOf(view).slabs, storeyOf(full).slabs, action);
    const patch = prepared.evaluate(base, selection, pointer);
    assert.deepEqual(storeyOf(patch.geometry).slabs, [slab], action);
    assert.equal(storeyOf(patch.geometry).height, 3);
    assert.deepEqual(buildBuildingSolid(view).faces, buildBuildingSolid(full).faces, action);
  }
});

test("slab offset moves a convex outline side; non-convex outlines are refused like hatches", () => {
  const rectangle = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 4 },
    { x: 0, y: 4 },
  ];
  const base = addSlab(slabBase(), { id: "s", points: rectangle, ...SLAB_DEFAULTS });
  const session: EditSession = {
    base,
    target: { kind: "slab", id: "s" },
    action: "offset",
    index: 0,
    anchor: { x: 3, y: 0 },
  };
  const full = editAtPointer(session, base, { x: 3, y: -0.3 });
  assert.ok(Math.abs(slabArea(storeyOf(full).slabs![0]!) - 6.6 * 4.6) < 1e-9);
  const view = prepareDirectEditPreview(session)!.materialize!(
    base,
    { kind: "slab", id: "s" },
    { x: 3, y: -0.3 },
  );
  assert.deepEqual(storeyOf(view).slabs, storeyOf(full).slabs);
  const l = addSlab(slabBase(), { id: "s", points: lShape, ...SLAB_DEFAULTS });
  assert.throws(() => editAtPointer({ ...session, base: l }, l, { x: 3, y: -0.3 }), /konvexe/);
});

test("slab outline edits reject crossings, keep the model and commit as one undo step", () => {
  const base = addSlab(slabBase(), { id: "s", points: lShape, ...SLAB_DEFAULTS });
  const session: EditSession = {
    base,
    target: { kind: "slab", id: "s" },
    action: "point",
    index: 3,
    anchor: { x: 3, y: 3 },
  };
  // Dragging the inner corner beyond the left side makes the outline cross itself.
  assert.throws(() => editAtPointer(session, base, { x: -1, y: 4 }));
  assert.throws(() =>
    prepareDirectEditPreview(session)!.evaluate(base, session.target, { x: -1, y: 4 }),
  );
  assert.deepEqual(storeyOf(base).slabs![0]!.points, lShape);
  let state = createEditingState(base);
  state = editingReducer(state, {
    type: "begin",
    target: { kind: "slab", id: "s" },
    action: "point",
    index: 3,
    anchor: { x: 3, y: 3 },
  });
  state = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: { kind: "slab", id: "s" },
    point: { x: 4, y: 4 },
  });
  assert.deepEqual(storeyOf(state.history.present).slabs![0]!.points[3], { x: 4, y: 4 });
  assert.equal(state.history.past.length, 1);
  assert.deepEqual(editingReducer(state, { type: "undo" }).history.present, base);
});

test("a click on the start point closes every click-by-click tool by its declared closure", () => {
  const drawn = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 2 },
    { x: 2, y: 2 },
    { x: 2, y: 4 },
  ];
  const start = { x: 0, y: 0 };
  // Polygon tools (hatch, slab): the L-outline closes as drawn, no repeated start point.
  const polygon = resolvePathClick(drawn, start, "polygon");
  assert.deepEqual(polygon, { kind: "finish", points: drawn });
  // Polyline: the start point is repeated, which makes the line closed.
  const polyline = resolvePathClick(drawn, { ...start }, "polyline");
  assert.deepEqual(polyline, { kind: "finish", points: [...drawn, start] });
  // Tools without click closure, near misses and too few points keep drawing.
  assert.equal(resolvePathClick(drawn, start, "none").kind, "append");
  assert.deepEqual(resolvePathClick(drawn, { x: 0.001, y: 0 }, "polygon"), {
    kind: "append",
    points: [...drawn, { x: 0.001, y: 0 }],
  });
  assert.equal(resolvePathClick(drawn.slice(0, 2), start, "polygon").kind, "append");
  assert.equal(closesAtStart(drawn.slice(0, 3), start, "polygon"), true);
  assert.equal(closesAtStart([], start, "polygon"), false);
  // Near the start (10 px on screen) the start wins over guides and angle snaps.
  assert.deepEqual(capturedStart(drawn, { x: 0.03, y: -0.03 }, 200, "polygon"), start);
  assert.equal(capturedStart(drawn, { x: 0.06, y: 0 }, 200, "polygon"), null);
  assert.equal(capturedStart(drawn, { x: 0.06, y: 0 }, 100, "polyline")?.x, 0);
  assert.equal(capturedStart(drawn, start, 200, "none"), null);
  assert.equal(capturedStart(drawn.slice(0, 2), start, 200, "polygon"), null);
  const captured = capturedStart(drawn, { x: 0.01, y: 0.01 }, 200, "polygon")!;
  assert.equal(resolvePathClick(drawn, captured, "polygon").kind, "finish");
  // The finished points are accepted unchanged by the shared creation path of each tool.
  const base = slabBase();
  const ring = [...drawn, { x: 0, y: 4 }];
  const closed = resolvePathClick(ring, start, "polygon").points;
  const withSlab = createDrawing(base, base, "s-new", {
    kind: "slab",
    points: closed,
    ...SLAB_DEFAULTS,
  });
  assert.deepEqual(storeyOf(withSlab).slabs!.at(-1)!.points, ring);
  const withHatch = createDrawing(base, base, "h-new", {
    kind: "hatch",
    points: closed,
    fill: { color: "#94a3b8", opacity: 0.35 },
  });
  assert.deepEqual(storeyOf(withHatch).hatches.at(-1)!.points, ring);
  const line = createDrawing(base, base, "l-new", {
    kind: "line",
    lineKind: "polyline",
    points: resolvePathClick(ring, start, "polyline").points,
    appearance: defaultLineAppearance,
  });
  const points = storeyOf(line).lines!.at(-1)!.points;
  assert.deepEqual(points, [...ring, start]);
});

test("a corner moved onto another corner is deleted for every vertex element; preview equals commit", () => {
  // Shared geometry rule (docs/POLYGON_REGELN.md, Regel 2).
  const square = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ];
  assert.deepEqual(mergeOntoVertex(square, 1, { x: 4, y: 4 }, "ring"), [
    { x: 0, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ]);
  assert.equal(mergeOntoVertex(square, 1, { x: 5, y: 0 }, "ring"), null);
  assert.throws(() => mergeOntoVertex(square.slice(0, 3), 0, { x: 4, y: 0 }, "ring"), /drei/);
  const open = [...square];
  assert.deepEqual(mergeOntoVertex(open, 1, { x: 4, y: 4 }, "path"), [
    { x: 0, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
  ]);
  // An open path's end placed on its other end closes it (normal move), never deletes.
  assert.equal(mergeOntoVertex(open, 3, { x: 0, y: 0 }, "path"), null);
  assert.deepEqual(moveVertex(open, 3, { x: 0, y: 0 }, "path"), [
    ...square.slice(0, 3),
    { x: 0, y: 0 },
  ]);
  assert.equal(mergeOntoVertex(open.slice(0, 2), 0, { x: 4, y: 0 }, "path"), null);
  // A closed path treats its repeated start as one corner, whichever end is moved.
  const closed = [...square, { x: 0, y: 0 }];
  const withoutStart = [
    { x: 4, y: 0 },
    { x: 4, y: 4 },
    { x: 0, y: 4 },
    { x: 4, y: 0 },
  ];
  assert.deepEqual(mergeOntoVertex(closed, 0, { x: 4, y: 0 }, "path"), withoutStart);
  assert.deepEqual(mergeOntoVertex(closed, 4, { x: 4, y: 0 }, "path"), withoutStart);

  // Slab and hatch: commit, prepared preview and patch agree; one undo step restores.
  const reduced = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 3 },
    { x: 3, y: 5 },
    { x: 0, y: 5 },
  ];
  const slabProject = addSlab(slabBase(), { id: "s", points: lShape, ...SLAB_DEFAULTS });
  const hatchBase = slabBase();
  const hatchProject = createDrawing(hatchBase, hatchBase, "h", {
    kind: "hatch",
    points: lShape,
    fill: { color: "#94a3b8", opacity: 0.35 },
  });
  for (const [base, target] of [
    [slabProject, { kind: "slab", id: "s" }],
    [hatchProject, { kind: "hatch", id: "h" }],
  ] as const) {
    const session: EditSession = {
      base,
      target,
      action: "point",
      index: 3,
      anchor: { x: 3, y: 3 },
    };
    const pointer = { x: 6, y: 3 };
    const full = editAtPointer(session, base, pointer);
    const points = (s: Project) =>
      target.kind === "slab" ? storeyOf(s).slabs![0]!.points : storeyOf(s).hatches.at(-1)!.points;
    assert.deepEqual(points(full), reduced, target.kind);
    const prepared = prepareDirectEditPreview(session)!;
    assert.deepEqual(points(prepared.materialize!(base, target, pointer)), reduced);
    assert.deepEqual(points(prepared.evaluate(base, target, pointer).geometry as Project), reduced);
    let state = createEditingState(base);
    state = editingReducer(state, {
      type: "begin",
      target,
      action: "point",
      index: 3,
      anchor: { x: 3, y: 3 },
    });
    state = editingReducer(state, {
      type: "confirm",
      session: state.session!,
      selection: target,
      point: pointer,
    });
    assert.deepEqual(points(state.history.present), reduced);
    assert.equal(state.history.past.length, 1);
    assert.deepEqual(editingReducer(state, { type: "undo" }).history.present, base);
  }
  // Near another corner (10 px) the corner wins over all snaps; never the moved one itself.
  const near: EditSession = {
    base: slabProject,
    target: { kind: "slab", id: "s" },
    action: "point",
    index: 3,
    anchor: { x: 3, y: 3 },
  };
  assert.deepEqual(capturedVertex(near, { x: 5.97, y: 3.02 }, 200), { x: 6, y: 3 });
  assert.equal(capturedVertex(near, { x: 5.9, y: 3 }, 200), null);
  assert.equal(capturedVertex(near, { x: 3, y: 3 }, 200), null);
  assert.equal(capturedVertex({ ...near, action: "stretch" }, { x: 6, y: 3 }, 200), null);
  assert.equal(capturedVertex({ ...near, index: null }, { x: 6, y: 3 }, 200), null);
  // A triangle keeps all three corners in commit and preview.
  const triangle = addSlab(slabBase(), { id: "t", points: square.slice(0, 3), ...SLAB_DEFAULTS });
  const small: EditSession = {
    base: triangle,
    target: { kind: "slab", id: "t" },
    action: "point",
    index: 0,
    anchor: { x: 0, y: 0 },
  };
  assert.throws(() => editAtPointer(small, triangle, { x: 4, y: 0 }), /drei/);
  assert.throws(
    () => prepareDirectEditPreview(small)!.evaluate(triangle, small.target, { x: 4, y: 0 }),
    /drei/,
  );

  // Polyline: same rule through the line preview.
  const lineBase = slabBase();
  const withLine = createDrawing(lineBase, lineBase, "l", {
    kind: "line",
    lineKind: "polyline",
    points: closed,
    appearance: defaultLineAppearance,
  });
  const lineSession: EditSession = {
    base: withLine,
    target: { kind: "line", id: "l" },
    action: "point",
    index: 0,
    anchor: { x: 0, y: 0 },
  };
  const lineFull = editAtPointer(lineSession, withLine, { x: 4, y: 0 });
  assert.deepEqual(storeyOf(lineFull).lines!.at(-1)!.points, withoutStart);
  const lineView = prepareDirectEditPreview(lineSession)!.materialize!(
    withLine,
    lineSession.target,
    { x: 4, y: 0 },
  );
  assert.deepEqual(storeyOf(lineView).lines, storeyOf(lineFull).lines);
});

test("roof tool: drawing creates one roof; outline edits keep the reference line, one undo step", () => {
  // Dach D3 (docs/ROOF_ELEMENT.md).
  const base = slabBase();
  const outline = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 4 },
    { x: 0, y: 4 },
    { x: 0, y: 0 }, // a drawing may return to its start; the ring closes implicitly
  ];
  const request = {
    kind: "roof" as const,
    points: outline,
    referenceLine: { start: { x: 0, y: 0 }, end: { x: 6, y: 0 } },
    rise: "left" as const,
    referenceHeight: 0,
    pitch: 30,
    thickness: 0.2,
    eaveCut: "perpendicular" as const,
    topCut: "vertical" as const,
  };
  const drawn = createDrawing(base, base, "r", request);
  const roof = storeyOf(drawn).roofs![0]!;
  assert.equal(roof.points.length, 4);
  assert.equal(drawn.layers.find((l) => l.id === roof.layerId)!.name, "Dach");
  // Too shallow for the chosen cuts: readable refusal, no roof.
  assert.throws(
    () =>
      createDrawing(base, base, "r2", {
        ...request,
        points: outline.map((p) => ({ x: p.x, y: p.y / 40 })),
        eaveCut: "horizontal",
        topCut: "horizontal",
      }),
    /zu schmal/,
  );
  const target = { kind: "roof", id: "r" } as const;
  const cases: [
    EditSession["action"],
    number,
    { x: number; y: number },
    { x: number; y: number },
  ][] = [
    ["point", 2, { x: 6, y: 4 }, { x: 7, y: 5 }],
    ["edge", 1, { x: 6, y: 2 }, { x: 7, y: 2 }],
    ["insert", 2, { x: 3, y: 4 }, { x: 3, y: 5 }],
    ["offset", 1, { x: 6, y: 2 }, { x: 6.5, y: 2 }],
  ];
  for (const [action, index, anchor, pointer] of cases) {
    const session: EditSession = { base: drawn, target, action, index, anchor };
    const edited = storeyOf(editAtPointer(session, drawn, pointer)).roofs![0]!;
    assert.notDeepEqual(edited.points, roof.points, action);
    assert.deepEqual(edited.referenceLine, roof.referenceLine, action);
    assert.equal(edited.pitch, 30, action);
  }
  let state = createEditingState(drawn);
  state = editingReducer(state, {
    type: "begin",
    target,
    action: "point",
    index: 2,
    anchor: { x: 6, y: 4 },
  });
  state = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: { x: 7, y: 5 },
  });
  assert.deepEqual(storeyOf(state.history.present).roofs![0]!.points[2], { x: 7, y: 5 });
  assert.equal(state.history.past.length, 1);
  assert.deepEqual(editingReducer(state, { type: "undo" }).history.present, drawn);
  // A property change is one checked update, one history step.
  state = editingReducer(createEditingState(drawn), {
    type: "project",
    project: updateRoof(drawn, "r", { pitch: 40, rise: "right" }),
  });
  assert.equal(state.history.past.length, 1);
  assert.equal(storeyOf(state.history.present).roofs![0]!.rise, "right");
});

import { enclosedRoomOutline } from "../rooms/enclosure.ts";
import { addWindow } from "../windows/actions.ts";
import { updateRoom } from "../rooms/actions.ts";
import { roomArea, roomLabelPoint } from "../../domain/elements/room/model.ts";
import { contains } from "../../geometry/polygons/contains.ts";
import { selectionSummary } from "../../components/cad/demand-menu.ts";

test("room tool: click between walls takes the inner faces; drawing, editing and moving like a slab", () => {
  // Raum R2 (docs/ROOM_ELEMENT.md).
  let walled = slabBase();
  const ring = [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 6 },
    { x: 0, y: 6 },
  ];
  ring.forEach((start, i) => {
    walled = addWall(walled, {
      id: `w${i}`,
      start,
      end: ring[(i + 1) % 4]!,
      thickness: 0.24,
      height: 2.8,
    });
  });
  const whole = enclosedRoomOutline(walled, { x: 2, y: 2 });
  assert.ok(Math.abs(roomArea({ points: whole }) - 7.76 * 5.76) < 1e-6);
  // A window does not open the boundary.
  const withWindow = addWindow(walled, {
    id: "f",
    wallId: "w0",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  assert.ok(
    Math.abs(roomArea({ points: enclosedRoomOutline(withWindow, { x: 2, y: 2 }) }) - 7.76 * 5.76) <
      1e-6,
  );
  // A partition splits it; clicking into a wall or outside is refused readably.
  const split = addWall(walled, {
    id: "w4",
    start: { x: 4, y: 0 },
    end: { x: 4, y: 6 },
    thickness: 0.24,
    height: 2.8,
  });
  const left = enclosedRoomOutline(split, { x: 2, y: 2 });
  assert.ok(Math.abs(roomArea({ points: left }) - 3.76 * 5.76) < 1e-6);
  assert.throws(() => enclosedRoomOutline(split, { x: 4, y: 2 }), /kein von Wänden umschlossener/);
  assert.throws(() => enclosedRoomOutline(split, { x: 20, y: 2 }), /kein von Wänden umschlossener/);
  // The outline becomes a room with the next number, name and optional floor build-up.
  const drawn = createDrawing(split, split, "r", {
    kind: "room",
    points: left,
    name: "Wohnen",
    floorBuildUp: 0.12,
  });
  const room = storeyOf(drawn).rooms![0]!;
  assert.deepEqual([room.number, room.name, room.floorBuildUp], ["R-001", "Wohnen", 0.12]);
  assert.equal(drawn.layers.find((l) => l.id === room.layerId)!.name, "Raum");
  const second = createDrawing(drawn, drawn, "r2", {
    kind: "room",
    points: enclosedRoomOutline(split, { x: 6, y: 2 }),
  });
  const other = storeyOf(second).rooms![1]!;
  assert.deepEqual([other.number, other.name, other.floorBuildUp], ["R-002", "", undefined]);
  // Plan: own paint run; menu summary names number, name and area.
  assert.ok(
    planSceneRuns(
      derivePlanScene(second, () => true),
      [],
    ).some((r) => r.kind === "room"),
  );
  assert.match(selectionSummary(second, { kind: "room", id: "r" })!.title, /R-001 · Wohnen/);
  assert.match(selectionSummary(second, { kind: "room", id: "r" })!.details, /21,66 m²/);
  // The stamp sits inside even for an L-shaped outline.
  assert.ok(contains(lShape, roomLabelPoint(lShape)));
  const u = [
    { x: 0, y: 0 },
    { x: 6, y: 0 },
    { x: 6, y: 4 },
    { x: 5, y: 4 },
    { x: 5, y: 1 },
    { x: 1, y: 1 },
    { x: 1, y: 4 },
    { x: 0, y: 4 },
  ];
  assert.ok(contains(u, roomLabelPoint(u)));
  // Outline edits work like a slab's and keep number and name; one undo step.
  const target = { kind: "room", id: "r" } as const;
  const corner = room.points[1]!;
  const session: EditSession = {
    base: drawn,
    target,
    action: "point",
    index: 1,
    anchor: corner,
  };
  const edited = storeyOf(editAtPointer(session, drawn, { x: corner.x + 0.5, y: corner.y }))
    .rooms![0]!;
  assert.notDeepEqual(edited.points, room.points);
  assert.deepEqual([edited.number, edited.name], ["R-001", "Wohnen"]);
  const offset = storeyOf(
    editAtPointer(
      { base: drawn, target, action: "offset", index: 0, anchor: room.points[0]! },
      drawn,
      { x: room.points[0]!.x, y: room.points[0]!.y - 0.5 },
    ),
  ).rooms![0]!;
  assert.notDeepEqual(offset.points, room.points);
  // Properties: duplicate numbers refused, floor build-up removable.
  assert.throws(() => updateRoom(second, "r2", { number: "r-001" }));
  assert.equal(
    storeyOf(updateRoom(drawn, "r", { floorBuildUp: undefined })).rooms![0]!.floorBuildUp,
    undefined,
  );
  // Moving: alone, and together with the walls.
  const one = [{ kind: "room" as const, id: "r" }];
  const moved = previewSelectionMove(beginSelectionMove(drawn, one, { x: 0, y: 0 }), drawn, one, {
    x: 1,
    y: 2,
  });
  assert.deepEqual(storeyOf(moved).rooms![0]!.points[0], {
    x: room.points[0]!.x + 1,
    y: room.points[0]!.y + 2,
  });
  const all = [...one, { kind: "wall" as const, id: "w0" }];
  const group = previewSelectionMove(beginSelectionMove(drawn, all, { x: 0, y: 0 }), drawn, all, {
    x: 0,
    y: 3,
  });
  assert.deepEqual(storeyOf(group).rooms![0]!.points[0], {
    x: room.points[0]!.x,
    y: room.points[0]!.y + 3,
  });
  assert.deepEqual(storeyOf(group).walls[0]!.start, { x: 0, y: 3 });
  const deleted = previewDeleteSelection(drawn, one, undefined).result;
  assert.equal(storeyOf(deleted).rooms!.length, 0);
});

import { workingRoomClearHeights, workingRoomHeightLines } from "../rooms/actions.ts";
import { heightLineLabel, withAddedHeightLine } from "../rooms/height-lines.ts";
import { addRoof as addRoofAction } from "../roofs/actions.ts";
import {
  clearHeightLine,
  defaultHeightLines,
  isDefaultHeightLineList,
  type HeightLine,
} from "../../domain/elements/room/height-line.ts";

const ring8x6 = [
  { x: 0, y: 0 },
  { x: 8, y: 0 },
  { x: 8, y: 6 },
  { x: 0, y: 6 },
];

/** Storey 3,00 m; mono-pitch roof (underside 0,50 m at y = 0, 30°, 0,20 m thick) over y ≤ 5,
 * slab (0,20 m: underside 2,80, top 3,00) over 5 ≤ y ≤ 5,5; y > 5,5 open; room 8 × 6 m. */
function roofRoom(heightLines?: HeightLine[]) {
  let p = slabBase();
  p = addRoofAction(p, {
    id: "d",
    points: [
      { x: -1, y: -1 },
      { x: 9, y: -1 },
      { x: 9, y: 5 },
      { x: -1, y: 5 },
    ],
    referenceLine: { start: { x: 0, y: 0 }, end: { x: 8, y: 0 } },
    rise: "left",
    referenceHeight: 0.5,
    pitch: 30,
    thickness: 0.2,
    eaveCut: "vertical",
    topCut: "vertical",
  });
  p = addSlab(p, {
    id: "s",
    points: [
      { x: -1, y: 5 },
      { x: 9, y: 5 },
      { x: 9, y: 5.5 },
      { x: -1, y: 5.5 },
    ],
    ...SLAB_DEFAULTS,
  });
  return createDrawing(p, p, "r", {
    kind: "room",
    points: ring8x6,
    ...(heightLines ? { heightLines } : {}),
  });
}
const tan30 = Math.tan(Math.PI / 6);
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

test("room heights: clear height range and open part under roof and slab (R3)", () => {
  const p = roofRoom();
  const room = storeyOf(p).rooms![0]!;
  const clear = workingRoomClearHeights(p, room);
  assert.ok(near(clear.min!, 0.5) && near(clear.max!, 0.5 + 5 * tan30));
  assert.ok(near(clear.openArea, 4));
  const raised = workingRoomClearHeights(p, { ...room, floorBuildUp: 0.12 });
  assert.ok(near(raised.min!, 0.38));
  // Without slab and roof everything is open and visibly named, never guessed.
  const empty = slabBase();
  const bare = createDrawing(empty, empty, "r", { kind: "room", points: ring8x6 });
  const open = workingRoomClearHeights(bare, storeyOf(bare).rooms![0]!);
  assert.equal(open.min, null);
  assert.ok(near(open.openArea, 48));
  assert.equal(workingRoomHeightLines(bare, storeyOf(bare).rooms![0]!)[0]!.areaAbove, 0);
});

test("height lines: own height, colour, style, lower and upper reference per line (R3b)", () => {
  // Defaults 1,00 / 2,00 m clear height; not stored in the room.
  const p = roofRoom();
  const room = storeyOf(p).rooms![0]!;
  assert.equal("heightLines" in room, false);
  const defaults = workingRoomHeightLines(p, room);
  assert.deepEqual(
    defaults.map((r) => r.line.height),
    [1, 2],
  );
  const y1 = 0.5 / tan30;
  assert.ok(near(defaults[0]!.areaAbove, 8 * (5 - y1) + 4));
  assert.ok(near(defaults[0]!.areaBelow, 8 * y1));
  assert.ok(near(defaults[0]!.share, (8 * (5 - y1) + 4) / 48));
  assert.equal(defaults[0]!.segments.length, 1);
  assert.ok(near(defaults[0]!.segments[0]!.start.y, y1));
  // 2,30 m from the finished floor to the outer roof skin (storey proof): the roof top lies
  // 0,20 / cos 30° above the underside; the slab counts with its top (3,00 m).
  const skin = 0.2 / Math.cos(Math.PI / 6);
  const proof: HeightLine = {
    ...clearHeightLine("h1", 2.3),
    color: "#dc2626",
    upper: "outerSkin",
  };
  const withProof = roofRoom([proof]);
  const [result] = workingRoomHeightLines(withProof, storeyOf(withProof).rooms![0]!);
  const y23 = (2.3 - skin - 0.5) / tan30;
  assert.ok(near(result!.segments[0]!.start.y, y23));
  assert.ok(near(result!.areaAbove, 8 * (5 - y23) + 4));
  assert.equal(heightLineLabel(proof), "2,30 Dachhaut");
  // Lower reference: a floor build-up moves finished-floor lines uphill, raw-floor lines not.
  const raw: HeightLine = { ...clearHeightLine("h2", 1), lower: "rawFloor" };
  const both = roofRoom([clearHeightLine("h1", 1), raw]);
  const built = { ...storeyOf(both).rooms![0]!, floorBuildUp: 0.12 };
  const [finished, rawResult] = workingRoomHeightLines(both, built);
  assert.ok(near(finished!.segments[0]!.start.y, 0.62 / tan30));
  assert.ok(near(rawResult!.segments[0]!.start.y, 0.5 / tan30));
  assert.equal(heightLineLabel(raw), "1,00 Rohfußb.");
  // A line only reached at the slab step runs along the slab edge.
  const high = workingRoomHeightLines(p, {
    ...room,
    heightLines: [clearHeightLine("h1", 2.7)],
  })[0]!;
  assert.ok(high.areaAbove > 0 && high.segments.length > 0);
  // Adding, defaults, limit.
  const added = withAddedHeightLine(defaultHeightLines());
  assert.deepEqual(
    added.map((l) => [l.id, l.height]),
    [
      ["h1", 1],
      ["h2", 2],
      ["h3", 2.5],
    ],
  );
  assert.ok(isDefaultHeightLineList(defaultHeightLines()));
  assert.ok(!isDefaultHeightLineList(added));
  let many = defaultHeightLines();
  for (let i = 0; i < 8; i++) many = withAddedHeightLine(many);
  assert.equal(many.length, 10);
  assert.throws(() => withAddedHeightLine(many), /Höchstens 10/);
  // Model checks: fixed-colour styles keep their colour, ids are unique.
  const plain = clearHeightLine("h1", 1);
  const fixed = { ...plain, style: { ...plain.style, colorEditable: false } };
  assert.throws(
    () => updateRoom(p, "r", { heightLines: [{ ...fixed, color: "#ff0000" }] }),
    /feste Farbe/,
  );
  assert.throws(() => updateRoom(p, "r", { heightLines: [proof, proof] }), /eigene ID/);
  // Plan scene and menu use the same results.
  const scene = derivePlanScene(withProof, () => true);
  assert.equal(scene.roomHeights.get("r")!.lines[0]!.segments.length, 1);
  const details = selectionSummary(withProof, { kind: "room", id: "r" })!.details;
  assert.match(details, /lichte Höhe 0,50–3,39 m/);
  assert.match(details, /ab 2,30 m \(bis Dachhaut\): \d+,\d{2} m² \(\d+(,\d)? %\)/);
  assert.match(details, /Höhe offen: 4,00 m²/);
  // One height line change is one undo step; restoring the defaults removes the stored list.
  let state = createEditingState(p);
  state = editingReducer(state, {
    type: "project",
    project: updateRoom(p, "r", { heightLines: [proof] }),
  });
  assert.equal(state.history.past.length, 1);
  assert.deepEqual(editingReducer(state, { type: "undo" }).history.present, p);
  const restored = updateRoom(withProof, "r", { heightLines: undefined });
  assert.equal("heightLines" in storeyOf(restored).rooms![0]!, false);
});
