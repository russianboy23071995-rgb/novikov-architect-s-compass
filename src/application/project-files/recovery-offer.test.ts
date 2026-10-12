import assert from "node:assert/strict";
import test from "node:test";
import { startRecoveryOffer, type RecoveryOffer } from "./recovery-offer.ts";
import type { RecoveryStorage } from "./recovery.ts";
import type { RecoveryCatalog } from "./recovery-catalog.ts";
const catalog = (legacy: RecoveryStorage): RecoveryCatalog => ({
  legacy,
  project: () => legacy,
  list: async () => [],
});
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { serializeProject } from "../../lib/bim/model.ts";

const raw = JSON.stringify({
  version: 1,
  current: { savedAt: "2026-10-10T12:00:00Z", json: serializeProject(createExampleProject()) },
});
const noWrites = async () => {
  assert.fail("Startup must never write to recovery storage");
};

test("startup offers a validated snapshot without publishing it or writing storage", async () => {
  const offers: RecoveryOffer[] = [];
  await startRecoveryOffer(catalog({ read: async () => raw, replace: noWrites }), (o) =>
    offers.push(o),
  ).done;
  assert.equal(offers.length, 1);
  assert.equal(offers[0]?.kind, "available");
  if (offers[0]?.kind === "available") assert.equal(offers[0].projects[0]?.projectId, "project-1");
});

test("missing, corrupt and unavailable storage settle without blocking startup", async () => {
  for (const [read, kind] of [
    [async () => null, "empty"],
    [async () => "{broken", "unavailable"],
    [
      async () => {
        throw new Error("Storage blocked");
      },
      "unavailable",
    ],
  ] as const) {
    const offers: RecoveryOffer[] = [];
    await startRecoveryOffer(catalog({ read, replace: noWrites }), (o) => offers.push(o)).done;
    assert.equal(offers[0]?.kind, kind);
  }
});

test("disposing after project switch or unmount discards a delayed successful read", async () => {
  let resolve!: (value: string) => void;
  const storage: RecoveryStorage = {
    read: () =>
      new Promise((r) => {
        resolve = r;
      }),
    replace: noWrites,
  };
  const offers: RecoveryOffer[] = [];
  const query = startRecoveryOffer(catalog(storage), (o) => offers.push(o));
  query.dispose();
  await Promise.resolve();
  resolve(raw);
  await query.done;
  assert.deepEqual(offers, []);
});

test("disposing also suppresses late errors and permits a fresh mount query", async () => {
  let reject!: (error: Error) => void;
  const offers: RecoveryOffer[] = [];
  const old = startRecoveryOffer(
    catalog({
      read: () =>
        new Promise((_r, fail) => {
          reject = fail;
        }),
      replace: noWrites,
    }),
    (o) => offers.push(o),
  );
  old.dispose();
  await startRecoveryOffer(catalog({ read: async () => raw, replace: noWrites }), (o) =>
    offers.push(o),
  ).done;
  reject(new Error("late failure"));
  await old.done;
  assert.equal(offers.length, 1);
  assert.equal(offers[0]?.kind, "available");
});
