import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../src/lib/bim/model.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import {
  createPreparation,
  openPilotDatabase,
  readCheckpoint,
  restoreCheckedSnapshot,
} from "./asset-recovery-store.ts";
import { restoreProject, verifyPayload, payloadKey } from "./asset-contract.ts";
import { recoveryFixture } from "./recovery-capacity-fixture.ts";
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=";
const asset = () => ({
  id: "a",
  mimeType: "image/png" as const,
  pixelWidth: 1,
  pixelHeight: 1,
  data: png,
});

test("checked snapshot preserves separate logical IDs and trusted handle identities", async () => {
  const p = recoveryFixture("handles", 1);
  p.assets.push(asset(), { ...asset(), id: "b" });
  const doc = await createPreparation().prepare(p);
  let hashes = 0;
  const q = await restoreCheckedSnapshot(doc, {
    measure: (name) => {
      if (name === "hash") hashes++;
    },
  });
  assert.deepEqual(q, validateProject(p));
  assert.equal(hashes, 1);
  assert.deepEqual(
    q.assets.map((a) => a.id),
    ["a", "b"],
  );
  assert.notEqual(q.assets[0], q.assets[1]);
  assert.ok(q.assets.every(Object.isFrozen));
  assert.equal(validateProject(q).assets[0], q.assets[0]);
});

test("checked snapshot rejects missing/corrupt payloads and invalid model references", async () => {
  const p = recoveryFixture("bad", 1);
  p.assets.push(asset());
  const doc = await createPreparation().prepare(p);
  await assert.rejects(() => restoreCheckedSnapshot({ ...doc, blobs: {} }), /Missing asset/);
  const key = doc.model.assets[0]!.key;
  await assert.rejects(
    () =>
      restoreCheckedSnapshot({
        ...doc,
        blobs: { [key]: { ...doc.blobs[key]!, data: png.replace("42mP8", "42mP9") } },
      }),
    /integrity mismatch/,
  );
  const bad = structuredClone(doc);
  bad.model.storey.lines![0]!.layerId = "missing-layer";
  await assert.rejects(() => restoreCheckedSnapshot(bad));
});

test("checked handles never escape cancellation during preparation or after model validation", async () => {
  const p = recoveryFixture("abort", 1);
  p.assets.push(asset());
  const doc = await createPreparation().prepare(p);
  for (const when of ["handles", "model"]) {
    const controller = new AbortController();
    await assert.rejects(
      () =>
        restoreCheckedSnapshot(doc, {
          signal: controller.signal,
          measure: (name) => {
            if (name === when) controller.abort();
          },
        }),
      { name: "AbortError" },
    );
  }
});

test("read checkpoint yields a task and observes cancellation before and after scheduling", async () => {
  let timerRan = false;
  setTimeout(() => {
    timerRan = true;
  }, 0);
  await readCheckpoint({});
  assert.equal(timerRan, true);
  const before = new AbortController();
  before.abort();
  let calls = 0;
  await assert.rejects(
    () =>
      readCheckpoint({
        signal: before.signal,
        schedule: async () => {
          calls++;
        },
      }),
    { name: "AbortError" },
  );
  assert.equal(calls, 0);
  const during = new AbortController();
  await assert.rejects(
    () =>
      readCheckpoint({
        signal: during.signal,
        schedule: async () => {
          during.abort();
        },
      }),
    { name: "AbortError" },
  );
});

test("shared decoder keeps exact payload and content key; both paths reject malformed ingress", async () => {
  const { id: _id, ...raw } = asset();
  const old = verifyPayload(raw, { legacy: true });
  const current = verifyPayload(raw);
  assert.deepEqual(current, old);
  assert.equal(await payloadKey(current), await payloadKey(old));
  for (const bad of [
    { ...raw, data: "!invalid!" },
    { ...raw, pixelHeight: 2 },
    { ...raw, mimeType: "image/jpeg" },
    { ...raw, data: btoa("not an image") },
    { ...raw, extra: true },
  ])
    for (const legacy of [true, false]) assert.throws(() => verifyPayload(bad, { legacy }));
});

test("prepared immutable images survive model revisions without rehashing", async () => {
  const p = recoveryFixture("p", 1);
  p.assets.push(createImageAssetHandle(asset()));
  const prep = createPreparation();
  const first = await prep.prepare(p);
  const changed = validateProject({
    ...p,
    storey: { ...p.storey, lines: p.storey.lines!.map((line) => ({ ...line, color: "#998877" })) },
  });
  const second = await prep.prepare(changed);
  assert.equal(prep.hashes, 1);
  assert.equal(second.blobs[second.model.assets[0]!.key], first.blobs[first.model.assets[0]!.key]);
  assert.deepEqual(restoreProject(second), changed);
  assert.equal(first.model.storey.lines![0]!.color, "#334455");
});

test("mutable external asset identity cannot reuse a stale content key", async () => {
  const p = createProject("p", "s"),
    raw = asset();
  p.assets.push(raw);
  const prep = createPreparation(),
    first = await prep.prepare(p);
  raw.data = png.replace("42mP8", "42mP9");
  const second = await prep.prepare(p);
  assert.notEqual(first.model.assets[0]!.key, second.model.assets[0]!.key);
  assert.equal(restoreProject(first).assets[0]!.data, png);
  assert.equal(restoreProject(second).assets[0]!.data, raw.data);
});

test("pilot rejects header mismatches and cannot open production databases", async () => {
  const p = createProject("p", "s");
  p.assets.push({ ...asset(), pixelWidth: 2 });
  await assert.rejects(() => createPreparation().prepare(p));
  assert.throws(() => openPilotDatabase("novikov-production"), /Diagnostic database only/);
});

test("recovery string headers preserve payload acceptance and exact failures of the byte path", () => {
  const result = (raw: unknown, legacy: boolean) => {
    try {
      return verifyPayload(raw, { legacy });
    } catch (error) {
      return { error: (error as Error).name, message: (error as Error).message };
    }
  };
  const png = [
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 100, 0, 0, 0, 50,
  ];
  const originals = [
    png,
    ...[192, 193, 194].map((m) => [255, 216, 255, m, 0, 8, 8, 0, 50, 0, 100, 0]),
  ];
  for (const original of originals) {
    const mimeType = original === png ? "image/png" : "image/jpeg";
    const valid = {
      mimeType,
      pixelWidth: 100,
      pixelHeight: 50,
      data: btoa(String.fromCharCode(...original)),
    };
    assert.deepEqual(verifyPayload(valid), valid);
    const cases = [original];
    for (let i = 0; i < original.length; i++) {
      cases.push(original.slice(0, i));
      for (const value of [0, 1, 255]) {
        const bytes = [...original];
        bytes[i] = value;
        cases.push(bytes);
      }
    }
    for (const bytes of cases) {
      const raw = { ...valid, data: btoa(String.fromCharCode(...bytes)) };
      assert.deepEqual(result(raw, false), result(raw, true));
    }
    for (const raw of [
      { ...valid, pixelWidth: 99 },
      { ...valid, pixelHeight: 51 },
      { ...valid, mimeType: mimeType === "image/png" ? "image/jpeg" : "image/png" },
      { ...valid, data: "!invalid!" },
      { ...valid, extra: 1 },
      { ...valid, data: valid.data + "\n" },
    ]) {
      assert.throws(() => verifyPayload(raw));
      assert.deepEqual(result(raw, false), result(raw, true));
    }
  }
});
