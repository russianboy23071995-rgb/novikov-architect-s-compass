import test from "node:test";
import assert from "node:assert/strict";
import { clampNavigatorWidth, NAVIGATOR_WIDTH, paletteInsets } from "./palette-layout.ts";

// docs/GLAS_PALETTEN.md
test("palettes cover the top, the rail on the left and the navigator on the right", () => {
  assert.deepEqual(
    paletteInsets({ rail: true, railCollapsed: false, navigator: true, navigatorWidth: 320 }),
    { left: 92, top: 146, right: 336, bottom: 0 },
  );
  assert.deepEqual(
    paletteInsets({ rail: true, railCollapsed: true, navigator: false, navigatorWidth: 320 }),
    { left: 64, top: 146, right: 0, bottom: 0 },
  );
  assert.deepEqual(
    paletteInsets({ rail: false, railCollapsed: false, navigator: false, navigatorWidth: 320 }),
    { left: 0, top: 146, right: 0, bottom: 0 },
  );
});

test("navigator width stays within its limits", () => {
  assert.equal(clampNavigatorWidth(100), NAVIGATOR_WIDTH.min);
  assert.equal(clampNavigatorWidth(9999), NAVIGATOR_WIDTH.max);
  assert.equal(clampNavigatorWidth(333.6), 334);
  assert.equal(clampNavigatorWidth(Number.NaN), NAVIGATOR_WIDTH.initial);
});
