import test from "node:test";
import assert from "node:assert/strict";
import { createProject, serializeProject } from "../src/lib/bim/model.ts";
import { readProjectFile } from "../src/lib/bim/history.ts";
import {
  splitProject,
  restoreProject,
  pack,
  unpack,
  migrateLegacy,
  probeBudget,
} from "./asset-contract.ts";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=";
function fixture() {
  const p = createProject("p", "s");
  for (const id of ["a", "b"]) {
    p.assets.push({ id, mimeType: "image/png", pixelWidth: 1, pixelHeight: 1, data: png });
    p.storey.references.push({
      id: `r-${id}`,
      kind: "image-reference",
      layerId: p.defaultLayerIds.line,
      assetId: id,
      origin: { x: 0, y: 0 },
      rotation: 0,
      metresPerPixel: 1,
    });
  }
  return p;
}
test("content dedup preserves distinct asset IDs and exact portable legacy roundtrip", async () => {
  const p = fixture(),
    doc = await migrateLegacy(serializeProject(p));
  assert.equal(Object.keys(doc.blobs).length, 1);
  assert.deepEqual(
    doc.model.assets.map((a) => a.id),
    ["a", "b"],
  );
  assert.equal(doc.model.assets[0]!.key, doc.model.assets[1]!.key);
  assert.deepEqual(restoreProject(await unpack(pack(doc))), p);
  assert.ok(Object.isFrozen(doc.model.storey.references[0]));
  assert.ok(Object.isFrozen(Object.values(doc.blobs)[0]));
});
test("missing, corrupted and duplicate payloads and unknown versions fail closed", async () => {
  const original = JSON.parse(pack(await splitProject(fixture()))) as {
    revision: number;
    model: { assets: { key: string }[] };
    blobs: { key: string; payload: { data: string } }[];
  };
  for (const mutate of [
    (p: typeof original) => p.blobs.splice(0),
    (p: typeof original) => (p.blobs[0]!.payload.data = png.replace("42mP8", "42mP9")),
    (p: typeof original) => p.blobs.push(p.blobs[0]!),
    (p: typeof original) => (p.revision = 2),
    (p: typeof original) => (p.model.assets[0]!.key = "0".repeat(64)),
  ]) {
    const p = structuredClone(original);
    mutate(p);
    await assert.rejects(() => unpack(JSON.stringify(p)));
  }
});
test("separate model payload pixel and package budgets are enforced", async () => {
  const doc = await splitProject(fixture());
  for (const b of [
    { ...probeBudget, modelBytes: 1 },
    { ...probeBudget, payloadBytes: 1 },
    { ...probeBudget, packageBytes: 1 },
  ])
    assert.throws(() => pack(doc, b));
  const text = pack(doc);
  await assert.rejects(() => unpack(text, { ...probeBudget, payloadBytes: 1 }));
  const p = fixture();
  p.assets[1]!.data = png.replace("42mP8", "42mP9");
  await assert.rejects(() => splitProject(p, { ...probeBudget, pixels: 1 }));
});
test("asset payload remains reachable from earlier immutable snapshots", async () => {
  const doc = await splitProject(fixture());
  const removed = {
    ...doc,
    model: { ...doc.model, assets: [], storey: { ...doc.model.storey, references: [] } },
  };
  assert.equal(restoreProject(removed).assets.length, 0);
  assert.equal(restoreProject(doc).assets.length, 2);
  assert.equal(removed.blobs, doc.blobs);
});

test("schema 1 migration preserves geometry through the existing migration boundary", async () => {
  const text = JSON.stringify({
    schemaVersion: 1,
    unit: "m",
    id: "legacy",
    storey: {
      id: "s",
      walls: [
        { id: "w", start: { x: 0, y: 0 }, end: { x: 3, y: 0 }, height: 2.8, thickness: 0.36 },
      ],
      windows: [{ id: "f", wallId: "w", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 }],
    },
  });
  assert.deepEqual(
    restoreProject(await unpack(pack(await migrateLegacy(text)))),
    readProjectFile(text),
  );
});
