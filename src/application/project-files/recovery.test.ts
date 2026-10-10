import assert from "node:assert/strict";
import test from "node:test";
import { readRecovery, saveRecovery, type RecoveryStorage } from "./recovery.ts";
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
