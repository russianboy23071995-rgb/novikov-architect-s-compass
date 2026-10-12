import assert from "node:assert/strict";
import test from "node:test";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { createEditingState } from "../direct-edit/controller.ts";
import {
  listRecoveryProjects,
  migrateLegacyRecovery,
  queryRecoveryProjects,
  readProjectRecovery,
  saveProjectRecovery,
  type RecoveryCatalog,
} from "./recovery-catalog.ts";
import { saveRecovery, type RecoveryStorage } from "./recovery.ts";

function memory() {
  const records = new Map<string, string>();
  const failures = new Set<string>();
  function port(id: string): RecoveryStorage {
    return {
      read: async () => records.get(id) ?? null,
      replace: async (expected, next) => {
        if (failures.has(id)) throw new Error("Quota/abort");
        if ((records.get(id) ?? null) !== expected) throw new Error("conflict");
        records.set(id, next);
      },
    };
  }
  const catalog: RecoveryCatalog = {
    legacy: port("legacy"),
    project: port,
    list: async () =>
      [...records]
        .filter(([id]) => id !== "legacy")
        .map(([projectId, raw]) => ({ projectId, savedAt: JSON.parse(raw).current.savedAt })),
  };
  return { catalog, records, failures };
}
const a = { ...createExampleProject(), id: "A" };
const b = { ...createExampleProject(), id: "B" };
const date = new Date("2026-10-10T12:00:00Z");

test("independent project records keep a valid predecessor each and list dates", async () => {
  const { catalog, records } = memory();
  await saveProjectRecovery(a, catalog, date);
  await saveProjectRecovery(b, catalog, date);
  const beforeB = records.get("B");
  await saveProjectRecovery(a, catalog, new Date("2026-10-11T12:00:00Z"));
  assert.equal(records.get("B"), beforeB);
  assert.equal(JSON.parse(records.get("A")!).previous.savedAt, date.toISOString());
  assert.deepEqual(
    (await listRecoveryProjects(catalog)).projects.map((p) => p.projectId),
    ["A", "B"],
  );
  assert.equal((await readProjectRecovery(catalog, "B"))?.project.id, "B");
});

test("legacy migration retains both different projects and original bytes; retry never replaces newer data", async () => {
  const { catalog, records, failures } = memory();
  await saveRecovery(a, catalog.legacy, date);
  await saveRecovery(b, catalog.legacy, date);
  const legacy = records.get("legacy");
  failures.add("A");
  await assert.rejects(migrateLegacyRecovery(catalog), /Quota/);
  const migratedB = records.get("B");
  failures.clear();
  await migrateLegacyRecovery(catalog);
  assert.equal(records.get("legacy"), legacy);
  assert.equal(records.get("B"), migratedB);
  await saveProjectRecovery(a, catalog, new Date("2026-10-12T12:00:00Z"));
  const newer = records.get("A");
  await migrateLegacyRecovery(catalog);
  assert.equal(records.get("A"), newer);
  assert.equal((await readProjectRecovery(catalog, "A"))?.project.id, "A");
});

test("legacy same-project predecessor is preserved and corrupt candidate is reported without deleting original", async () => {
  const { catalog, records } = memory();
  await saveRecovery(a, catalog.legacy, date);
  await saveRecovery(a, catalog.legacy, date);
  await migrateLegacyRecovery(catalog);
  assert.ok(JSON.parse(records.get("A")!).previous);
  records.delete("A");
  const raw = JSON.parse(records.get("legacy")!);
  raw.current.json = "{broken";
  records.set("legacy", JSON.stringify(raw));
  const before = records.get("legacy");
  assert.equal((await migrateLegacyRecovery(catalog)).length, 1);
  assert.equal((await readProjectRecovery(catalog, "A"))?.project.id, "A");
  assert.equal(records.get("legacy"), before);
});

test("concurrent writes to one project have one winner; separate projects do not conflict", async () => {
  const { catalog } = memory();
  const results = await Promise.allSettled([
    saveProjectRecovery(a, catalog, date),
    saveProjectRecovery(a, catalog, date),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  await Promise.all([saveProjectRecovery(a, catalog, date), saveProjectRecovery(b, catalog, date)]);
  assert.equal((await catalog.list()).length, 2);
});

test("quota/abort and invalid model preserve all records; wrong project payload is rejected", async () => {
  const { catalog, records, failures } = memory();
  await saveProjectRecovery(a, catalog, date);
  await saveProjectRecovery(b, catalog, date);
  const before = [...records];
  failures.add("A");
  await assert.rejects(saveProjectRecovery(a, catalog, date), /Quota/);
  assert.deepEqual([...records], before);
  failures.clear();
  await assert.rejects(
    saveProjectRecovery(
      { ...a, storey: { ...a.storey, walls: [{ ...a.storey.walls[0]!, height: -1 }] } },
      catalog,
      date,
    ),
  );
  assert.deepEqual([...records], before);
  records.set("A", records.get("B")!);
  await assert.rejects(readProjectRecovery(catalog, "A"), /anderen Projekt/);
  await assert.rejects(saveProjectRecovery(a, catalog, date), /anderen Projekt/);
});

test("startup lists without writes and preparation/cancellation leaves live model and history untouched", async () => {
  const { catalog, records } = memory();
  await saveProjectRecovery(a, catalog, date);
  await saveRecovery(b, catalog.legacy, date);
  const before = [...records];
  const live = createEditingState(createExampleProject());
  const original = JSON.stringify(live);
  assert.equal((await queryRecoveryProjects(catalog)).projects.length, 2);
  assert.deepEqual([...records], before);
  const prepared = await readProjectRecovery(catalog, "A");
  assert.equal(prepared?.project.id, "A");
  assert.equal(JSON.stringify(live), original);
  assert.equal(serializeProject(live.history.present), serializeProject(createExampleProject()));
});

test("migration quota failure still permits listing and preparing legacy projects", async () => {
  const { catalog, records, failures } = memory();
  await saveRecovery(a, catalog.legacy, date);
  await saveRecovery(b, catalog.legacy, date);
  const original = records.get("legacy");
  failures.add("A");
  failures.add("B");
  const list = await listRecoveryProjects(catalog);
  assert.equal(list.projects.length, 2);
  assert.equal(list.warnings.length, 1);
  assert.equal((await readProjectRecovery(catalog, "A"))?.project.id, "A");
  assert.equal((await readProjectRecovery(catalog, "B"))?.project.id, "B");
  assert.equal(records.get("legacy"), original);
});
