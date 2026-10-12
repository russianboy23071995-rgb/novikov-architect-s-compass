import assert from "node:assert/strict";
import test from "node:test";
import {
  prepareRecoveryWriter,
  readRecovery,
  saveRecovery,
  type RecoveryStorage,
} from "./recovery.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { serializeProject } from "../../lib/bim/model.ts";

function memory() {
  let raw: string | null = null;
  let failure = "";
  const port: RecoveryStorage = {
    read: async () => raw,
    replace: async (expected, next) => {
      if (failure) throw new Error(failure);
      if (raw !== expected) throw new Error("conflict");
      raw = next;
    },
  };
  return {
    port,
    get: () => raw,
    corrupt: (text: string) => {
      raw = text;
    },
    fail: (message: string) => {
      failure = message;
    },
  };
}
const instant = new Date("2026-10-10T12:00:00Z");

test("prepared writer produces byte-identical snapshots to full path, including fallback", async () => {
  const project = createExampleProject();
  for (const fallback of [false, true]) {
    const full = memory(),
      prepared = memory();
    await saveRecovery(project, full.port, instant);
    if (fallback) {
      const record = JSON.parse(full.get()!);
      full.corrupt(
        JSON.stringify({
          version: 1,
          current: { savedAt: instant.toISOString(), json: "broken" },
          previous: record.current,
        }),
      );
    }
    prepared.corrupt(full.get()!);
    let reads = 0;
    const writer = await prepareRecoveryWriter(
      {
        ...prepared.port,
        read: async () => {
          reads++;
          return prepared.port.read();
        },
      },
      project.id,
    );
    for (const height of [3, 4, 5]) {
      const next = {
        ...project,
        storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height })) },
      };
      await saveRecovery(next, full.port, instant);
      await writer.save(next, () => true, instant);
      assert.equal(prepared.get(), full.get());
    }
    assert.equal(reads, 1);
  }
});

test("prepared revision does not advance after failed publication or stale context", async () => {
  const project = createExampleProject(),
    store = memory();
  await saveRecovery(project, store.port, instant);
  const initial = store.get();
  const writer = await prepareRecoveryWriter(store.port, project.id);
  for (const reason of ["QuotaExceededError", "AbortError"]) {
    store.fail(reason);
    await assert.rejects(
      writer.save(project, () => true, instant),
      new RegExp(reason),
    );
    assert.equal(store.get(), initial);
  }
  store.fail("");
  await assert.rejects(
    writer.save(project, () => false, instant),
    /abgebrochen/,
  );
  assert.equal(store.get(), initial);
  await writer.save(project, () => true, instant);
  assert.deepEqual(JSON.parse(store.get()!).previous, JSON.parse(initial!).current);
});

test("prepared writer rejects unknown corruption, wrong identity and invalid new geometry", async () => {
  const project = createExampleProject(),
    store = memory();
  store.corrupt("broken");
  await assert.rejects(prepareRecoveryWriter(store.port, project.id));
  store.corrupt(
    JSON.stringify({
      version: 1,
      current: { savedAt: instant.toISOString(), json: serializeProject(project) },
    }),
  );
  await assert.rejects(prepareRecoveryWriter(store.port, "another"), /anderen Projekt/);
  const writer = await prepareRecoveryWriter(store.port, project.id),
    before = store.get();
  await assert.rejects(
    writer.save({ ...project, id: "another" }, () => true),
    /Projektkontext/,
  );
  const invalid = {
    ...project,
    storey: { ...project.storey, walls: project.storey.walls.map((w) => ({ ...w, height: -1 })) },
  };
  await assert.rejects(writer.save(invalid, () => true));
  assert.equal(store.get(), before);
});

test("prepared writers keep exact CAS bytes after foreign publication", async () => {
  const project = createExampleProject(),
    store = memory();
  const a = await prepareRecoveryWriter(store.port, project.id);
  const b = await prepareRecoveryWriter(store.port, project.id);
  await a.save(project, () => true, instant);
  const winner = store.get();
  await assert.rejects(
    b.save(project, () => true, instant),
    /conflict/,
  );
  assert.equal(store.get(), winner);
  await a.save(project, () => true, instant);
  assert.equal(JSON.parse(store.get()!).previous.json, serializeProject(project));
});

test("prepared writer cannot publish two simultaneous writes", async () => {
  const project = createExampleProject(),
    store = memory();
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const writer = await prepareRecoveryWriter(
    {
      ...store.port,
      replace: async (a, b) => {
        await gate;
        await store.port.replace(a, b);
      },
    },
    project.id,
  );
  const pending = writer.save(project, () => true, instant);
  await assert.rejects(
    writer.save(project, () => true, instant),
    /läuft bereits/,
  );
  assert.equal(store.get(), null);
  release();
  await pending;
  assert.ok(store.get());
});

test("empty store and explicit snapshot roundtrip retain portable model data", async () => {
  const store = memory();
  assert.equal(await readRecovery(store.port), null);
  const project = createExampleProject();
  await saveRecovery(project, store.port, instant);
  const recovered = await readRecovery(store.port);
  assert.equal(recovered?.savedAt, instant.toISOString());
  assert.deepEqual(recovered?.project.storey, project.storey);
  assert.equal(recovered?.fallback, false);
});

test("quota failure and aborted writes preserve last valid record", async () => {
  const store = memory();
  const project = createExampleProject();
  await saveRecovery(project, store.port, instant);
  const before = store.get();
  for (const failure of ["QuotaExceededError", "AbortError"]) {
    store.fail(failure);
    await assert.rejects(
      saveRecovery({ ...project, id: "later" }, store.port),
      new RegExp(failure),
    );
    assert.equal(store.get(), before);
    assert.equal((await readRecovery(store.port))?.project.id, project.id);
  }
});

test("invalid incoming model never reaches storage publication", async () => {
  const store = memory();
  const project = createExampleProject();
  await saveRecovery(project, store.port, instant);
  const before = store.get();
  await assert.rejects(
    saveRecovery({ ...project, unit: "mm" } as unknown as typeof project, store.port),
  );
  assert.equal(store.get(), before);
});

test("damaged current model falls back to validated predecessor without modifying storage", async () => {
  const store = memory();
  const project = createExampleProject();
  await saveRecovery(project, store.port, instant);
  await saveRecovery({ ...project, id: "later" }, store.port);
  const record = JSON.parse(store.get()!);
  record.current.json = "{broken";
  store.corrupt(JSON.stringify(record));
  const before = store.get();
  const recovered = await readRecovery(store.port);
  assert.equal(recovered?.fallback, true);
  assert.equal(recovered?.project.id, project.id);
  assert.equal(store.get(), before);
  await saveRecovery({ ...project, id: "third" }, store.port);
  assert.equal(JSON.parse(JSON.parse(store.get()!).previous.json).id, project.id);
});

test("unreadable envelope is not silently overwritten", async () => {
  const store = memory();
  store.corrupt("{broken");
  await assert.rejects(readRecovery(store.port));
  await assert.rejects(saveRecovery(createExampleProject(), store.port));
  assert.equal(store.get(), "{broken");
});

test("competing writers cannot overwrite a snapshot based on a stale read", async () => {
  const store = memory();
  const project = createExampleProject();
  const results = await Promise.allSettled([
    saveRecovery(project, store.port),
    saveRecovery({ ...project, id: "other" }, store.port),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.ok(await readRecovery(store.port));
});

test("preparation and cancellation do not mutate live model; confirmation uses shared load/undo", async () => {
  const store = memory();
  const state = createEditingState(createExampleProject());
  const before = JSON.stringify(state);
  await saveRecovery({ ...state.history.present, id: "recovered" }, store.port);
  const candidate = (await readRecovery(store.port))!;
  assert.equal(JSON.stringify(state), before);
  const next = editingReducer(state, { type: "load-project", project: candidate.project });
  assert.equal(next.projectLoad?.accepted, true);
  assert.equal(next.history.present.id, "recovered");
  assert.equal(
    serializeProject(editingReducer(next, { type: "undo" }).history.present),
    serializeProject(state.history.present),
  );
});
