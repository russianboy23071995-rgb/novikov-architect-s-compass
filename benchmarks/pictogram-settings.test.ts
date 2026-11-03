import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PICTOGRAM_SETTINGS,
  parsePictogramSettings,
  pictogramVariables,
} from "../src/components/cad/pictogram-settings.ts";

// docs/WERKZEUGLEISTE.md, WL4: stored pictogram settings are made safe; defaults are the
// package's values with the darker turquoise on light surfaces.
test("pictogram settings: limits, unknown values and the defaults", () => {
  assert.deepEqual(parsePictogramSettings(null), DEFAULT_PICTOGRAM_SETTINGS);
  assert.deepEqual(parsePictogramSettings("x"), DEFAULT_PICTOGRAM_SETTINGS);
  const s = parsePictogramSettings({
    scale: 3,
    activeLight: "#ABCDEF",
    activeDark: "rot",
    line: "#112233",
    duotone: -1,
  });
  assert.equal(s.scale, 1.25);
  assert.equal(s.activeLight, "#abcdef");
  assert.equal(s.activeDark, DEFAULT_PICTOGRAM_SETTINGS.activeDark);
  assert.equal(s.line, "#112233");
  assert.equal(s.duotone, 0);
  assert.equal(parsePictogramSettings({ scale: 0.1 }).scale, 0.75);
  assert.equal(parsePictogramSettings({ scale: Number.NaN }).scale, 1);
  // An invalid own line colour falls back to the text colour.
  assert.equal(parsePictogramSettings({ line: "blau" }).line, null);
  assert.deepEqual(pictogramVariables(DEFAULT_PICTOGRAM_SETTINGS), {
    "--pikto-scale": "1",
    "--pikto-aktiv-hell": "#0e9aa0",
    "--pikto-aktiv-dunkel": "#42d9df",
    "--pikto-linie": null,
    "--pikto-duoton": "0.2",
  });
});
