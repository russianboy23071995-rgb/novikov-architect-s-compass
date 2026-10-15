import { test } from "node:test";
import assert from "node:assert/strict";
import { createMaintenanceCoordinator, type MaintenanceClock } from "./maintenance-coordinator.ts";
import type { RetentionResult } from "./recovery-maintenance.ts";
const ok = { status: "collected", deleted: 1, retained: 2 } as const;
const ready = { enabled: true, healthy: true, visible: true, busy: false };
function fixture() {
  let now = 0;
  const timers = new Map<number, { at: number; callback: () => void }>();
  let id = 0;
  const clock: MaintenanceClock = {
    now: () => now,
    schedule(callback, delay) {
      const key = ++id;
      timers.set(key, { at: now + delay, callback });
      return () => {
        timers.delete(key);
      };
    },
  };
  const calls: {
    signal: AbortSignal;
    resolve: (r: RetentionResult) => void;
    reject: (e: Error) => void;
  }[] = [];
  const c = createMaintenanceCoordinator(
    {
      collect: (signal) =>
        new Promise((resolve, reject) => calls.push({ signal, resolve, reject })),
    },
    () => {},
    clock,
  );
  async function tick(ms: number) {
    now += ms;
    for (const [key, t] of [...timers])
      if (t.at <= now) {
        timers.delete(key);
        t.callback();
      }
    await flush();
  }
  return { c, calls, tick, timers };
}
async function flush() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}
const abort = () => new DOMException("cancelled", "AbortError");
test("no work without committed signal; coalescing waits thirty seconds", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  await tick(300000);
  assert.equal(calls.length, 0);
  c.committed();
  await tick(29000);
  c.committed();
  await tick(29000);
  assert.equal(calls.length, 0);
  await tick(1000);
  assert.equal(calls.length, 1);
  calls[0]!.resolve(ok);
  await flush();
  await tick(600000);
  assert.equal(calls.length, 1);
});
test("activity cancels, cooldown and only one retry per generation", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  c.committed();
  await tick(30000);
  c.activity();
  assert.equal(calls[0]!.signal.aborted, true);
  calls[0]!.reject(abort());
  await flush();
  await tick(299999);
  assert.equal(calls.length, 1);
  await tick(1);
  assert.equal(calls.length, 2);
  c.activity();
  calls[1]!.reject(abort());
  await flush();
  await tick(600000);
  assert.equal(calls.length, 2);
  c.committed();
  await tick(30000);
  assert.equal(calls.length, 3);
});
test("save priority aborts but does not release single-flight until settlement", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  c.committed();
  await tick(30000);
  c.update({ ...ready, busy: true });
  assert.equal(calls[0]!.signal.aborted, true);
  void c.runManual();
  assert.equal(calls.length, 1);
  c.update(ready);
  void c.runManual();
  assert.equal(calls.length, 1);
  calls[0]!.reject(abort());
  await flush();
  void c.runManual();
  assert.equal(calls.length, 2);
  calls[1]!.resolve(ok);
  await flush();
});
test("changed roots gets one delayed retry, unreadable roots latch until manual success", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  c.committed();
  await tick(30000);
  calls[0]!.resolve({ status: "skipped", reason: "changed-roots" });
  await flush();
  await tick(300000);
  calls[1]!.resolve({ status: "skipped", reason: "unreadable-roots" });
  await flush();
  c.committed();
  await tick(600000);
  assert.equal(calls.length, 2);
  const manual = c.runManual();
  calls[2]!.resolve(ok);
  await manual;
  c.committed();
  await tick(30000);
  assert.equal(calls.length, 4);
});
test("new generation survives late committed success after activity abort", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  c.committed();
  await tick(30000);
  c.activity();
  c.committed();
  calls[0]!.resolve(ok);
  await flush();
  await tick(300000);
  assert.equal(calls.length, 2);
});
test("context switch discards old demand and stale completion; new demand still runs", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  c.committed();
  await tick(30000);
  c.contextChanged();
  calls[0]!.reject(new Error("old failure"));
  await flush();
  await tick(600000);
  assert.equal(calls.length, 1);
  c.committed();
  await tick(30000);
  assert.equal(calls.length, 2);
});
test("manual cancel suppresses automatic retry and manual calls share storage", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  c.committed();
  const first = c.runManual();
  void c.runManual();
  assert.equal(calls.length, 1);
  c.cancel();
  calls[0]!.reject(abort());
  await first;
  await tick(600000);
  assert.equal(calls.length, 1);
});
test("disabled, hidden, unhealthy and busy prevent automatic starts", async () => {
  for (const condition of [
    { enabled: false },
    { visible: false },
    { healthy: false },
    { busy: true },
  ]) {
    const { c, calls, tick } = fixture();
    c.update({ ...ready, ...condition });
    c.committed();
    await tick(600000);
    assert.equal(calls.length, 0);
    c.update(ready);
    await tick(29999);
    assert.equal(calls.length, 0);
    await tick(1);
    assert.equal(calls.length, 1);
  }
});
test("storage errors latch; dispose prevents timers and late notification", async () => {
  const { c, calls, tick, timers } = fixture();
  c.update(ready);
  c.committed();
  await tick(30000);
  calls[0]!.reject(new DOMException("full", "QuotaExceededError"));
  await flush();
  c.committed();
  await tick(600000);
  assert.equal(calls.length, 1);
  void c.runManual();
  c.dispose();
  assert.equal(calls[1]!.signal.aborted, true);
  calls[1]!.resolve(ok);
  await flush();
  await tick(600000);
  assert.equal(timers.size, 0);
  assert.equal(calls.length, 2);
});

test("closing dialog only cancels its manual run, not later automatic work", async () => {
  const { c, calls, tick } = fixture();
  c.update(ready);
  const manual = c.runManual();
  calls[0]!.resolve(ok);
  await manual;
  c.committed();
  await tick(30000);
  c.closeManual();
  assert.equal(calls[1]!.signal.aborted, false);
  calls[1]!.resolve(ok);
  await flush();
  const next = c.runManual();
  c.closeManual();
  assert.equal(calls[2]!.signal.aborted, true);
  calls[2]!.reject(abort());
  await next;
});
