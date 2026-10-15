import test from "node:test";
import assert from "node:assert/strict";
import { createRecoverySession } from "./recovery-session.ts";
import { createBoundedRecoveryCodec } from "../../interop/project-file/recovery-codec.ts";
import type { RecoveryCatalog } from "./recovery-catalog.ts";
import type { RecoveryRecordV2 } from "./recovery-v2.ts";
import type { RetentionResult } from "./recovery-maintenance.ts";
import { recoveryFixture } from "../../../benchmarks/recovery-capacity-fixture.ts";
const ok = { status: "collected", deleted: 1, retained: 2 } as const;
async function flush() {
  for (let i = 0; i < 100; i++) await Promise.resolve();
}
function setup() {
  let now = 0,
    seq = 0,
    writes = 0,
    fail = false;
  const jobs = new Map<number, { at: number; callback: () => void }>();
  const clock = {
    now: () => now,
    schedule(callback: () => void, delay: number) {
      const id = ++seq;
      jobs.set(id, { at: now + delay, callback });
      return () => {
        jobs.delete(id);
      };
    },
  };
  const records = new Map<string, RecoveryRecordV2>();
  const catalog: RecoveryCatalog = {
    legacy: { read: async () => null, replace: async () => {} },
    list: async () => [],
    project: () => ({ read: async () => null, replace: async () => {} }),
    v2: {
      codec: createBoundedRecoveryCodec({
        modelBytes: 1024 * 1024,
        payloadBytes: 1024 * 1024,
        pixels: 1000,
      }),
      project: (id) => ({
        read: async () => ({ legacy: null, record: records.get(id) ?? null }),
        publish: async (_expected, next) => {
          if (fail) throw Error("disk full");
          records.set(id, next);
          writes++;
        },
      }),
    },
  };
  const calls: {
    signal: AbortSignal;
    resolve: (value: RetentionResult) => void;
    reject: (error: Error) => void;
  }[] = [];
  const session = createRecoverySession(
    catalog,
    {
      collect: (signal) =>
        new Promise((resolve, reject) => calls.push({ signal, resolve, reject })),
    },
    () => {},
    () => {},
    clock,
    true,
  );
  const project = recoveryFixture("integration", 2);
  session.update(project, 1);
  return {
    session,
    project,
    calls,
    writes: () => writes,
    fail: () => {
      fail = true;
    },
    async tick(ms: number) {
      now += ms;
      for (const [id, j] of [...jobs])
        if (j.at <= now) {
          jobs.delete(id);
          j.callback();
        }
      await flush();
    },
  };
}
test("V2 commit arms maintenance; no-op and failed saves do not", async () => {
  const s = setup();
  await s.tick(2000);
  assert.equal(s.writes(), 1);
  await s.tick(30000);
  assert.equal(s.calls.length, 1);
  s.calls[0]!.resolve(ok);
  await flush();
  s.session.update({ ...s.project }, 1);
  await s.tick(2000);
  assert.equal(s.writes(), 1);
  await s.tick(600000);
  assert.equal(s.calls.length, 1);
  s.fail();
  await assert.rejects(s.session.saveNow(), /disk full/);
  await s.tick(600000);
  assert.equal(s.calls.length, 1);
  s.session.dispose();
});
test("save aborts running maintenance; manual and automatic use one flight", async () => {
  const s = setup();
  await s.tick(2000);
  await s.tick(30000);
  void s.session.runMaintenance();
  assert.equal(s.calls.length, 1);
  await s.session.saveNow();
  assert.equal(s.calls[0]!.signal.aborted, true);
  assert.equal(s.writes(), 2);
  s.calls[0]!.reject(new DOMException("abort", "AbortError"));
  await flush();
  await s.tick(300000);
  assert.equal(s.calls.length, 2);
  s.calls[1]!.resolve(ok);
  await flush();
  s.session.dispose();
});
test("dialog busy and workspace gesture holds are independent and survive dialog closure", async () => {
  const s = setup();
  s.session.hold("workspace", true);
  s.session.hold("recovery-dialog", true);
  await s.tick(2000);
  await s.tick(30000);
  assert.equal(s.calls.length, 0);
  s.session.hold("recovery-dialog", false);
  await s.tick(30000);
  assert.equal(s.calls.length, 0);
  s.session.hold("workspace", false);
  await s.tick(29999);
  assert.equal(s.calls.length, 0);
  await s.tick(1);
  assert.equal(s.calls.length, 1);
  s.calls[0]!.resolve(ok);
  await flush();
  s.session.dispose();
});
test("context switch and opt-out cancel old pending maintenance", async () => {
  const s = setup();
  await s.tick(2000);
  s.session.setEnabled(false);
  await s.tick(600000);
  assert.equal(s.calls.length, 0);
  s.session.update({ ...s.project, id: "other" }, 2);
  await s.tick(600000);
  assert.equal(s.calls.length, 0);
  s.session.setEnabled(true);
  await s.tick(2000);
  await s.tick(30000);
  assert.equal(s.calls.length, 1);
  s.calls[0]!.resolve(ok);
  await flush();
  s.session.dispose();
});
