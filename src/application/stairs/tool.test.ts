import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addStair, updateStair } from "./actions.ts";
import { stairSettings, stairToolDefaults, stairValues } from "./defaults.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  stairFrame,
  stairGeometry,
  stairOutline,
  stairPlan,
} from "../../domain/elements/stair/model.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";

// docs/TREPPE.md, TR2.
const close = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  assert.ok(Math.hypot(a.x - b.x, a.y - b.y) < 1e-9, `${JSON.stringify(a)} ≠ ${JSON.stringify(b)}`);

test("the drawing axis is the centre, left or right edge looking up the flight", () => {
  const base = { start: { x: 0, y: 0 }, direction: 0, width: 1.2 };
  // Running along +x, left is +y.
  close(stairFrame({ ...base, axis: "center" }).origin, { x: 0, y: 0 });
  close(stairFrame({ ...base, axis: "left" }).origin, { x: 0, y: -0.6 });
  close(stairFrame({ ...base, axis: "right" }).origin, { x: 0, y: 0.6 });
  // Left axis: the flight lies right of the clicked line, its left edge on it.
  const outline = stairOutline({ ...base, axis: "left" }, 3);
  assert.ok(outline.every((p) => p.y <= 1e-9 && p.y >= -1.2 - 1e-9));
  assert.ok(outline.some((p) => Math.abs(p.y) < 1e-9));
});

test("the plan has one line per riser, a walking line and the 1 m cut", () => {
  const stair = { start: { x: 0, y: 0 }, direction: 90, width: 1, axis: "center" as const };
  const g = { riserCount: 16, riser: 0.175, tread: 0.28, run: 15 * 0.28 };
  const plan = stairPlan(stair, g);
  assert.equal(plan.risers.length, 16);
  // Step 5 tops at 0.875 m, step 6 at 1.05 m: the cut lies within step 5's tread.
  const cut = plan.risers.findIndex((r) => r.above);
  assert.equal(cut, 5);
  assert.ok(plan.cut);
  assert.ok(plan.walk.above);
  close(plan.walk.below.start, { x: 0, y: 0.14 });
  close(plan.walk.above!.end, { x: 0, y: 4.2 });
  // A flight lower than the cut is drawn fully below it.
  const low = stairPlan(stair, { riserCount: 4, riser: 0.175, tread: 0.28, run: 0.84 });
  assert.equal(low.cut, null);
  assert.equal(low.walk.above, null);
  assert.ok(low.risers.every((r) => !r.above));
});

test("tool settings store fixed values only when fixed and round-trip through the element", () => {
  const p = createStandardProject("p", "eg", "og");
  const auto = stairValues(stairToolDefaults("treppe"));
  assert.equal("riserCount" in auto, false);
  assert.equal("tread" in auto, false);
  assert.deepEqual(auto.topBinding, { kind: "storey", topOffset: 0 });
  const fixed = stairValues({
    ...stairToolDefaults("treppe"),
    axis: "left",
    riserCountMode: "fixed",
    riserCount: 15.4,
    treadMode: "fixed",
    tread: 0.27,
    heightMode: "fixed",
    height: 2.75,
  });
  assert.equal(fixed.riserCount, 15);
  assert.equal(fixed.tread, 0.27);
  assert.equal(fixed.height, 2.75);
  assert.equal(fixed.topBinding, undefined);
  const q = addStair(p, {
    id: "t",
    start: { x: 1, y: 1 },
    direction: 45,
    ...stairValues(stairToolDefaults(p.layers[0]!.id)),
  });
  const t = storeyOf(q).stairs![0]!;
  assert.deepEqual(stairValues(stairSettings(t)), stairValues(stairToolDefaults(t.layerId)));
  // Properties edit back to auto: explicit undefined removes the fixed values.
  const r = updateStair(q, "t", { riserCount: 14, tread: 0.3 });
  const s = updateStair(r, "t", {
    riserCount: undefined,
    tread: undefined,
    ...stairValues(stairSettings(t)),
  });
  assert.equal(storeyOf(s).stairs![0]!.riserCount, undefined);
  assert.equal(storeyOf(s).stairs![0]!.tread, undefined);
});

test("a stair is drawn in the plan, picked up as tool settings and moved with its start", () => {
  const p = addStair(createStandardProject("p", "eg", "og"), {
    id: "t",
    start: { x: 2, y: 3 },
    direction: 0,
    axis: "right",
  });
  const scene = derivePlanScene(p, () => true);
  assert.equal(scene.stairs.size, 1);
  const g = stairGeometry(storeyOf(p).stairs![0]!, storeyOf(p).height ?? null)!;
  assert.equal(scene.stairViews.get("t")!.risers.length, g.riserCount);
  assert.ok(planSceneRuns(scene, []).some((r) => r.kind === "stair" && r.ids[0] === "t"));
  const picked = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "stair",
    id: "t",
  });
  assert.equal(picked?.tool, "stair");
  assert.equal(picked?.tool === "stair" && picked.values.axis, "right");
  const moved = prepareTranslation(p, ["t"]).materialize(p, { x: 1, y: -1 });
  close(storeyOf(moved).stairs![0]!.start, { x: 3, y: 2 });
});
