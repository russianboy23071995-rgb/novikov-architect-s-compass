import { test } from "node:test";
import assert from "node:assert/strict";
import {
  createRecoveryMaintenance,
  type MaintenanceState,
  type RetentionResult,
} from "./recovery-maintenance.ts";
const collected = { status: "collected", deleted: 2, retained: 3 } as const;
test("maintenance is explicit and serial, without retries", async () => {
  const states: MaintenanceState[] = [];
  let calls = 0,
    finish!: (value: RetentionResult) => void;
  const action = createRecoveryMaintenance(
    {
      collect: () => {
        calls++;
        return new Promise((r) => (finish = r));
      },
    },
    (s) => states.push(s),
  );
  assert.equal(calls, 0);
  const first = action.run();
  await action.run();
  assert.equal(calls, 1);
  finish(collected);
  await first;
  assert.equal(states.at(-1)?.status, "success");
  const second = action.run();
  assert.equal(calls, 2);
  finish(collected);
  await second;
});
test("abort forwards signal and committed success wins over late cancellation", async () => {
  const states: MaintenanceState[] = [];
  let signal!: AbortSignal, finish!: (value: RetentionResult) => void;
  const action = createRecoveryMaintenance(
    {
      collect: (s) => {
        signal = s;
        return new Promise((r) => (finish = r));
      },
    },
    (s) => states.push(s),
  );
  const pending = action.run();
  action.cancel();
  assert.equal(signal.aborted, true);
  finish(collected);
  await pending;
  assert.equal(states.at(-1)?.status, "success");
});
test("abort and quota failure have distinct outcomes and never retry", async () => {
  for (const [name, status] of [
    ["AbortError", "cancelled"],
    ["QuotaExceededError", "error"],
    ["UnknownError", "error"],
  ] as const) {
    let calls = 0;
    const states: MaintenanceState[] = [];
    const action = createRecoveryMaintenance(
      {
        collect: async () => {
          calls++;
          throw new DOMException("test", name);
        },
      },
      (s) => states.push(s),
    );
    await action.run();
    assert.equal(calls, 1);
    assert.equal(states.at(-1)?.status, status);
    if (name === "QuotaExceededError") assert.match(states.at(-1)!.message, /Speichergrenze/);
  }
});
test("disposal aborts pending work and suppresses stale presentation", async () => {
  const states: MaintenanceState[] = [];
  let signal!: AbortSignal, finish!: (v: RetentionResult) => void;
  const action = createRecoveryMaintenance(
    {
      collect: (s) => {
        signal = s;
        return new Promise((r) => (finish = r));
      },
    },
    (s) => states.push(s),
  );
  const pending = action.run();
  action.dispose();
  assert.equal(signal.aborted, true);
  finish(collected);
  await pending;
  await action.run();
  assert.equal(states.length, 1);
});
test("skipped unsafe roots are reported without success or automatic retry", async () => {
  for (const reason of ["unreadable-roots", "changed-roots", "unreadable-legacy"] as const) {
    const states: MaintenanceState[] = [];
    let calls = 0;
    const action = createRecoveryMaintenance(
      {
        collect: async () => {
          calls++;
          return { status: "skipped", reason };
        },
      },
      (s) => states.push(s),
    );
    await action.run();
    assert.equal(calls, 1);
    assert.equal(states.at(-1)?.status, "skipped");
  }
});
test("presentation failure cannot change committed storage outcome", async () => {
  let calls = 0;
  const action = createRecoveryMaintenance(
    {
      collect: async () => {
        calls++;
        return collected;
      },
    },
    () => {
      throw Error("observer");
    },
  );
  await action.run();
  await action.run();
  assert.equal(calls, 2);
});
