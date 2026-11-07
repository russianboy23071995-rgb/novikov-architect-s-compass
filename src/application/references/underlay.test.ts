import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { serializeProject, deserializeProject } from "../../lib/bim/model.ts";
import { createProject } from "../projects/create.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { previewCreateReference, updateImageReference } from "./actions.ts";
import { planSelectionShapes } from "../../rendering/viewport/selection-shapes.ts";
import { lockedReferenceAt } from "../../rendering/viewport/image-reference.ts";
import { filterElements, NO_CRITERIA } from "../selection/filter.ts";

// docs/BILDUNTERLAGE.md, B2: opacity, grey and lock of an image underlay.
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function withUnderlay() {
  const base = createProject("p", "s");
  return previewCreateReference(base, base, {
    projectId: base.id,
    asset: { id: "asset", mimeType: "image/png", pixelWidth: 1, pixelHeight: 1, data: png },
    reference: {
      id: "ref",
      kind: "image-reference",
      assetId: "asset",
      layerId: base.defaultLayerIds.line,
      origin: { x: 0, y: 10 },
      rotation: 0,
      metresPerPixel: 10,
    },
  });
}
const ref = (p: ReturnType<typeof withUnderlay>) => storeyOf(p).references[0]!;

test("underlay: opacity, grey and lock are stored; defaults stay absent", () => {
  const p = withUnderlay();
  const shown = updateImageReference(p, "ref", { opacity: 0.3, grayscale: true, locked: true });
  assert.equal(ref(shown).opacity, 0.3);
  assert.equal(ref(shown).grayscale, true);
  assert.equal(ref(shown).locked, true);
  assert.deepEqual(deserializeProject(serializeProject(shown)), shown);
  const back = updateImageReference(shown, "ref", { opacity: 1, grayscale: false, locked: false });
  assert.deepEqual(Object.keys(ref(back)).sort(), Object.keys(ref(p)).sort());
  assert.throws(() => updateImageReference(p, "ref", { opacity: 0 }));
  assert.throws(() => updateImageReference(p, "nope", { opacity: 0.5 }));
});

test("underlay: width, position and rotation from the element window", () => {
  const p = updateImageReference(withUnderlay(), "ref", {
    metresPerPixel: 4,
    origin: { x: 1, y: 2 },
    rotation: Math.PI / 2,
  });
  assert.equal(ref(p).metresPerPixel, 4);
  assert.deepEqual(ref(p).origin, { x: 1, y: 2 });
  assert.throws(() => updateImageReference(p, "ref", { metresPerPixel: 0 }));
});

test("underlay: a locked one is not picked, but a double click finds it", () => {
  const p = withUnderlay();
  const ids = (q: typeof p) => planSelectionShapes(q).map((s) => s.target.id);
  assert.ok(ids(p).includes("ref"));
  const locked = updateImageReference(p, "ref", { locked: true });
  assert.ok(!ids(locked).includes("ref"));
  assert.ok(
    !filterElements(locked, undefined, { kind: "storey" }, NO_CRITERIA).some((t) => t.id === "ref"),
  );
  assert.equal(
    lockedReferenceAt(locked, { x: 5, y: 5 }, () => true),
    "ref",
  );
  assert.equal(
    lockedReferenceAt(locked, { x: 15, y: 5 }, () => true),
    undefined,
  );
  assert.equal(
    lockedReferenceAt(locked, { x: 5, y: 5 }, () => false),
    undefined,
  );
  assert.equal(
    lockedReferenceAt(p, { x: 5, y: 5 }, () => true),
    undefined,
  );
});

test("underlay: a schema 66 file loads; it rejects the new fields", () => {
  const p = withUnderlay();
  const old = { ...JSON.parse(serializeProject(p)), schemaVersion: 66 };
  assert.deepEqual(ref(loadProjectData(old)), ref(p));
  const withOpacity = JSON.parse(
    serializeProject(updateImageReference(p, "ref", { opacity: 0.5 })),
  );
  assert.throws(() => loadProjectData({ ...withOpacity, schemaVersion: 66 }));
});
