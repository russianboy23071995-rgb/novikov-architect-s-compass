import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { createDrawing } from "../drawing/actions.ts";
import { createEditingState } from "../direct-edit/controller.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { workingPlanScale } from "../../domain/views/scale.ts";
import { changeTitleBlocks } from "./title-blocks.ts";
import {
  spaceEditingReducer,
  titleBlockLens,
  type SpaceEditingState,
} from "./title-block-space.ts";

// docs/PLANKOPF.md, PK2.
const frame = {
  kind: "line" as const,
  lineKind: "polyline" as const,
  points: [
    { x: -0.18, y: 0 },
    { x: 0, y: 0 },
    { x: 0, y: 0.06 },
  ],
  appearance: defaultLineAppearance,
};
function setup() {
  const p = createStandardProject("p", "eg", "og");
  const real = changeTitleBlocks(p, p, { kind: "create", id: "tb1", name: "Plankopf" });
  return spaceEditingReducer(createEditingState(real), {
    type: "space",
    space: { kind: "title-block", id: "tb1" },
  });
}

test("the lens shows only the title block sheet at 1:1 and stays the same object", () => {
  const state = setup();
  const real = state.history.present;
  const lens = titleBlockLens(real, "tb1");
  assert.equal(titleBlockLens(real, "tb1"), lens);
  assert.deepEqual(
    lens.storeys.map((s) => s.id),
    ["tb1"],
  );
  assert.equal(storeyOf(lens).id, "tb1");
  assert.equal(lens.workingViews![0]!.denominator, 1);
  assert.equal(
    workingPlanScale(lens.id, "tb1", lens.workingViews?.[0]?.denominator).denominator,
    1,
  );
  assert.equal(lens.titleBlocks, undefined);
});

test("a tool change in the space lands in the title block, the building stays, undo reverts", () => {
  let state = setup();
  const real = state.history.present;
  const lens = titleBlockLens(real, "tb1");
  state = spaceEditingReducer(state, {
    type: "project",
    project: createDrawing(lens, lens, "frame", frame),
  });
  const drawn = state.history.present;
  assert.equal(state.error, "");
  assert.equal(drawn.titleBlocks![0]!.storey.lines!.length, 1);
  assert.deepEqual(
    drawn.storeys.map((s) => [s.id, s.lines?.length ?? 0]),
    [
      ["eg", 0],
      ["og", 0],
    ],
  );
  assert.equal(drawn.workingViews, real.workingViews, "the building's scale is untouched");
  // The new lens sees the line; a stale base is refused like in the plan.
  assert.equal(storeyOf(titleBlockLens(drawn, "tb1")).lines!.length, 1);
  state = spaceEditingReducer(state, { type: "undo" });
  assert.equal(state.history.present.titleBlocks![0]!.storey.lines, undefined);
  assert.equal(state.space?.id, "tb1");
  // Leaving the space: the plan works on the building again.
  state = spaceEditingReducer(state, { type: "space", space: null });
  assert.equal(state.space, undefined);
});

test("deleting the title block (e.g. by undo of its creation) closes the space", () => {
  const p = createStandardProject("p", "eg", "og");
  let state: SpaceEditingState = createEditingState(p);
  state = spaceEditingReducer(state, {
    type: "project",
    project: changeTitleBlocks(p, p, { kind: "create", id: "tb1", name: "Plankopf" }),
  });
  state = spaceEditingReducer(state, { type: "space", space: { kind: "title-block", id: "tb1" } });
  state = spaceEditingReducer(state, { type: "undo" });
  assert.equal(state.space, undefined);
  assert.throws(() =>
    spaceEditingReducer(state, { type: "space", space: { kind: "title-block", id: "tb1" } }),
  );
});
