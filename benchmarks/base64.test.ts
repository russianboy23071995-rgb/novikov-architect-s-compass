import test from "node:test";
import assert from "node:assert/strict";
import { isCanonicalBase64 } from "../src/domain/elements/reference/base64.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { previousCanonicalBase64 } from "./base64-baseline.ts";
const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function compare(value: string) {
  assert.equal(
    isCanonicalBase64(value),
    previousCanonicalBase64(value),
    value.length < 50 ? JSON.stringify(value) : `length ${value.length}`,
  );
}
test("base64 exhaustively matches padded end groups and independent decoder roundtrips", () => {
  for (const a of alphabet)
    for (const b of alphabet) {
      for (const value of [a + b + "==", ...Array.from(alphabet, (c) => a + b + c + "=")]) {
        compare(value);
        assert.equal(
          isCanonicalBase64(value),
          Buffer.from(value, "base64").toString("base64") === value,
        );
      }
    }
});
test("base64 rejects invalid UTF-16 characters and padding in every quartet position", () => {
  for (let code = 0; code <= 65535; code++) {
    const c = String.fromCharCode(code);
    for (let pos = 0; pos < 4; pos++) compare("AAAA".slice(0, pos) + c + "AAAA".slice(pos + 1));
  }
  for (const value of [
    "",
    "A",
    "AA",
    "AAA",
    "AAAAA",
    "====",
    "A===",
    "AA=A",
    "AA==AAAA",
    "AAAA\n",
    "AAAA\r\n",
    "AB==",
    "AAB=",
    "AA-_",
    "😀AA",
  ])
    compare(value);
});
test("base64 deterministic randomized valid and mutated inputs match the previous contract", () => {
  let seed = 4711;
  const next = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0);
  for (let n = 0; n < 3000; n++) {
    const bytes = Uint8Array.from({ length: 1 + (next() % 1024) }, () => next() >>> 24);
    const value = Buffer.from(bytes).toString("base64");
    assert.equal(isCanonicalBase64(value), true);
    compare(value);
    const pos = next() % value.length;
    compare(value.slice(0, pos) + String.fromCharCode(next() % 65536) + value.slice(pos + 1));
    compare(value.slice(0, -1));
  }
});
test("base64 large inputs preserve validation at start, middle and end", () => {
  for (const length of [1024, 1024 * 1024, 10 * 1024 * 1024]) {
    const value = alphabet.repeat(Math.ceil(length / 64)).slice(0, length);
    assert.equal(isCanonicalBase64(value), true);
    compare(value);
    for (const pos of [0, length / 2, length - 1])
      compare(value.slice(0, pos) + "!" + value.slice(pos + 1));
  }
});
test("storage boundary retains byte, metadata and pixel limits and copies caller data", () => {
  const asset = { id: "image", mimeType: "image/png", pixelWidth: 1, pixelHeight: 1, data: "AAAA" };
  const result = createImageAssetHandle(asset);
  assert.notEqual(result, asset);
  assert.ok(Object.isFrozen(result));
  for (const change of [
    { data: "AB==" },
    { data: "A".repeat(10 * 1024 * 1024 + 4) },
    { pixelWidth: 0 },
    { pixelWidth: 16385 },
    { pixelWidth: 4001, pixelHeight: 4000 },
    { mimeType: "image/svg+xml" },
    { trusted: true },
  ]) {
    assert.throws(() => createImageAssetHandle({ ...asset, ...change }));
  }
});
