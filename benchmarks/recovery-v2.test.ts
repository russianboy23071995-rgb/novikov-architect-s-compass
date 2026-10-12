import test from "node:test";
import assert from "node:assert/strict";
import {
  migrateRecoveryV1,
  restoreRecoveryV2,
  type RecoveryRecordV2,
  type RecoveryV2Storage,
} from "../src/application/project-files/recovery-v2.ts";
import { createPreparation, restoreCheckedSnapshot } from "./asset-recovery-store.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
const project = () => {
  const p = recoveryFixture("migration", 2);
  p.assets.push({
    id: "a",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=",
  });
  return p;
};
const codec = () => ({ prepare: createPreparation().prepare, restore: restoreCheckedSnapshot });
const snapshot = (p = project()) => ({
  json: serializeProject(p),
  savedAt: "2026-10-12T12:00:00Z",
});
function memory(legacy: string | null) {
  const state = {
    legacy,
    record: null as unknown | null,
    writes: 0,
    fail: false,
    beforeCommit: () => {},
  };
  const port: RecoveryV2Storage = {
    read: async () => ({ legacy: state.legacy, record: structuredClone(state.record) }),
    publish: async (expected, next, signal) => {
      state.beforeCommit();
      signal?.throwIfAborted();
      if (state.fail) throw new Error("disk full");
      if (
        state.legacy !== expected.legacy ||
        (state.record as RecoveryRecordV2 | null)?.revision !== (expected.revision ?? undefined)
      )
        throw new Error("conflict");
      state.record = structuredClone(next);
      state.writes++;
    },
  };
  return { state, port };
}
test("V1 migrates current and previous through real checked asset codec; retains legacy bytes", async () => {
  const old = project(),
    current = project();
  current.storey.lines![0]!.color = "#112233";
  const raw = JSON.stringify({ version: 1, current: snapshot(current), previous: snapshot(old) });
  const m = memory(raw),
    c = codec();
  assert.equal((await migrateRecoveryV1(m.port, current.id, c)).status, "migrated");
  assert.equal(m.state.legacy, raw);
  assert.equal(m.state.writes, 1);
  const q = await restoreRecoveryV2(m.state.record, current.id, c);
  assert.deepEqual(q.project, JSON.parse(serializeProject(current)));
  assert.ok(q.project.assets.every(Object.isFrozen));
  const record = m.state.record as RecoveryRecordV2;
  assert.deepEqual(await c.restore(record.previous!.document), JSON.parse(serializeProject(old)));
  assert.equal((await migrateRecoveryV1(m.port, current.id, c)).status, "existing");
  assert.equal(m.state.writes, 1);
});
test("invalid V1 current migrates last valid previous; no valid snapshot publishes nothing", async () => {
  const p = project(),
    c = codec();
  const m = memory(
    JSON.stringify({ version: 1, current: { json: "broken" }, previous: snapshot(p) }),
  );
  await migrateRecoveryV1(m.port, p.id, c);
  assert.equal((m.state.record as RecoveryRecordV2).previous, undefined);
  const bad = memory(JSON.stringify({ version: 1, current: { json: "broken" } }));
  await assert.rejects(migrateRecoveryV1(bad.port, p.id, c), /No valid/);
  assert.equal(bad.state.writes, 0);
});
test("unknown versions and foreign project contexts never overwrite storage", async () => {
  const p = project();
  for (const raw of [
    JSON.stringify({ version: 3 }),
    JSON.stringify({ version: 1, current: snapshot() }),
  ]) {
    const m = memory(raw);
    await assert.rejects(migrateRecoveryV1(m.port, "foreign", codec()));
    assert.equal(m.state.record, null);
    assert.equal(m.state.legacy, raw);
  }
  const m = memory(JSON.stringify({ version: 1, current: snapshot(p) }));
  m.state.record = { version: 99 };
  await assert.rejects(migrateRecoveryV1(m.port, p.id, codec()), /Unsupported/);
  assert.equal(m.state.writes, 0);
});
test("CAS conflicts and failed atomic publication retain both old records", async () => {
  const p = project(),
    raw = JSON.stringify({ version: 1, current: snapshot(p) });
  for (const mode of ["legacy", "head", "failure"]) {
    const m = memory(raw);
    m.state.beforeCommit = () => {
      if (mode === "legacy") m.state.legacy = raw + " ";
      if (mode === "head") m.state.record = { version: 2, revision: "concurrent" };
      if (mode === "failure") m.state.fail = true;
    };
    await assert.rejects(migrateRecoveryV1(m.port, p.id, codec()), /conflict|disk full/);
    assert.equal(m.state.writes, 0);
    assert.equal(m.state.legacy, mode === "legacy" ? raw + " " : raw);
    assert.deepEqual(
      m.state.record,
      mode === "head" ? { version: 2, revision: "concurrent" } : null,
    );
  }
});
test("abort before read, during checked restore and at publication never reports migration", async () => {
  const p = project(),
    raw = JSON.stringify({ version: 1, current: snapshot(p) });
  for (const mode of ["before", "restore", "publish"]) {
    const m = memory(raw),
      c = codec(),
      controller = new AbortController();
    if (mode === "before") controller.abort();
    if (mode === "publish") m.state.beforeCommit = () => controller.abort();
    const wrapped = {
      ...c,
      restore: async (...args: Parameters<typeof c.restore>) => {
        const result = await c.restore(...args);
        if (mode === "restore") controller.abort();
        return result;
      },
    };
    await assert.rejects(migrateRecoveryV1(m.port, p.id, wrapped, controller.signal), {
      name: "AbortError",
    });
    assert.equal(m.state.writes, 0);
    assert.equal(m.state.legacy, raw);
  }
});
test("V2 rejects corrupt/missing images, uses checked predecessor, never fallback on abort", async () => {
  const p = project(),
    c = codec(),
    m = memory(JSON.stringify({ version: 1, current: snapshot(p), previous: snapshot(p) }));
  await migrateRecoveryV1(m.port, p.id, c);
  for (const mode of ["missing", "corrupt", "model"]) {
    const r = structuredClone(m.state.record) as RecoveryRecordV2;
    const key = r.current.document.model.assets[0]!.key;
    if (mode === "missing") r.current.document.blobs = {};
    if (mode === "corrupt")
      r.current.document.blobs = { [key]: { ...r.current.document.blobs[key]!, data: "AAAA" } };
    if (mode === "model") r.current.document.model.id = "foreign";
    assert.equal((await restoreRecoveryV2(r, p.id, c)).fallback, true);
    delete r.previous;
    await assert.rejects(restoreRecoveryV2(r, p.id, c));
  }
  const controller = new AbortController();
  let calls = 0;
  const wrapped = {
    ...c,
    restore: async () => {
      calls++;
      controller.abort();
      throw new Error("stopped");
    },
  };
  await assert.rejects(restoreRecoveryV2(m.state.record, p.id, wrapped, controller.signal), {
    name: "AbortError",
  });
  assert.equal(calls, 1);
});
test("failed migration verification does not publish even when preparation returned a document", async () => {
  const p = project(),
    m = memory(JSON.stringify({ version: 1, current: snapshot(p) })),
    c = codec();
  const broken = { ...c, prepare: async () => ({ ...(await c.prepare(p)), blobs: {} }) };
  await assert.rejects(migrateRecoveryV1(m.port, p.id, broken), /Missing asset/);
  assert.equal(m.state.writes, 0);
});
test("empty recovery stays empty", async () => {
  const m = memory(null);
  assert.equal((await migrateRecoveryV1(m.port, "project", codec())).status, "empty");
  assert.equal(m.state.writes, 0);
});

test("a late abort after committed publication still reports success", async () => {
  const p = project(),
    m = memory(JSON.stringify({ version: 1, current: snapshot(p) }));
  const controller = new AbortController();
  const port: RecoveryV2Storage = {
    ...m.port,
    publish: async (...args) => {
      await m.port.publish(...args);
      controller.abort();
    },
  };
  assert.equal(
    (await migrateRecoveryV1(port, p.id, codec(), controller.signal)).status,
    "migrated",
  );
  assert.equal(m.state.writes, 1);
});
