import { test } from "node:test";
import assert from "node:assert/strict";
import { loadHatchPatterns, saveHatchPattern, validateHatchLibrary } from "./pattern-library.ts";
import type { HatchPatternStorage } from "./pattern-library.ts";
const pattern = {
  id: "diagonal",
  name: "Diagonale",
  width: 1,
  height: 1,
  lines: [{ start: { x: 0, y: 0 }, end: { x: 1, y: 1 } }],
};
function memory(initial: string | null = null) {
  let raw = initial;
  return {
    read: () => raw,
    write: (value: string) => {
      raw = value;
    },
  };
}
test("global hatch library survives a fresh storage consumer and owns coordinates", () => {
  const store = memory();
  assert.deepEqual(loadHatchPatterns(store), []);
  const source = structuredClone(pattern);
  const saved = saveHatchPattern(store, source);
  source.lines[0]!.end.x = 0.2;
  saved[0]!.lines[0]!.end.x = 0.3;
  assert.deepEqual(loadHatchPatterns(memory(store.read())), [pattern]);
});
test("saving reads the latest library and preserves other project additions", () => {
  const store = memory();
  saveHatchPattern(store, pattern);
  saveHatchPattern(store, { ...pattern, id: "other", name: "Anderes Projekt" });
  assert.equal(loadHatchPatterns(store).length, 2);
  const before = store.read();
  assert.throws(() => saveHatchPattern(store, pattern));
  assert.equal(store.read(), before);
});
test("invalid definitions and limits cannot alter stored data", () => {
  const store = memory();
  saveHatchPattern(store, pattern);
  const before = store.read();
  for (const invalid of [
    { ...pattern, id: "" },
    { ...pattern, id: "new", name: " " },
    { ...pattern, id: "new", width: Infinity },
    { ...pattern, id: "new", lines: [] },
    { ...pattern, id: "new", lines: [{ start: { x: 0, y: 0 }, end: { x: 2, y: 1 } }] },
  ]) {
    assert.throws(() => saveHatchPattern(store, invalid));
    assert.equal(store.read(), before);
  }
  assert.throws(() =>
    validateHatchLibrary(Array.from({ length: 101 }, (_, i) => ({ ...pattern, id: String(i) }))),
  );
});
test("corrupt and unknown storage is reported without overwriting", () => {
  for (const raw of [
    "broken",
    JSON.stringify({ version: 2, patterns: [] }),
    JSON.stringify({ version: 1, patterns: [null] }),
    "x".repeat(2_000_001),
  ]) {
    const store = memory(raw);
    assert.throws(() => loadHatchPatterns(store));
    assert.throws(() => saveHatchPattern(store, pattern));
    assert.equal(store.read(), raw);
  }
});
test("storage read and write failures propagate; saved data stays intact", () => {
  const store = memory();
  saveHatchPattern(store, pattern);
  const before = store.read();
  const full: HatchPatternStorage = {
    read: store.read,
    write: () => {
      throw new Error("quota");
    },
  };
  assert.throws(() => saveHatchPattern(full, { ...pattern, id: "new" }), /quota/);
  assert.equal(store.read(), before);
  assert.throws(
    () =>
      loadHatchPatterns({
        read: () => {
          throw new Error("denied");
        },
        write: () => {},
      }),
    /denied/,
  );
});
