import test from "node:test";
import assert from "node:assert/strict";
import { imageHeader, sourceImageHeader, storedScale } from "./import.ts";
import {
  underlayMetresPerPixel,
  UNDERLAY_DEFAULTS,
} from "../../application/references/underlay-size.ts";

// docs/BILDUNTERLAGE.md, B5: a large scan is fitted, not refused.
const png = (width: number, height: number) => {
  const b = new Uint8Array(24);
  b.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const v = new DataView(b.buffer);
  v.setUint32(16, width);
  v.setUint32(20, height);
  return b;
};

test("fit: a 60-megapixel scan is read as a source, not as a stored asset", () => {
  const scan = png(9922, 7016); // A1 at 300 dpi.
  assert.throws(() => imageHeader(scan));
  assert.deepEqual(sourceImageHeader(scan), { width: 9922, height: 7016, mimeType: "image/png" });
  assert.throws(() => sourceImageHeader(png(20000, 10000)), /150 Millionen/);
  assert.throws(() => sourceImageHeader(png(70000, 10)));
});

test("fit: the stored raster stays within 16 million pixels and 16384 px a side", () => {
  assert.equal(storedScale(4000, 3000), 1);
  const s = storedScale(9922, 7016);
  assert.ok(9922 * s * 7016 * s <= 16_000_000 + 1);
  assert.ok(Math.abs(9922 * s * 7016 * s - 16_000_000) < 1);
  assert.equal(storedScale(30000, 100), 16384 / 30000);
});

test("fit: a fitted scan keeps its scale from plan scale and dpi", () => {
  const defaults = { ...UNDERLAY_DEFAULTS, size: "scale" as const, denominator: "100", dpi: "300" };
  // 9922 px at 300 dpi is 840 mm, 84 m at 1:100; stored at half size it stays 84 m wide.
  const full = 9922 * underlayMetresPerPixel(defaults, 9922);
  const half = 4961 * underlayMetresPerPixel(defaults, 4961, 0.5);
  assert.ok(Math.abs(full - 84.0) < 0.01);
  assert.ok(Math.abs(half - full) < 1e-9);
  // A width in metres needs no correction.
  const width = { ...UNDERLAY_DEFAULTS, width: "12" };
  assert.ok(Math.abs(4961 * underlayMetresPerPixel(width, 4961, 0.5) - 12) < 1e-9);
});
