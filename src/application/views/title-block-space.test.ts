import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { createDrawing } from "../drawing/actions.ts";
import { createEditingState } from "../direct-edit/controller.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { workingPlanScale } from "../../domain/views/scale.ts";
import { validateProject } from "../../domain/project/schema.ts";
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

// docs/LAYOUTS.md, LZ1: layouts and master layouts are drawing spaces as well.
test("drawing on a layout and its master: own sheets, written back, removed with the layout", async () => {
  const { changeLayouts } = await import("./layouts.ts");
  const { DEFAULT_MASTER_ID, LAYOUT_COLLECTION_ID } = await import("../../domain/views/layouts.ts");
  const { spaceLens, layoutSheetId } = await import("./title-block-space.ts");
  const p = createStandardProject("p", "eg", "og");
  const real = changeLayouts(p, p, {
    kind: "create-layout",
    id: "l1",
    name: "Grundriss EG",
    folderId: LAYOUT_COLLECTION_ID,
    masterId: DEFAULT_MASTER_ID,
  });
  let state: SpaceEditingState = spaceEditingReducer(createEditingState(real), {
    type: "space",
    space: { kind: "layout", id: "l1" },
  });
  const lens = spaceLens(real, { kind: "layout", id: "l1" });
  assert.equal(storeyOf(lens).id, layoutSheetId("l1"));
  state = spaceEditingReducer(state, {
    type: "project",
    project: createDrawing(lens, lens, "note", frame),
  });
  assert.equal(state.error, "");
  const drawn = state.history.present;
  assert.deepEqual(
    drawn.layoutDrawings!.map((d) => [d.layoutId, d.storey.lines!.length]),
    [["l1", 1]],
  );
  assert.ok(
    drawn.storeys.every((s) => !s.lines?.length),
    "the building stays untouched",
  );
  // The master layout has its own sheet.
  state = spaceEditingReducer(state, {
    type: "space",
    space: { kind: "layout", id: DEFAULT_MASTER_ID },
  });
  const masterLens = spaceLens(state.history.present, { kind: "layout", id: DEFAULT_MASTER_ID });
  assert.equal(storeyOf(masterLens).lines, undefined);
  state = spaceEditingReducer(state, {
    type: "project",
    project: createDrawing(masterLens, masterLens, "head", frame),
  });
  assert.equal(state.history.present.layoutDrawings!.length, 2);
  // Undo removes the master's line; an empty sheet leaves no drawing behind.
  state = spaceEditingReducer(state, { type: "undo" });
  assert.equal(state.history.present.layoutDrawings!.length, 1);
  // Deleting the layout takes its drawing along and closes nothing else.
  const now = state.history.present;
  const deleted = changeLayouts(now, now, { kind: "delete-layout", id: "l1" });
  assert.equal(deleted.layoutDrawings, undefined);
  // No dimension chains on a layout sheet.
  const raw = structuredClone(drawn);
  raw.layoutDrawings![0]!.storey.dimensions = [{} as never];
  assert.throws(() => validateProject(raw));
});
