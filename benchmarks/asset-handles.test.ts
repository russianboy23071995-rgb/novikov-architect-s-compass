import test from "node:test";
import assert from "node:assert/strict";
import {
  createImageAssetHandle,
  imageAssetSchema,
} from "../src/domain/elements/reference/model.ts";
import { createProject, addLine, updateLine, validateProject } from "../src/lib/bim/model.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history.ts";
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
  p.storey.references.push({
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
      ...p,
      storey: { ...p.storey, references: [{ ...p.storey.references[0]!, assetId: "missing" }] },
    },
    {
      ...p,
      storey: {
        ...p.storey,
        lines: [
          {
            ...p.storey.lines![0]!,
            points: [
              { x: 0, y: 0 },
              { x: 0, y: 0 },
            ],
          },
        ],
      },
    },
    { ...p, assets: [...p.assets, ...p.assets] },
  ];
  for (const value of invalid) {
    assert.throws(() => validateProject(value));
    assert.throws(() => commitProject(h, value));
    assert.deepEqual(h.present, p);
  }
});

test("trusted payload still counts toward the unchanged project file limit", () => {
  const p = fixture(true),
    h = createHistory(p);
  // Canonical Base64 at the individual storage limit, plus model exceeds file limit.
  p.assets = [createImageAssetHandle({ ...asset, data: "A".repeat(10 * 1024 * 1024) })];
  assert.throws(() => commitProject(h, p), /10 MB/);
  assert.equal(h.past.length, 0);
});
