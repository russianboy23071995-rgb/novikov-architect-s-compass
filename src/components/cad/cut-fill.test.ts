import assert from "node:assert/strict";
import test from "node:test";
import { cutPaint, defaultCutFill, parseCutFill } from "./cut-fill.ts";

test("grey keeps the earlier plan look", () => {
  assert.deepEqual(cutPaint(defaultCutFill), {
    fill: "var(--muted-foreground)",
    fillOpacity: 0.55,
  });
});

test("black, white and an own colour are opaque", () => {
  assert.deepEqual(cutPaint({ mode: "black", color: "#123456" }), {
    fill: "#000000",
    fillOpacity: 1,
  });
  assert.deepEqual(cutPaint({ mode: "white", color: "#123456" }), {
    fill: "#ffffff",
    fillOpacity: 1,
  });
  assert.deepEqual(cutPaint({ mode: "custom", color: "#123456" }), {
    fill: "#123456",
    fillOpacity: 1,
  });
});

test("stored values are checked", () => {
  assert.deepEqual(parseCutFill({ mode: "black", color: "#abcdef" }), {
    mode: "black",
    color: "#abcdef",
  });
  assert.deepEqual(parseCutFill({ mode: "custom", color: "red" }), {
    mode: "custom",
    color: defaultCutFill.color,
  });
  assert.deepEqual(parseCutFill({ mode: "purple" }), defaultCutFill);
  assert.deepEqual(parseCutFill(null), defaultCutFill);
  assert.deepEqual(parseCutFill("grey"), defaultCutFill);
});
