import { test } from "node:test";
import assert from "node:assert/strict";
import {
  saveLineStyle,
  loadLineStyles,
  deleteLineStyle,
  validateLineStyle,
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
test("invalid patterns rejected and builtins protected", () => {
  for (const dashes of [[], [1], [1, -1], [1, NaN], [0, 2], [1001, 2]])
    assert.throws(() => validateLineStyle({ ...style, dashes }));
  assert.throws(() => validateLineStyle({ ...style, id: "solid" }));
  assert.throws(() => validateLineStyle({ ...style, name: " " }));
  assert.throws(() => deleteLineStyle({ read: () => null, write: () => {} }, [], "solid"));
});
test("corrupt storage rejected without overwrite", () => {
  for (const raw of [
    "{",
    "null",
    JSON.stringify({ version: 2, styles: [] }),
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
