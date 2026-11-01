import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_TOOL_LAYOUT, moveTool, normalizeToolLayout, stepTool } from "./tool-layout.ts";

// docs/WERKZEUGLEISTE.md, WL1.
test("default groups: 3D, 2D and documentation tools; select is not part of them", () => {
  assert.deepEqual(DEFAULT_TOOL_LAYOUT, {
    "3d": ["wall", "column", "stair", "window", "door", "slab", "roof", "room"],
    "2d": ["line", "hatch", "text"],
    doc: ["dimension", "section", "elevation"],
  });
  assert.deepEqual(normalizeToolLayout(null), DEFAULT_TOOL_LAYOUT);
});

test("tools move within a group and between groups; an emptied group stays", () => {
  let l = moveTool(DEFAULT_TOOL_LAYOUT, "door", "3d", 0);
  assert.deepEqual(l["3d"].slice(0, 3), ["door", "wall", "column"]);
  l = moveTool(l, "wall", "3d", 3);
  assert.deepEqual(l["3d"].slice(0, 4), ["door", "column", "wall", "stair"]);
  l = moveTool(l, "section", "3d", 1);
  assert.deepEqual(l["3d"].slice(0, 2), ["door", "section"]);
  l = moveTool(l, "dimension", "2d", 0);
  assert.deepEqual(l.doc, ["elevation"]);
  assert.deepEqual(l["2d"], ["dimension", "line", "hatch", "text"]);
  // Keyboard: up/down within the group, left/right to the neighbouring group's end.
  assert.deepEqual(stepTool(l, "text", "up")["2d"], ["dimension", "line", "text", "hatch"]);
  assert.deepEqual(stepTool(l, "dimension", "up"), l);
  assert.deepEqual(stepTool(l, "line", "down")["2d"], ["dimension", "hatch", "line", "text"]);
  assert.deepEqual(stepTool(l, "line", "right").doc, ["elevation", "line"]);
  assert.deepEqual(stepTool(l, "door", "left"), l);
});

test("stored layouts are made safe: unknown and repeated tools dropped, new tools added", () => {
  const stored = JSON.parse(
    JSON.stringify({
      "3d": ["wall", "wall", "nonsense", "select", 3],
      "2d": ["section", "line"],
      extra: ["door"],
    }),
  );
  const l = normalizeToolLayout(stored);
  assert.deepEqual(l["2d"].slice(0, 2), ["section", "line"]);
  assert.equal(l["3d"][0], "wall");
  // Every rail tool exactly once; missing ones return to their default group.
  const all = [...l["3d"], ...l["2d"], ...l.doc];
  assert.equal(all.length, new Set(all).size);
  assert.equal(all.length, 14);
  assert.ok(l["3d"].includes("door"));
  assert.ok(l.doc.includes("dimension"));
  assert.ok(!all.includes("select" as never));
});
