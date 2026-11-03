import test from "node:test";
import assert from "node:assert/strict";
import {
  canvasModeOf,
  canvasTabLabel,
  canvasViewOf,
  closeCanvasTab,
  existingCanvasTabs,
  layoutTab,
  tabLayoutId,
  sectionTab,
  tabSectionId,
  canvasTabKind,
  titleBlockTab,
  withCanvasTab,
} from "./canvas-tabs.ts";

// docs/SCHNITT.md, SC1.
test("switching to a view opens its tab once and keeps the order", () => {
  assert.deepEqual(withCanvasTab(["plan"], "3d"), ["plan", "3d"]);
  assert.deepEqual(withCanvasTab(["3d", "plan"], "3d"), ["3d", "plan"]);
  assert.equal(canvasViewOf("3D"), "3d");
  assert.equal(canvasModeOf(canvasViewOf("2D")), "2D");
  assert.equal(canvasTabLabel("plan", "EG"), "Grundriss EG");
  assert.equal(canvasTabLabel("3d", "EG"), "3D-Ansicht");
});

test("closing activates the neighbour, the last tab stays", () => {
  assert.deepEqual(closeCanvasTab(["plan", "3d"], "plan", "plan"), { tabs: ["3d"], active: "3d" });
  assert.deepEqual(closeCanvasTab(["plan", "3d"], "3d", "3d"), { tabs: ["plan"], active: "plan" });
  assert.deepEqual(closeCanvasTab(["plan", "3d"], "3d", "plan"), {
    tabs: ["plan"],
    active: "plan",
  });
  assert.deepEqual(closeCanvasTab(["plan"], "plan", "plan"), { tabs: ["plan"], active: "plan" });
});

test("sections open as tabs named after the section; removed sections lose their tab", () => {
  const tabs = withCanvasTab(["plan"], sectionTab("s1"));
  assert.deepEqual(tabs, ["plan", "section:s1"]);
  assert.equal(tabSectionId("section:s1"), "s1");
  assert.equal(tabSectionId("plan"), null);
  assert.equal(
    canvasTabLabel("section:s1", "EG", [{ id: "s1", name: "Schnitt A-A" }]),
    "Schnitt A-A",
  );
  assert.deepEqual(existingCanvasTabs(tabs, new Set()), ["plan"]);
  assert.deepEqual(existingCanvasTabs(tabs, new Set(["s1"])), tabs);
});

test("layouts open as tabs named after the layout; removed layouts lose their tab (LA4)", () => {
  const tabs = withCanvasTab(withCanvasTab(["plan"], sectionTab("s1")), layoutTab("l1"));
  assert.deepEqual(tabs, ["plan", "section:s1", "layout:l1"]);
  assert.equal(tabLayoutId("layout:l1"), "l1");
  assert.equal(tabLayoutId("section:s1"), null);
  assert.equal(
    canvasTabLabel("layout:l1", "EG", [], [{ id: "l1", name: "Grundriss EG" }]),
    "Grundriss EG",
  );
  assert.deepEqual(existingCanvasTabs(tabs, new Set(["s1"])), ["plan", "section:s1"]);
  assert.deepEqual(existingCanvasTabs(tabs, new Set(["s1"]), new Set(["l1"])), tabs);
});

// docs/TABS.md, user decision 03.11.2026: one tab per kind; a view of an open kind replaces its
// content in place.
test("one tab per kind: plans, sections and elevations, 3D, layout book; content changes in place", () => {
  let tabs = withCanvasTab(withCanvasTab(["plan"], sectionTab("s1")), "3d");
  tabs = withCanvasTab(tabs, layoutTab("l1"));
  assert.deepEqual(tabs, ["plan", "section:s1", "3d", "layout:l1"]);
  // Another section or elevation takes the place of the section tab.
  assert.deepEqual(withCanvasTab(tabs, sectionTab("s2")), [
    "plan",
    "section:s2",
    "3d",
    "layout:l1",
  ]);
  // Layouts, master layouts and the Plankopfplaner share the layout book's tab.
  assert.deepEqual(withCanvasTab(tabs, titleBlockTab("b1")), [
    "plan",
    "section:s1",
    "3d",
    "titleblock:b1",
  ]);
  assert.deepEqual(withCanvasTab(tabs, "plan"), tabs);
  assert.deepEqual(
    ["plan", "3d", "section:x", "layout:y", "titleblock:z"].map((v) =>
      canvasTabKind(v as Parameters<typeof canvasTabKind>[0]),
    ),
    ["plan", "3d", "section", "layout", "layout"],
  );
  // States with several tabs of a kind (from before) keep only the first, now with the new view.
  assert.deepEqual(withCanvasTab(["plan", "section:a", "section:b"], sectionTab("c")), [
    "plan",
    "section:c",
  ]);
});
