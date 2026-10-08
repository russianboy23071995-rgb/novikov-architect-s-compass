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
    pickupToolDefaults(p, visibility, { kind: "wall", id: p.storey.walls[0]!.id }),
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
