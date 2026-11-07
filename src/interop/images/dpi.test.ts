import test from "node:test";
import assert from "node:assert/strict";
import { imageDpi, metresPerPixelAtScale } from "./dpi.ts";

// docs/BILDUNTERLAGE.md, B1: the resolution a scan states for itself.
const be = (v: number, n: number) =>
  Array.from({ length: n }, (_, k) => (v >>> (8 * (n - 1 - k))) & 255);
const chunk = (type: string, data: number[]) => [
  ...be(data.length, 4),
  ...[...type].map((c) => c.charCodeAt(0)),
  ...data,
  0,
  0,
  0,
  0,
];
const png = (...chunks: number[][]) =>
  new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, ...chunks.flat()]);
const ihdr = chunk("IHDR", [...be(10, 4), ...be(10, 4), 8, 6, 0, 0, 0]);
const jpeg = (units: number, x: number, y: number) =>
  new Uint8Array([
    255,
    216,
    255,
    224,
    ...be(16, 2),
    ...[..."JFIF"].map((c) => c.charCodeAt(0)),
    0,
    1,
    1,
    units,
    ...be(x, 2),
    ...be(y, 2),
    0,
    0,
    255,
    218,
  ]);

test("dpi: PNG pHYs in pixels per metre", () => {
  // 300 dpi = 11811 pixels per metre.
  assert.equal(imageDpi(png(ihdr, chunk("pHYs", [...be(11811, 4), ...be(11811, 4), 1]))), 300);
  assert.equal(imageDpi(png(ihdr, chunk("pHYs", [...be(11811, 4), ...be(11811, 4), 0]))), null);
  assert.equal(imageDpi(png(ihdr, chunk("IDAT", [1, 2]))), null);
  // Different horizontal and vertical resolution: no single scale.
  assert.equal(imageDpi(png(ihdr, chunk("pHYs", [...be(11811, 4), ...be(5905, 4), 1]))), null);
});

test("dpi: JPEG JFIF density in inch or centimetre", () => {
  assert.equal(imageDpi(jpeg(1, 600, 600)), 600);
  assert.equal(imageDpi(jpeg(2, 118, 118)), 299.72);
  assert.equal(imageDpi(jpeg(0, 1, 1)), null);
  assert.equal(imageDpi(jpeg(1, 1, 1)), null);
  assert.equal(imageDpi(new Uint8Array([1, 2, 3])), null);
});

test("dpi: 1:100 at 300 dpi is 8.47 mm per pixel", () => {
  assert.ok(Math.abs(metresPerPixelAtScale(100, 300) - 0.0084667) < 1e-6);
  // An A3 scan of 1:100 (420 mm, 4961 px at 300 dpi) is 42 m wide.
  assert.ok(Math.abs(4961 * metresPerPixelAtScale(100, 300) - 42.0) < 0.01);
});
