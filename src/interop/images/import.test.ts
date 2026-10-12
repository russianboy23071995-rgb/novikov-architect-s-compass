import test from "node:test";
import assert from "node:assert/strict";
import { imageHeader, checkedImageUrl } from "./import.ts";
import { createProject } from "../../lib/bim/model.ts";
import { previewCreateReference } from "../../application/references/actions.ts";
import {
  selectionIndex,
  eligibleSelection,
  selectTargets,
} from "../../application/selection/state.ts";
import { planSelectionShapes, enclosedTargets } from "../../rendering/viewport/selection-shapes.ts";
import { createLayerVisibilityPolicy } from "../../application/layers/visibility.ts";
import { assertMovableSelection } from "../../application/selection/move.ts";
const png = () => {
  const b = new Uint8Array(24);
  b.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const v = new DataView(b.buffer);
  v.setUint32(16, 200);
  v.setUint32(20, 100);
  return b;
};
test("PNG header returns actual dimensions before decoding", () =>
  assert.deepEqual(imageHeader(png()), { width: 200, height: 100, mimeType: "image/png" }));
test("JPEG scans length-delimited segments for dimensions", () => {
  const b = new Uint8Array([255, 216, 255, 224, 0, 4, 0, 0, 255, 192, 0, 8, 8, 0, 100, 0, 200, 0]);
  assert.deepEqual(imageHeader(b), { width: 200, height: 100, mimeType: "image/jpeg" });
});
test("invalid, truncated and excessive image headers are rejected", () => {
  for (const b of [
    new Uint8Array(),
    new TextEncoder().encode("<svg/>"),
    new Uint8Array([255, 216, 255, 192, 0, 8]),
  ])
    assert.throws(() => imageHeader(b));
  const b = png();
  new DataView(b.buffer).setUint32(16, 200000);
  assert.throws(() => imageHeader(b));
  const zero = png();
  new DataView(zero.buffer).setUint32(20, 0);
  assert.throws(() => imageHeader(zero));
});
test("image selection and marquee use shared geometry and layer eligibility", () => {
  const base = createProject("p", "s");
  const p = previewCreateReference(base, base, {
    projectId: "p",
    asset: { id: "a", mimeType: "image/png", pixelWidth: 200, pixelHeight: 100, data: "AAAA" },
    reference: {
      id: "r",
      kind: "image-reference",
      assetId: "a",
      layerId: base.defaultLayerIds.line,
      origin: { x: 2, y: 3 },
      rotation: 0,
      metresPerPixel: 0.01,
    },
  });
  const target = { kind: "reference" as const, id: "r" };
  assert.deepEqual(selectionIndex(p).get("r"), target);
  const shapes = planSelectionShapes(p);
  assert.deepEqual(shapes[0]!.points, [
    { x: 2, y: 3 },
    { x: 4, y: 3 },
    { x: 4, y: 2 },
    { x: 2, y: 2 },
  ]);
  assert.deepEqual(enclosedTargets(shapes, { x: 1, y: 1 }, { x: 5, y: 4 }), [target]);
  assert.deepEqual(selectTargets([target], [target], "toggle"), []);
  const policy = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [base.defaultLayerIds.line],
  });
  assert.deepEqual(eligibleSelection(p, policy, [target]), []);
  assert.doesNotThrow(() => assertMovableSelection(p, [target]));
  assert.throws(() => assertMovableSelection(p, [target], policy));
});

test("reloaded payload header must agree with stored MIME and dimensions", () => {
  const bytes = png();
  const data = Buffer.from(bytes).toString("base64");
  const a = { id: "a", mimeType: "image/png" as const, pixelWidth: 200, pixelHeight: 100, data };
  assert.ok(checkedImageUrl(a));
  assert.equal(checkedImageUrl({ ...a, pixelWidth: 201 }), undefined);
  assert.equal(checkedImageUrl({ ...a, mimeType: "image/jpeg" }), undefined);
  assert.equal(checkedImageUrl({ ...a, data: "invalid" }), undefined);
});

const cacheAsset = (tag: number, payloadLength = 0) => {
  const bytes = png();
  // Distinct ancillary payload; imageHeader checks dimensions, not full decoding.
  const data =
    Buffer.from(bytes).toString("base64") +
    tag.toString(16).padStart(8, "0") +
    "A".repeat(payloadLength);
  return {
    id: `cache-${tag}`,
    mimeType: "image/png" as const,
    pixelWidth: 200,
    pixelHeight: 100,
    data,
  };
};

test("equivalent preview assets reuse the checked URL regardless of ID", (t) => {
  const decode = t.mock.method(globalThis, "atob");
  const asset = cacheAsset(1);
  const expected = `data:image/png;base64,${asset.data}`;
  assert.equal(checkedImageUrl(asset), expected);
  assert.equal(checkedImageUrl({ ...asset, id: "copy" }), expected);
  assert.equal(decode.mock.callCount(), 1);
});

test("changed bytes, MIME and dimensions cannot reuse stale results, even on the same object", (t) => {
  const decode = t.mock.method(globalThis, "atob");
  const asset = cacheAsset(2);
  const original = { ...asset };
  const url = checkedImageUrl(asset);
  asset.pixelWidth++;
  assert.equal(checkedImageUrl(asset), undefined);
  assert.equal(checkedImageUrl({ ...asset }), undefined);
  Object.assign(asset, original, { pixelHeight: 101 });
  assert.equal(checkedImageUrl(asset), undefined);
  Object.assign(asset, original, { mimeType: "image/jpeg" });
  assert.equal(checkedImageUrl(asset), undefined);
  Object.assign(asset, original, { data: "invalid-cache-2" });
  assert.equal(checkedImageUrl(asset), undefined);
  Object.assign(asset, original);
  assert.equal(checkedImageUrl(asset), url);
  assert.equal(decode.mock.callCount(), 5);
  asset.data = cacheAsset(3).data;
  assert.equal(checkedImageUrl(asset), `data:image/png;base64,${asset.data}`);
  assert.equal(decode.mock.callCount(), 6);
});

test("cache retains only eight recent results and refreshes recency on a hit", (t) => {
  const decode = t.mock.method(globalThis, "atob");
  const assets = Array.from({ length: 9 }, (_, i) => cacheAsset(100 + i));
  for (const asset of assets.slice(0, 8)) checkedImageUrl(asset);
  checkedImageUrl({ ...assets[0]! });
  checkedImageUrl(assets[8]!);
  checkedImageUrl({ ...assets[0]! });
  assert.equal(decode.mock.callCount(), 9);
  checkedImageUrl(assets[1]!);
  assert.equal(decode.mock.callCount(), 10);
});

test("large image strings evict older results at the payload budget", (t) => {
  const decode = t.mock.method(globalThis, "atob");
  // Three 5 MiB base64 strings plus their URLs exceed the 48 MiB UTF-16 budget.
  const assets = [201, 202, 203].map((tag) => cacheAsset(tag, 5 * 1024 * 1024));
  for (const asset of assets) checkedImageUrl(asset);
  checkedImageUrl({ ...assets[2]! });
  assert.equal(decode.mock.callCount(), 3);
  checkedImageUrl(assets[0]!);
  assert.equal(decode.mock.callCount(), 4);
});

test("a result larger than the entire budget is checked but never retained", (t) => {
  const asset = cacheAsset(301, 13 * 1024 * 1024);
  // Isolate cache admission from decoder cost for this above-file-limit input.
  const decode = t.mock.method(globalThis, "atob", () => Buffer.from(png()).toString("binary"));
  const expected = `data:image/png;base64,${asset.data}`;
  assert.equal(checkedImageUrl(asset), expected);
  assert.equal(checkedImageUrl({ ...asset }), expected);
  assert.equal(decode.mock.callCount(), 2);
});
