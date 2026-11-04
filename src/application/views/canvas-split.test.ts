import test from "node:test";
import assert from "node:assert/strict";
import {
  clampSplitRatio,
  keptSplit,
  openSplit,
  shownSplit,
  splitFieldRect,
  splitFieldTab,
  splitPartner,
  SPLIT_RATIO,
} from "./canvas-split.ts";
import { layoutTab, sectionTab, type CanvasView } from "./canvas-tabs.ts";

// docs/SPLITSCREEN.md, Stufe 1.
const A = sectionTab("A");
const tabs: CanvasView[] = ["plan", A, "3d", layoutTab("L")];

test("a tab opens beside the active tab of another kind", () => {
  assert.deepEqual(openSplit(tabs, A, "plan", "row"), {
    kinds: ["plan", "section"],
    direction: "row",
    ratio: SPLIT_RATIO.initial,
  });
  assert.deepEqual(openSplit(tabs, "3d", A, "column")?.kinds, ["section", "3d"]);
});

test("the active tab itself pairs with the first other tab; the layout book never splits", () => {
  assert.equal(splitPartner(tabs, "plan", "plan"), A);
  assert.equal(splitPartner(tabs, layoutTab("L"), "plan"), null);
  // The layout book as the active tab is no partner; the first fitting tab is.
  assert.equal(splitPartner(tabs, "3d", layoutTab("L")), "plan");
  assert.equal(openSplit(["plan"], "plan", "plan", "row"), null);
});

test("the split shows only while its kinds are open and one of them is active", () => {
  const split = openSplit(tabs, A, "plan", "row")!;
  assert.equal(shownSplit(split, tabs, "plan"), split);
  assert.equal(shownSplit(split, tabs, sectionTab("B")), split);
  // The layout book or 3D shows alone; the split comes back with its kinds.
  assert.equal(shownSplit(split, tabs, layoutTab("L")), null);
  assert.equal(shownSplit(split, tabs, "3d"), null);
  // A closed kind drops it.
  assert.equal(shownSplit(split, ["plan", "3d"], "plan"), null);
  assert.equal(keptSplit(split, ["plan", "3d"]), null);
  assert.equal(keptSplit(split, tabs), split);
  assert.equal(shownSplit(null, tabs, "plan"), null);
});

test("fields follow direction and ratio; the ratio stays within its range", () => {
  const split = { ...openSplit(tabs, A, "plan", "row")!, ratio: 0.3 };
  assert.deepEqual(splitFieldRect(split, 0), {
    left: "0.000%",
    top: "0%",
    width: "30.000%",
    height: "100%",
  });
  assert.deepEqual(splitFieldRect(split, 1), {
    left: "30.000%",
    top: "0%",
    width: "70.000%",
    height: "100%",
  });
  assert.deepEqual(splitFieldRect({ ...split, direction: "column" }, 1), {
    left: "0%",
    top: "30.000%",
    width: "100%",
    height: "70.000%",
  });
  assert.equal(clampSplitRatio(0.05), SPLIT_RATIO.min);
  assert.equal(clampSplitRatio(0.95), SPLIT_RATIO.max);
  assert.equal(clampSplitRatio(Number.NaN), SPLIT_RATIO.initial);
  assert.equal(splitFieldTab(tabs, "section"), A);
  assert.equal(splitFieldTab(["plan"], "section"), null);
});
