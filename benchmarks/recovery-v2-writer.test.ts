import test from "node:test";
import assert from "node:assert/strict";
import { prepareRecoveryV2Writer } from "../src/application/project-files/recovery-v2-writer.ts";
import {
  type RecoveryV2Storage,
  type RecoveryRecordV2,
  restoreRecoveryV2,
} from "../src/application/project-files/recovery-v2.ts";
import { createBoundedRecoveryCodec } from "../src/interop/project-file/recovery-codec.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
const budget = { modelBytes: 1024 * 1024, payloadBytes: 1024 * 1024, pixels: 1000 };
const project = () => {
  const p = recoveryFixture("writer", 2);
  p.assets.push({
    id: "image",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=",
  });
  return p;
};
function memory() {
  const state = {
    record: null as RecoveryRecordV2 | null,
    legacy: null as string | null,
    fail: false,
    writes: 0,
  };
  const port: RecoveryV2Storage = {
    read: async () => structuredClone({ record: state.record, legacy: state.legacy }),
    publish: async (expected, next, signal, isCurrent) => {
      signal?.throwIfAborted();
      if (isCurrent && !isCurrent()) throw new Error("context");
      if (state.fail) throw new Error("disk full");
      if (
        expected.revision !== (state.record?.revision ?? null) ||
        expected.legacy !== state.legacy
      )
        throw new Error("conflict");
      state.record = structuredClone(next);
      state.writes++;
    },
  };
  return { state, port };
}
test("writer advances only after commit; failed save retries with last successful predecessor", async () => {
  const m = memory(),
    codec = createBoundedRecoveryCodec(budget),
    p = project();
  const writer = await prepareRecoveryV2Writer(m.port, p.id, codec);
  const first = await writer.save(p, () => true);
  const changed = { ...p, storey: { ...p.storey, lines: [] } };
  m.state.fail = true;
  await assert.rejects(
    writer.save(changed, () => true),
    /disk full/,
  );
  assert.equal(m.state.record!.revision, first.revision);
  m.state.fail = false;
  const second = await writer.save(changed, () => true);
  assert.notEqual(first.revision, second.revision);
  assert.deepEqual(await codec.restore(m.state.record!.previous!.document), p);
  assert.deepEqual((await restoreRecoveryV2(m.state.record, p.id, codec)).project, changed);
});
test("writer preserves valid fallback and refuses unmigrated or unknown source", async () => {
  const m = memory(),
    codec = createBoundedRecoveryCodec(budget),
    p = project();
  let writer = await prepareRecoveryV2Writer(m.port, p.id, codec);
  await writer.save(p, () => true);
  await writer.save(p, () => true);
  m.state.record!.current.document.blobs = {};
  writer = await prepareRecoveryV2Writer(m.port, p.id, codec);
  await writer.save(p, () => true);
  assert.deepEqual(await codec.restore(m.state.record!.previous!.document), p);
  const other = memory();
  other.state.legacy = "old";
  await assert.rejects(prepareRecoveryV2Writer(other.port, p.id, codec), /migration required/);
  other.state.record = { ...m.state.record!, version: 99 } as unknown as RecoveryRecordV2;
  await assert.rejects(prepareRecoveryV2Writer(other.port, p.id, codec), /Unsupported/);
});
test("parallel, cancelled and stale-context saves publish no partial state", async () => {
  const m = memory(),
    codec = createBoundedRecoveryCodec(budget),
    p = project();
  let release!: () => void;
  const waiting = new Promise<void>((r) => {
    release = r;
  });
  const held = {
    ...codec,
    prepare: async (input: typeof p) => {
      await waiting;
      return codec.prepare(input);
    },
  };
  const writer = await prepareRecoveryV2Writer(m.port, p.id, held);
  let current = true;
  const saving = writer.save(p, () => current);
  await assert.rejects(
    writer.save(p, () => true),
    /already running/,
  );
  current = false;
  release();
  await assert.rejects(saving, /context changed/);
  assert.equal(m.state.writes, 0);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    writer.save(p, () => true, controller.signal),
    { name: "AbortError" },
  );
  await assert.rejects(
    writer.save({ ...p, id: "foreign" }, () => true),
    /mismatch/,
  );
  assert.equal(m.state.writes, 0);
  await writer.save(p, () => true);
  assert.equal(m.state.writes, 1);
});
test("external conflict never advances private expected revision; new session can resume", async () => {
  const m = memory(),
    codec = createBoundedRecoveryCodec(budget),
    p = project();
  const a = await prepareRecoveryV2Writer(m.port, p.id, codec),
    b = await prepareRecoveryV2Writer(m.port, p.id, codec);
  await a.save(p, () => true);
  await assert.rejects(
    b.save(p, () => true),
    /conflict/,
  );
  await assert.rejects(
    b.save(p, () => true),
    /conflict/,
  );
  assert.equal(m.state.writes, 1);
  await (await prepareRecoveryV2Writer(m.port, p.id, codec)).save(p, () => true);
  assert.equal(m.state.writes, 2);
});
test("model, payload and pixel budgets apply to preparation and restore", async () => {
  const p = project(),
    codec = createBoundedRecoveryCodec(budget),
    doc = await codec.prepare(p);
  const bytes = new TextEncoder().encode(JSON.stringify(doc.model)).length;
  for (const limits of [
    { ...budget, modelBytes: bytes - 1 },
    { ...budget, payloadBytes: p.assets[0]!.data.length - 1 },
  ]) {
    const limited = createBoundedRecoveryCodec(limits);
    await assert.rejects(limited.prepare(p), /budget exceeded/);
    await assert.rejects(limited.restore(doc), /budget exceeded/);
  }
  const larger = structuredClone(doc),
    key = larger.model.assets[0]!.key;
  larger.blobs = { [key]: { ...larger.blobs[key]!, pixelWidth: 2 } };
  await assert.rejects(
    createBoundedRecoveryCodec({ ...budget, pixels: 1 }).restore(larger),
    /budget exceeded/,
  );
  const duplicated = { ...p, assets: [...p.assets, { ...p.assets[0]!, id: "other" }] };
  await assert.rejects(
    createBoundedRecoveryCodec({ ...budget, pixels: 1 }).prepare(duplicated),
    /budget exceeded/,
  );
  assert.throws(
    () => createBoundedRecoveryCodec({ ...budget, pixels: NaN }),
    /Invalid recovery budget/,
  );
});
