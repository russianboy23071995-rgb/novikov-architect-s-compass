import test from "node:test";
import assert from "node:assert/strict";
import {
  canvasModeOf,
  canvasTabLabel,
  canvasViewOf,
  closeCanvasTab,
  existingCanvasTabs,
  sectionTab,
  tabSectionId,
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
