import { storeyOf, replaceStorey } from "../src/domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createImageAssetHandle,
  imageAssetSchema,
} from "../src/domain/elements/reference/model.ts";
import { createProject } from "../src/application/projects/create.ts";
import { addLine, updateLine } from "../src/application/lines/actions.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../src/application/history/project-history.ts";
const asset = {
  id: "a",
  mimeType: "image/png" as const,
  pixelWidth: 1,
  pixelHeight: 1,
  data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=",
};
function fixture(trusted = false) {
  const p = addLine(createProject("p", "s"), {
    id: "l",
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ],
    ...defaultLineAppearance,
  });
  p.assets.push(trusted ? createImageAssetHandle(asset) : { ...asset });
  storeyOf(p).references.push({
    id: "r",
    kind: "image-reference",
    layerId: p.defaultLayerIds.line,
    assetId: "a",
    origin: { x: 0, y: 0 },
    rotation: 0,
    metresPerPixel: 1,
  });
  return p;
}
test("only owned immutable identity reuses storage validation", () => {
  const input = { ...asset },
    handle = createImageAssetHandle(input);
  input.data = "bad";
  assert.equal(handle.data, asset.data);
  assert.equal(imageAssetSchema.parse(handle), handle);
  assert.notEqual(imageAssetSchema.parse({ ...handle }), handle);
  assert.throws(() => {
    handle.data = "bad";
  });
  for (const bad of [
    { ...handle, data: "bad" },
    Object.freeze({ ...handle, data: "!!!!" }),
    { ...handle, pixelWidth: 0 },
    { ...handle, key: "forged" },
  ]) {
    assert.throws(() => imageAssetSchema.parse(bad));
    assert.throws(() => createImageAssetHandle(bad));
  }
});
test("existing action commit undo redo agree with full path through 100 changes", () => {
  let full = createHistory(fixture()),
    fast = createHistory(fixture(true));
  const handle = fast.present.assets[0];
  for (let i = 1; i <= 100; i++) {
    const color = i % 2 ? "#112233" : "#334155";
    full = commitProject(full, updateLine(full.present, "l", { color }));
    fast = commitProject(fast, updateLine(fast.present, "l", { color }));
    assert.deepEqual(fast, full);
    assert.equal(fast.present.assets[0], handle);
    if ([1, 10, 50, 100].includes(i)) {
      assert.deepEqual(undoProject(fast), undoProject(full));
      assert.deepEqual(redoProject(undoProject(fast)), redoProject(undoProject(full)));
      assert.equal(commitProject(fast, fast.present), fast);
    }
  }
  assert.equal(fast.past.length, 100);
  assert.equal(fast.past[0]!.assets[0], handle);
});
test("trusted assets never bypass model reference or geometry validation", () => {
  const p = fixture(true),
    h = createHistory(p);
  const invalid = [
    { ...p, assets: [{ ...p.assets[0]!, data: "!!!!" }] },
    {
      ...replaceStorey(p, {
        ...storeyOf(p),
        references: [{ ...storeyOf(p).references[0]!, assetId: "missing" }],
      }),
    },
    {
      ...replaceStorey(p, {
        ...storeyOf(p),
        lines: [
          {
            ...storeyOf(p).lines![0]!,
            points: [
              { x: 0, y: 0 },
              { x: 0, y: 0 },
            ],
          },
        ],
      }),
    },
    { ...p, assets: [...p.assets, ...p.assets] },
  ];
  for (const value of invalid) {
    assert.throws(() => validateProject(value));
    assert.throws(() => commitProject(h, value));
    assert.deepEqual(h.present, p);
  }
});

test("trusted payload still counts toward the aggregate project file limit", () => {
  const p = fixture(true),
    h = createHistory(p);
  // Thirteen individually valid assets exceed the aggregate file budget.
  p.assets = Array.from({ length: 13 }, (_, i) =>
    createImageAssetHandle({
      ...asset,
      id: i === 0 ? asset.id : `large-${i}`,
      data: "A".repeat(10 * 1024 * 1024),
    }),
  );
  assert.throws(() => commitProject(h, p), /128 MiB/);
  assert.equal(h.past.length, 0);
});

test("re-identification accepts only exact owned identities and validates each new ID", async (t) => {
  const { reidentifyImageAssetHandle, isImageAssetHandle } =
    await import("../src/domain/elements/reference/model.ts");
  const raw = { ...asset };
  const handle = createImageAssetHandle(raw);
  raw.data = "bad";
  let reads = 0;
  const forged = Object.freeze({
    ...handle,
    get data() {
      reads++;
      return asset.data;
    },
  });
  for (const value of [
    null,
    {},
    { ...handle },
    JSON.parse(JSON.stringify(handle)),
    Object.freeze({ ...handle }),
    forged,
    new Proxy(handle, {}),
  ])
    assert.throws(() => reidentifyImageAssetHandle(value, "b"), /owned image asset handle/);
  assert.equal(reads, 0);
  for (const id of [null, undefined, 0, "", "  "])
    assert.throws(() => reidentifyImageAssetHandle(handle, id));
  const chars = t.mock.method(String.prototype, "charCodeAt");
  const renamed = reidentifyImageAssetHandle(handle, " b ");
  assert.equal(chars.mock.callCount(), 0, "no repeated base64 scan");
  assert.deepEqual(renamed, { ...handle, id: "b" });
  assert.notEqual(renamed, handle);
  assert.ok(isImageAssetHandle(renamed));
  assert.ok(Object.isFrozen(renamed));
  assert.throws(() => {
    renamed.data = "bad";
  });
});
