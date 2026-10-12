import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  serializeProject,
  deserializeProject,
  validateProject,
} from "../../lib/bim/model.ts";
import { createHistory, undoProject, redoProject } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { PROJECT_FILE_LIMIT } from "../../interop/project-file/size.ts";
import { previewCreateReference, commitCreateReference } from "./actions.ts";
import { layerDeletionBlock } from "../layers/actions.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=";
function setup() {
  const base = createProject("p", "s");
  const request = {
    projectId: base.id,
    asset: {
      id: "asset",
      mimeType: "image/png" as const,
      pixelWidth: 1,
      pixelHeight: 1,
      data: png,
    },
    reference: {
      id: "ref",
      kind: "image-reference" as const,
      assetId: "asset",
      layerId: base.defaultLayerIds.line,
      origin: { x: 3, y: 4 },
      rotation: 0.4,
      metresPerPixel: 2,
    },
  };
  return { base, request };
}
test("reference import is atomic, portable, immutable and one undo/redo step", () => {
  const { base, request } = setup();
  const h = createHistory(base);
  const before = serializeProject(h.present);
  const preview = previewCreateReference(h.present, h.present, request);
  assert.equal(serializeProject(h.present), before);
  const next = commitCreateReference(h, h.present, request);
  assert.deepEqual(next.present, preview);
  assert.equal(next.past.length, 1);
  assert.deepEqual(deserializeProject(serializeProject(next.present)), next.present);
  assert.deepEqual(undoProject(next).present, h.present);
  assert.deepEqual(redoProject(undoProject(next)).present, next.present);
  request.reference.origin.x = 99;
  assert.equal(next.present.storey.references[0]!.origin.x, 3);
});
test("V8 migrates strictly without inventing assets and keeps source unchanged", () => {
  const { base } = setup();
  const { assets, hatchPatterns, ...root } = base;
  const { references, ...storey } = base.storey;
  const old = { ...root, schemaVersion: 8, storey };
  const before = JSON.stringify(old);
  assert.deepEqual(loadProjectData(old), base);
  assert.equal(JSON.stringify(old), before);
  assert.throws(() => loadProjectData({ ...old, assets: [] }));
  assert.throws(() => validateProject({ ...base, assets: undefined }));
});
test("invalid identities, asset links, layers and stale imports fail atomically", () => {
  const { base, request } = setup();
  const h = createHistory(base);
  for (const r of [
    { ...request, projectId: "other" },
    { ...request, asset: { ...request.asset, id: base.id } },
    { ...request, reference: { ...request.reference, id: base.storey.id } },
    { ...request, reference: { ...request.reference, assetId: "missing" } },
    { ...request, reference: { ...request.reference, layerId: "missing" } },
  ])
    assert.throws(() => commitCreateReference(h, h.present, r));
  assert.throws(() => previewCreateReference(base, { ...base }, request));
  const next = commitCreateReference(h, h.present, request);
  assert.throws(() => commitCreateReference(next, next.present, request));
  assert.equal(h.past.length, 0);
  assert.equal(h.present.assets.length, 0);
});
test("storage rejects malformed base64, MIME, dimensions and oversized decoded metadata", () => {
  const { base, request } = setup();
  for (const change of [
    { data: "blob:temp" },
    { data: "AB==" },
    { data: "AAAA=" },
    { data: "AA A" },
    { data: "" },
    { mimeType: "image/svg+xml" },
    { pixelWidth: 0 },
    { pixelHeight: 1.5 },
    { pixelWidth: 5000, pixelHeight: 5000 },
  ])
    assert.throws(() => validateProject({ ...base, assets: [{ ...request.asset, ...change }] }));
});
test("transforms reject overflow and numerically collapsed extents", () => {
  const { base, request } = setup();
  for (const change of [
    { metresPerPixel: 0 },
    { metresPerPixel: -1 },
    { rotation: Infinity },
    { origin: { x: 1e308, y: 1e308 } },
    { origin: { x: 0, y: 0 }, metresPerPixel: Infinity },
  ])
    assert.throws(() =>
      previewCreateReference(base, base, {
        ...request,
        reference: { ...request.reference, ...change },
      }),
    );
});
test("missing assets and duplicate cross-kind identities cannot reload", () => {
  const { base, request } = setup();
  const p = previewCreateReference(base, base, request);
  assert.throws(() => deserializeProject(JSON.stringify({ ...p, assets: [] })));
  assert.throws(() => validateProject({ ...p, assets: [{ ...request.asset, id: "ref" }] }));
});
test("reference occupies its layer and follows common visibility eligibility", () => {
  const { base, request } = setup();
  base.layers.push({ id: "custom", name: "Referenz" });
  request.reference.layerId = "custom";
  const p = previewCreateReference(base, base, request);
  assert.ok(layerDeletionBlock(p, request.reference.layerId));
  const policy = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [request.reference.layerId],
  });
  assert.equal(policy.evaluate(p, policy.context, "ref").eligible, false);
});
test("file size applies on import commit, export and direct deserialization", () => {
  const { base, request } = setup();
  request.asset.data = "AAAA".repeat(PROJECT_FILE_LIMIT / 4);
  const h = createHistory(base);
  assert.throws(() => commitCreateReference(h, h.present, request), /10 MB/);
  const p = validateProject({ ...base, assets: [request.asset] });
  assert.throws(() => serializeProject(p), /10 MB/);
  assert.throws(() => deserializeProject(" ".repeat(PROJECT_FILE_LIMIT + 1)), /10 MB/);
  assert.equal(h.present.assets.length, 0);
});

test("reference data leaves BIM IFC output unchanged", async () => {
  const { createExampleProject } = await import("../../components/cad/bim-view.ts");
  const { exportIfc } = await import("../../lib/bim/ifc.ts");
  const base = createExampleProject();
  const { request } = setup();
  request.projectId = base.id;
  request.reference.layerId = base.defaultLayerIds.line;
  const next = previewCreateReference(base, base, request);
  const date = new Date("2026-10-07T12:00:00Z");
  assert.equal(await exportIfc(next, date), await exportIfc(base, date));
});
