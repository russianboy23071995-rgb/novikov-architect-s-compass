import test from "node:test";
import assert from "node:assert/strict";
import { hexToHsv, hslToHex, luminance } from "./color.ts";
import {
  OWN_COLORS,
  parseColorList,
  RECENT_COLORS,
  STANDARD_PALETTE,
  withOwn,
  withRecent,
} from "./palette.ts";

// docs/FARBEN.md, F1.
test("palette: nine rows of six, black to white first, every row lighter step by step", () => {
  assert.equal(STANDARD_PALETTE.length, 9);
  assert.deepEqual(
    STANDARD_PALETTE.map((r) => r.name),
    ["Schwarz bis Weiß", "Rot", "Orange", "Gelb", "Grün", "Türkis", "Blau", "Violett", "Braun"],
  );
  for (const row of STANDARD_PALETTE) {
    assert.equal(row.colors.length, 6, row.name);
    const light = row.colors.map((c) => luminance(c.hex));
    for (let i = 1; i < light.length; i++) assert.ok(light[i]! > light[i - 1]!, row.name);
    for (const c of row.colors) assert.match(c.hex, /^#[0-9a-f]{6}$/);
  }
  const greys = STANDARD_PALETTE[0]!.colors;
  assert.equal(greys[0]!.hex, "#000000");
  assert.equal(greys[5]!.hex, "#ffffff");
  const all = STANDARD_PALETTE.flatMap((r) => r.colors.map((c) => c.hex));
  assert.equal(new Set(all).size, all.length);
});

test("palette: a coloured row keeps its hue, its third tone is the full colour", () => {
  for (const row of STANDARD_PALETTE.slice(1)) {
    const hues = row.colors.slice(0, 5).map((c) => hexToHsv(c.hex).h);
    for (const h of hues) {
      const d = Math.abs(h - hues[2]!);
      assert.ok(Math.min(d, 360 - d) < 4, `${row.name}: ${hues.join(", ")}`);
    }
    assert.ok(hexToHsv(row.colors[2]!.hex).s > 0.6, row.name);
  }
  assert.equal(hslToHex(0, 1, 0.5), "#ff0000");
  assert.equal(hslToHex(120, 1, 0.25), "#008000");
});

test("recent and own colours: newest first, no repeats, bounded, stored lists checked", () => {
  let recent: string[] = [];
  for (const c of ["#111111", "#222222", "#111111"]) recent = withRecent(recent, c);
  assert.deepEqual(recent, ["#111111", "#222222"]);
  for (let i = 0; i < 20; i++) recent = withRecent(recent, `#0000${String(i).padStart(2, "0")}`);
  assert.equal(recent.length, RECENT_COLORS);
  let own: string[] = [];
  own = withOwn(own, "#ABCDEF");
  own = withOwn(own, "#abcdef");
  assert.deepEqual(own, ["#abcdef"]);
  for (let i = 0; i < 30; i++) own = withOwn(own, `#0000${String(i).padStart(2, "0")}`);
  assert.equal(own.length, OWN_COLORS);
  assert.deepEqual(parseColorList(["#ABCDEF", "rot", 3, "#abcdef", "#123456"], 8), [
    "#abcdef",
    "#123456",
  ]);
  assert.deepEqual(parseColorList(null, 8), []);
});
