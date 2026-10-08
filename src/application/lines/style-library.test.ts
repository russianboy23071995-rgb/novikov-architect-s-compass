import { test } from "node:test";
import assert from "node:assert/strict";
import {
  saveLineStyle,
  loadLineStyles,
  deleteLineStyle,
  validateLineStyle,
  builtInLineStyles,
  saveLineInventory,
  loadLineInventory,
  validateLineInventory,
} from "./style-library.ts";
const style = { id: "custom-1", name: "Meine Linie", dashes: [8, 3] };
test("line style reload, stable ID edit and deletion", () => {
  let raw: string | null = null;
  const storage = {
    read: () => raw,
    write: (value: string) => {
      raw = value;
    },
  };
  const created = saveLineStyle(storage, [], style);
  assert.deepEqual(loadLineStyles(storage), created);
  const edited = saveLineStyle(storage, created, { ...style, name: "Neu", dashes: [4, 2] });
  assert.equal(edited.length, 1);
  assert.equal(edited[0]!.id, style.id);
  assert.deepEqual(deleteLineStyle(storage, edited, style.id), []);
});
test("invalid patterns rejected", () => {
  for (const dashes of [[], [1], [1, -1], [1, NaN], [0, 2], [1001, 2]])
    assert.throws(() => validateLineStyle({ ...style, dashes }));

  assert.throws(() => validateLineStyle({ ...style, name: " " }));
  assert.throws(() => deleteLineStyle({ read: () => null, write: () => {} }, [], "solid"));
});
test("corrupt storage rejected without overwrite", () => {
  for (const raw of [
    "{",
    "null",
    JSON.stringify({ version: 3, styles: [] }),
    JSON.stringify({ version: 1, styles: [style, style] }),
  ])
    assert.throws(() =>
      loadLineStyles({
        read: () => raw,
        write: () => {
          assert.fail();
        },
      }),
    );
});
test("failed write and external mutation retain existing library", () => {
  const source = { ...style, dashes: [8, 3] };
  const next = saveLineStyle({ read: () => null, write: () => {} }, [], source);
  source.dashes[0] = 90;
  assert.equal(next[0]!.dashes[0], 8);
  assert.throws(() =>
    saveLineStyle(
      {
        read: () => null,
        write: () => {
          throw new Error("quota");
        },
      },
      next,
      { ...style, name: "changed" },
    ),
  );
  assert.equal(next[0]!.name, style.name);
});

test("builtins editable and deletion persists without resurrection", () => {
  let raw: string | null = null;
  const storage = {
    read: () => raw,
    write: (v: string) => {
      raw = v;
    },
  };
  const initial = loadLineStyles(storage);
  assert.equal(initial.length, 3);
  const edited = saveLineStyle(storage, initial, {
    ...builtInLineStyles[0]!,
    name: "Neu",
    color: "#00aabb",
  });
  assert.equal(edited[0]!.id, "solid");
  const deleted = deleteLineStyle(storage, edited, "solid");
  assert.deepEqual(loadLineStyles(storage), deleted);
  assert.ok(!deleted.some((s) => s.id === "solid"));
});
test("legacy library migrates and drawn geometry is validated and owned", () => {
  const old = loadLineStyles({
    read: () => JSON.stringify({ version: 1, styles: [style] }),
    write: () => {
      assert.fail();
    },
  });
  assert.equal(old.length, 4);
  assert.equal(old[3]!.segments![0]!.end.x, 8);
  const input = {
    id: "drawn",
    name: "Zack",
    dashes: [],
    period: 20,
    color: "#00aabb",
    segments: [{ start: { x: 0, y: 0 }, end: { x: 10, y: 5 } }],
  };
  const result = validateLineStyle(input);
  input.segments[0]!.end.x = 99;
  assert.equal(result.segments![0]!.end.x, 10);
  for (const change of [
    { color: "red" },
    { period: 0 },
    { segments: [] },
    { segments: [{ start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }] },
  ])
    assert.throws(() => validateLineStyle({ ...result, ...change }));
});

test("inventory persists, caps at ten and deletion removes its reference", () => {
  let raw: string | null = null;
  const storage = {
    read: () => raw,
    write: (v: string) => {
      raw = v;
    },
  };
  const styles = loadLineStyles(storage);
  saveLineInventory(storage, styles, ["solid", "dashed"]);
  assert.deepEqual(loadLineInventory(storage, styles), ["solid", "dashed"]);
  const next = deleteLineStyle(storage, styles, "solid");
  assert.deepEqual(loadLineInventory(storage, next), ["dashed"]);
  assert.throws(() => validateLineInventory(["dashed", "dashed"], next));
  assert.throws(() => validateLineInventory(["missing"], next));
  const many = Array.from({ length: 11 }, (_, i) => ({ ...builtInLineStyles[0]!, id: `s${i}` }));
  assert.throws(() =>
    validateLineInventory(
      many.map((s) => s.id),
      many,
    ),
  );
});

test("legacy maximum of 100 custom styles remains loadable with three defaults", () => {
  const legacy = Array.from({ length: 100 }, (_, i) => ({ ...style, id: `legacy-${i}` }));
  const loaded = loadLineStyles({
    read: () => JSON.stringify({ version: 1, styles: legacy }),
    write: () => {
      assert.fail();
    },
  });
  assert.equal(loaded.length, 103);
});
