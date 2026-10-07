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
