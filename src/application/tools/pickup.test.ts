import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createDrawing } from "../drawing/actions.ts";
import { createHistory, commitProject, undoProject } from "../../lib/bim/history.ts";
import { pickupToolDefaults } from "./pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { rectangleContour, prepareHatchBoundaries } from "../hatches/construction.ts";
import { createDoubleSecondaryClick } from "../input/double-secondary.ts";
const points = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 2 },
  { x: 0, y: 2 },
];
function fixture() {
  const p = createExampleProject();
  return createDrawing(p, p, "source", {
    kind: "hatch",
    points,
    fill: { color: "#aabbcc", opacity: 0.6 },
    background: { visible: true, color: "#ffffff" },
    contour: { visible: true, color: "#112233" },
    layerId: p.defaultLayerIds.wall,
  });
}
test("pickup owns appearance and source layer, without model/history changes; all four constructions share defaults", () => {
  const history = createHistory(fixture()),
    p = history.present;
  const before = JSON.stringify(p);
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const preset = pickupToolDefaults(p, visibility, { kind: "hatch", id: "source" })!;
  assert.equal(preset.tool, "hatch");
  if (preset.tool !== "hatch") throw new Error("Expected hatch");
  assert.equal(history.past.length, 0);
  assert.equal(JSON.stringify(p), before);
  assert.equal(preset.values.layerId, p.defaultLayerIds.wall);
  const rings = [
    points,
    rectangleContour("diagonal", [points[0]!, points[2]!]),
    rectangleContour("side-height", points.slice(0, 3)),
    prepareHatchBoundaries(p, visibility)({ x: 1, y: 1 }),
  ];
  for (const [i, ring] of rings.entries()) {
    const next = commitProject(
      history,
      createDrawing(p, p, `new-${i}`, { kind: "hatch", points: ring, ...preset.values }),
    );
    const h = next.present.storey.hatches.at(-1)!;
    assert.equal(h.id, `new-${i}`);
    assert.deepEqual(h.fill, preset.values.fill);
    assert.deepEqual(h.background, preset.values.background);
    assert.deepEqual(h.contour, preset.values.contour);
    assert.equal(h.layerId, preset.values.layerId);
    assert.equal(next.past.length, 1);
    assert.deepEqual(undoProject(next).present, p);
  }
  preset.values.fill.color = "#123456";
  assert.equal(JSON.stringify(p), before);
});
test("pickup rejects stale, hidden, deleted and unsupported targets", () => {
  const p = fixture(),
    visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  assert.equal(pickupToolDefaults({ ...p }, visibility, { kind: "hatch", id: "source" }), null);
  assert.equal(pickupToolDefaults(p, visibility, { kind: "hatch", id: "missing" }), null);
  assert.equal(
    pickupToolDefaults(p, visibility, { kind: "reference", id: p.storey.walls[0]!.id }),
    null,
  );
  const hidden = createLayerVisibilityPolicy(p, {
    ...ALL_LAYERS_VISIBLE,
    hiddenLayerIds: [p.defaultLayerIds.wall],
  });
  assert.equal(pickupToolDefaults(p, hidden, { kind: "hatch", id: "source" }), null);
});
test("double secondary requires same target/context, nearby rapid clicks and resets after match/cancel", () => {
  const g = createDoubleSecondaryClick(),
    context = {};
  const click = { key: "hatch:a", context, x: 10, y: 10, time: 100 };
  assert.equal(g.click(click), false);
  assert.equal(g.click({ ...click, time: 300 }), true);
  assert.equal(g.click({ ...click, time: 400 }), false);
  assert.equal(g.click({ ...click, time: 500, key: "hatch:b" }), false);
  assert.equal(g.click({ ...click, time: 600, context: {} }), false);
  assert.equal(g.click({ ...click, time: 1200 }), false);
  assert.equal(g.click({ ...click, time: 1300, x: 30 }), false);
  g.reset();
  assert.equal(g.click({ ...click, time: 1400, x: 30 }), false);
});
import { placeWindow, windowPlacementInteraction } from "../drawing/window-placement.ts";
import { addWall, updateWindow } from "../../lib/bim/model.ts";

test("window pickup copies creation defaults including layer, never host or position; new host and atomic undo", () => {
  let p = createExampleProject();
  p = updateWindow(p, p.storey.windows[0]!.id, {
    width: 0.8,
    height: 1.1,
    sillHeight: 0.7,
    layerId: p.defaultLayerIds.line,
  });
  p = addWall(p, {
    id: "other",
    start: { x: 0, y: 3 },
    end: { x: 4, y: 3 },
    thickness: 0.36,
    height: 2.8,
  });
  const history = createHistory(p);
  p = history.present;
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const before = JSON.stringify(p);
  const preset = pickupToolDefaults(p, visibility, {
    kind: "window",
    id: p.storey.windows[0]!.id,
  })!;
  assert.equal(preset.tool, "window");
  if (preset.tool !== "window") throw new Error("Expected window");
  assert.deepEqual(
    Object.keys(preset.values).sort(),
    ["width", "height", "sillHeight", "layerId"].sort(),
  );
  assert.equal(JSON.stringify(p), before);
  assert.equal(history.past.length, 0);
  const draft = {
    width: String(preset.values.width),
    height: String(preset.values.height),
    sillHeight: String(preset.values.sillHeight),
    layerId: preset.values.layerId,
  };
  let next = history;
  const adapter = windowPlacementInteraction(
    p,
    visibility,
    "new-window",
    () => ({ project: p, visibility }),
    (q) => {
      next = commitProject(history, q);
    },
    () => {},
    { draft, currentDraft: () => draft },
  );
  adapter.commit({ x: 2, y: 3 });
  const created = next.present.storey.windows.at(-1)!;
  assert.equal(created.wallId, "other");
  assert.equal(created.id, "new-window");
  for (const key of ["width", "height", "sillHeight", "layerId"] as const)
    assert.equal(created[key], preset.values[key]);
  assert.equal(next.past.length, 1);
  assert.deepEqual(undoProject(next).present, p);
});

test("window placement checks chosen layer, host visibility and changed draft; pickup rejects hidden host", () => {
  const p = createExampleProject(),
    visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    point = { x: 1.5, y: 0 };
  const hidden = createLayerVisibilityPolicy(p, {
    ...ALL_LAYERS_VISIBLE,
    hiddenLayerIds: [p.defaultLayerIds.line],
  });
  assert.throws(
    () => placeWindow(p, p, hidden, "new", point, undefined, undefined, p.defaultLayerIds.line),
    /ausgeblendet/,
  );
  assert.throws(
    () => placeWindow(p, p, visibility, "new", point, undefined, undefined, "missing"),
    /existiert/,
  );
  const hostHidden = createLayerVisibilityPolicy(p, {
    ...ALL_LAYERS_VISIBLE,
    hiddenLayerIds: [p.storey.walls[0]!.layerId],
  });
  assert.equal(
    pickupToolDefaults(p, hostHidden, { kind: "window", id: p.storey.windows[0]!.id }),
    null,
  );
  const draft = { width: "1", height: "1", sillHeight: "0.8", layerId: p.defaultLayerIds.line };
  const adapter = windowPlacementInteraction(
    p,
    visibility,
    "new",
    () => ({ project: p, visibility }),
    () => assert.fail("must not commit"),
    () => {},
    { draft, currentDraft: () => ({ ...draft, layerId: p.defaultLayerIds.window }) },
  );
  assert.throws(() => adapter.commit(point));
  assert.throws(() =>
    placeWindow(p, p, visibility, "wide", point, { width: 10, height: 1, sillHeight: 0.8 }),
  );
});
import { addLine } from "../../lib/bim/model.ts";

test("line and polyline pickup transfer style and layer into independent new geometry, with one undo", () => {
  for (const sourceKind of ["line", "polyline"] as const) {
    let p = createExampleProject();
    p = addLine(p, {
      id: "source-line",
      kind: sourceKind,
      points:
        sourceKind === "line"
          ? [
              { x: 0, y: 4 },
              { x: 2, y: 4 },
            ]
          : [
              { x: 0, y: 4 },
              { x: 2, y: 4 },
              { x: 2, y: 5 },
            ],
      color: "#123abc",
      penWidth: 0.7,
      style: "dashed",
      layerId: p.defaultLayerIds.wall,
    });
    const history = createHistory(p);
    p = history.present;
    const before = JSON.stringify(p),
      visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
    const preset = pickupToolDefaults(p, visibility, { kind: "line", id: "source-line" })!;
    assert.equal(preset.tool, "line");
    if (preset.tool !== "line") throw new Error("Expected line");
    assert.deepEqual(
      Object.keys(preset.values).sort(),
      ["color", "penWidth", "style", "layerId"].sort(),
    );
    for (const lineKind of ["line", "polyline"] as const) {
      const points =
        lineKind === "line"
          ? [
              { x: 5, y: 4 },
              { x: 7, y: 4 },
            ]
          : [
              { x: 5, y: 4 },
              { x: 7, y: 4 },
              { x: 7, y: 5 },
            ];
      const made = commitProject(
        history,
        createDrawing(p, p, "new-line", {
          kind: "line",
          lineKind,
          points,
          appearance: preset.values,
          layerId: preset.values.layerId,
        }),
      );
      const line = made.present.storey.lines!.at(-1)!;
      assert.equal(line.id, "new-line");
      assert.deepEqual(line.points, points);
      for (const key of ["color", "penWidth", "style", "layerId"] as const)
        assert.equal(line[key], preset.values[key]);
      assert.equal(made.past.length, 1);
      assert.deepEqual(undoProject(made).present, p);
    }
    preset.values.color = "#ffffff";
    assert.equal(JSON.stringify(p), before);
    assert.equal(history.past.length, 0);
    const hidden = createLayerVisibilityPolicy(p, {
      ...ALL_LAYERS_VISIBLE,
      hiddenLayerIds: [p.defaultLayerIds.wall],
    });
    assert.equal(pickupToolDefaults(p, hidden, { kind: "line", id: "source-line" }), null);
    assert.equal(
      pickupToolDefaults({ ...p }, visibility, { kind: "line", id: "source-line" }),
      null,
    );
    assert.equal(pickupToolDefaults(p, visibility, { kind: "line", id: "missing" }), null);
  }
});
import {
  beginWallChain,
  appendWallChain,
  finishWallChain,
  previewWallChain,
} from "../drawing/wall-chain.ts";
import { updateWall } from "../../lib/bim/model.ts";

test("wall pickup pins owned defaults through prepared preview and whole-chain history", () => {
  let p = createExampleProject();
  p = updateWall(p, p.storey.walls[0]!.id, {
    thickness: 0.42,
    height: 3.1,
    bodyOffset: -0.21,
    layerId: p.defaultLayerIds.line,
  });
  const history = createHistory(p);
  p = history.present;
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    before = JSON.stringify(p);
  const preset = pickupToolDefaults(p, visibility, { kind: "wall", id: p.storey.walls[0]!.id })!;
  assert.equal(preset.tool, "wall");
  if (preset.tool !== "wall") throw new Error("Expected wall");
  assert.deepEqual(
    Object.keys(preset.values).sort(),
    ["thickness", "height", "bodyOffset", "layerId"].sort(),
  );
  let chain = beginWallChain(p, { x: 10, y: 10 }, null, preset.values);
  preset.values.height = 8;
  const first = { x: 14, y: 10 },
    second = { x: 14, y: 14 };
  const preview = previewWallChain(chain, p, first);
  assert.deepEqual(preview, appendWallChain(chain, p, "@wall-preview", first).preview);
  let added = preview.storey.walls.at(-1)!;
  assert.equal(added.height, 3.1);
  assert.equal(added.thickness, 0.42);
  assert.equal(added.bodyOffset, -0.21);
  assert.equal(added.layerId, p.defaultLayerIds.line);
  chain = appendWallChain(chain, p, "wall-new-a", first);
  const cornerPreview = previewWallChain(chain, p, second);
  assert.deepEqual(cornerPreview, appendWallChain(chain, p, "@wall-preview", second).preview);
  added = cornerPreview.storey.walls.at(-1)!;
  assert.equal(added.height, 3.1);
  assert.equal(added.bodyOffset, -0.21);
  chain = appendWallChain(chain, p, "wall-new-b", second);
  const next = commitProject(history, finishWallChain(chain, p));
  for (const id of ["wall-new-a", "wall-new-b"]) {
    const wall = next.present.storey.walls.find((w) => w.id === id)!;
    assert.equal(wall.height, 3.1);
    assert.equal(wall.thickness, 0.42);
    assert.equal(wall.layerId, p.defaultLayerIds.line);
  }
  assert.equal(next.past.length, 1);
  assert.deepEqual(undoProject(next).present, p);
  assert.equal(JSON.stringify(p), before);
  assert.equal(history.past.length, 0);
  const hidden = createLayerVisibilityPolicy(p, {
    ...ALL_LAYERS_VISIBLE,
    hiddenLayerIds: [p.defaultLayerIds.line],
  });
  assert.equal(pickupToolDefaults(p, hidden, { kind: "wall", id: p.storey.walls[0]!.id }), null);
});
