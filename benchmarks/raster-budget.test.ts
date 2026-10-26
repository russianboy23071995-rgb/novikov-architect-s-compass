import { PROJECT_SCHEMA_VERSION } from "../src/domain/project/format.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { rasterFixture } from "./raster-budget-fixture.ts";
import {
  rasterPixels,
  rasterBudgetWarning,
  assertProjectRasterBudget,
} from "../src/domain/project/raster-budget.ts";
import {
  createProjectRecoveryCodec,
  payloadKey,
} from "../src/interop/project-file/recovery-codec.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { createProject } from "../src/application/projects/create.ts";
import {
  prepareProjectOpen,
  requestProjectDownload,
} from "../src/application/project-files/operations.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../src/application/history/project-history.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { previewCreateReference } from "../src/application/references/actions.ts";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import type {
  RecoveryDocument,
  RecoveryPayload,
  RecoveryRecordV2,
} from "../src/application/project-files/recovery-v2.ts";
const nine = rasterFixture(9),
  eight = {
    ...nine,
    assets: nine.assets.slice(0, 8),
    storeys: nine.storeys.map((s) => ({ ...s, references: s.references.slice(0, 8) })),
  };
test("aggregate boundary is per asset, reference multiplicity does not matter", () => {
  assert.equal(rasterPixels(eight.assets), 128000000);
  assert.doesNotThrow(() => assertProjectRasterBudget(eight));
  assert.throws(() => assertProjectRasterBudget(nine), /128/);
  assert.doesNotThrow(() =>
    assertProjectRasterBudget({ assets: [{ pixelWidth: 1, pixelHeight: 127999999 }] }),
  );
  assert.throws(() =>
    assertProjectRasterBudget({ assets: [{ pixelWidth: 1, pixelHeight: 128000001 }] }),
  );
  assert.throws(() => rasterPixels([{ pixelWidth: NaN, pixelHeight: 1 }]));
});
test("nine real PNGs under byte limit: new import/commit blocked, old file opens and exports with warning", async () => {
  const json = serializeProject(nine);
  assert.ok(Buffer.byteLength(json) < 1048576);
  const candidate = await prepareProjectOpen({
    name: "ü.json",
    size: Buffer.byteLength(json),
    text: async () => json,
  });
  assert.match(rasterBudgetWarning(candidate.project)!, /Lokale Sicherung nicht möglich/);
  let exported = "";
  requestProjectDownload(candidate.project, (text) => {
    exported = text;
  });
  assert.deepEqual(JSON.parse(exported).assets, nine.assets);
  const history = createHistory(eight);
  assert.throws(() => commitProject(history, nine), /128/);
  assert.throws(
    () =>
      previewCreateReference(eight, eight, {
        projectId: eight.id,
        asset: nine.assets[8]!,
        reference: nine.storeys[0]!.references[8]!,
      }),
    /128/,
  );
  const loaded = editingReducer(createEditingState(eight), { type: "load-project", project: nine });
  assert.equal(loaded.error, "");
  assert.equal(loaded.projectLoad?.accepted, true);
  assert.deepEqual(redoProject(undoProject(loaded.history)).present.assets, nine.assets);
  assert.doesNotThrow(() => commitProject(loaded.history, { ...nine, groundDatum: 2 }));
});
test("write and restore count duplicate payload links consistently; eight distinct restore", async () => {
  const codec = createProjectRecoveryCodec();
  assert.deepEqual((await codec.restore(await codec.prepare(eight))).assets, eight.assets);
  for (const p of [nine, rasterFixture(9, true)]) {
    await assert.rejects(codec.prepare(p), /128/);
    const blobs: Record<string, RecoveryPayload> = {},
      links = [];
    for (const a of p.assets) {
      const { id, ...payload } = a;
      const key = await payloadKey(payload);
      blobs[key] = payload;
      links.push({ id, key });
    }
    const doc: RecoveryDocument = { model: { ...p, assets: links }, blobs };
    await assert.rejects(codec.restore(doc), /budget/);
  }
});
test("rejected recovery does not publish or replace current/previous; abort preserves record", async () => {
  let record: RecoveryRecordV2 | null = null,
    writes = 0;
  const storage = {
    read: async () => ({ legacy: null, record }),
    publish: async (_expected: unknown, next: RecoveryRecordV2) => {
      writes++;
      record = next;
    },
  };
  const writer = await prepareRecoveryV2Writer(storage, nine.id, createProjectRecoveryCodec());
  await writer.save(createProject(nine.id, "eg"), () => true);
  const saved = record;
  await assert.rejects(
    writer.save(nine, () => true),
    /128/,
  );
  assert.equal(record, saved);
  assert.equal(writes, 1);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(writer.save(eight, () => true, controller.signal));
  assert.equal(record, saved);
});

test("legacy migration preserves oversized assets; shared references do not consume extra pixels", async () => {
  const old = { ...nine, schemaVersion: 24 };
  const text = JSON.stringify(old);
  const opened = await prepareProjectOpen({
    name: "alt-ü.json",
    size: Buffer.byteLength(text),
    text: async () => text,
  });
  assert.equal(opened.project.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(opened.project.assets, nine.assets);
  const shared = {
    ...eight,
    storeys: eight.storeys.map((s) => ({
      ...s,
      references: [...s.references, { ...s.references[0]!, id: "shared-copy" }],
    })),
  };
  const codec = createProjectRecoveryCodec();
  const restored = await codec.restore(await codec.prepare(shared));
  assert.equal(restored.storeys[0]!.references.length, 9);
  const duplicate = rasterFixture(8, true);
  const document = await codec.prepare(duplicate);
  assert.equal(Object.keys(document.blobs).length, 1);
  assert.deepEqual((await codec.restore(document)).assets, duplicate.assets);
});
test("quota failure at publication preserves the last writer state", async () => {
  let record: RecoveryRecordV2 | null = null,
    rejectWrite = false;
  const storage = {
    read: async () => ({ legacy: null, record }),
    publish: async (_expected: unknown, next: RecoveryRecordV2) => {
      if (rejectWrite) throw new DOMException("Test quota", "QuotaExceededError");
      record = next;
    },
  };
  const writer = await prepareRecoveryV2Writer(storage, eight.id, createProjectRecoveryCodec());
  await writer.save(createProject(eight.id, "eg"), () => true);
  const previous = record,
    model = writer.project;
  rejectWrite = true;
  await assert.rejects(
    writer.save(eight, () => true),
    /quota/,
  );
  assert.equal(record, previous);
  assert.equal(writer.project, model);
});
