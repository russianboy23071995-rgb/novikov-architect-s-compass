import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { previewCreateReference } from "../references/actions.ts";
import { changeDrawingDocument } from "./documents.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";

// docs/BILDUNTERLAGE.md, B6: underlays on layouts only where the drawing document says so.
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function withDocument() {
  let p = createProject("p", "s");
  p = previewCreateReference(p, p, {
    projectId: p.id,
    asset: { id: "asset", mimeType: "image/png", pixelWidth: 1, pixelHeight: 1, data: png },
    reference: {
      id: "ref",
      kind: "image-reference",
      assetId: "asset",
      layerId: p.defaultLayerIds.line,
      origin: { x: 0, y: 10 },
      rotation: 0,
      metresPerPixel: 10,
    },
  });
  return changeDrawingDocument(p, p, {
    kind: "create",
    id: "doc",
    modelViewId: "view",
    name: "Grundriss",
    denominator: 100,
  });
}
const doc = (p: ReturnType<typeof withDocument>) =>
  p.drawingDocuments!.find((d) => d.id === "doc")!;

test("layout underlays: off by default, a switch per drawing document", () => {
  const p = withDocument();
  assert.equal(doc(p).showUnderlays, undefined);
  const on = changeDrawingDocument(p, p, { kind: "underlays", id: "doc", show: true });
  assert.equal(doc(on).showUnderlays, true);
  const off = changeDrawingDocument(on, on, { kind: "underlays", id: "doc", show: false });
  assert.ok(!("showUnderlays" in doc(off)));
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(on))), on);
});

test("layout underlays: a schema 67 file loads; it rejects the switch", () => {
  const p = withDocument();
  const old = { ...JSON.parse(serializeProject(p)), schemaVersion: 67 };
  assert.deepEqual(doc(loadProjectData(old)), doc(p));
  const on = JSON.parse(
    serializeProject(changeDrawingDocument(p, p, { kind: "underlays", id: "doc", show: true })),
  );
  assert.throws(() => loadProjectData({ ...on, schemaVersion: 67 }));
});
