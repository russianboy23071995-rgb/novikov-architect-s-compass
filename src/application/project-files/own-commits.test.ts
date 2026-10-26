import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { createHistory } from "../history/project-history.ts";
import { createImageAssetHandle } from "../../domain/elements/reference/model.ts";
import { createBoundedRecoveryCodec } from "../../interop/project-file/recovery-codec.ts";
import {
  readProjectRecovery,
  saveProjectRecovery,
  type RecoveryCatalog,
} from "./recovery-catalog.ts";
import { sameRecoveryContent } from "./recovery-status.ts";
import { prepareRecoveryV2Writer } from "./recovery-v2-writer.ts";
import type { RecoveryRecordV2 } from "./recovery-v2.ts";
import type { Project } from "../../domain/project/schema.ts";

// Status confirmation of own recovery saves (docs/performance/RECOVERY_STATUS.md).
const png =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
function setup() {
  const records = new Map<string, RecoveryRecordV2>();
  const codec = createBoundedRecoveryCodec({
    modelBytes: 1024 * 1024,
    payloadBytes: 1024 * 1024,
    pixels: 1000,
  });
  let restores = 0;
  const catalog: RecoveryCatalog = {
    legacy: { read: async () => null, replace: async () => {} },
    list: async () => [],
    project: () => ({ read: async () => null, replace: async () => {} }),
    v2: {
      codec: {
        prepare: (p) => codec.prepare(p),
        restore: (doc, control) => {
          restores++;
          return codec.restore(doc, control);
        },
      },
      project: (id) => ({
        read: async () => ({ legacy: null, record: records.get(id) ?? null }),
        publish: async (_expected, next) => {
          records.set(id, next);
        },
      }),
    },
  };
  return { catalog, records, restores: () => restores };
}
function owned(): Project {
  const p = addWall(createProject("own", "s0"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.3,
    height: 3,
  });
  const asset = createImageAssetHandle({
    id: "img",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: png,
  });
  return createHistory({ ...p, assets: [asset] }).present;
}
const instant = new Date("2026-10-26T12:00:00Z");

test("the status read confirms an own save by its revision without restoring images", async () => {
  const { catalog, restores } = setup();
  const project = owned();
  await saveProjectRecovery(project, catalog, instant);
  const before = restores();
  const trusted = await readProjectRecovery(catalog, project.id, { trustOwnCommit: true });
  assert.equal(restores(), before);
  assert.equal(trusted!.project, project);
  assert.equal(trusted!.savedAt, instant.toISOString());
  // The full read restores and yields the same content.
  const full = await readProjectRecovery(catalog, project.id);
  assert.equal(restores(), before + 1);
  assert.ok(sameRecoveryContent(full!.project, trusted!.project));
});

test("a record written elsewhere is read back and verified in full", async () => {
  const { catalog, records, restores } = setup();
  const project = owned();
  await saveProjectRecovery(project, catalog, instant);
  // Another tab publishes a new revision of the same project.
  const other = records.get(project.id)!;
  records.set(project.id, { ...other, revision: "other-tab" });
  const before = restores();
  await readProjectRecovery(catalog, project.id, { trustOwnCommit: true });
  assert.equal(restores(), before + 1);
});

test("restores still verify images: a damaged payload is rejected (counter-check)", async () => {
  const { catalog, records } = setup();
  const project = owned();
  await saveProjectRecovery(project, catalog, instant);
  const record = structuredClone(records.get(project.id)!);
  // A plain mutable copy of the stored record, as IndexedDB would hand it out.
  const blobs = (record.current.document as unknown as { blobs: Record<string, { data: string }> })
    .blobs;
  const [key] = Object.keys(blobs);
  blobs[key!]!.data = png.replace("AAAA", "AAAB");
  records.set(project.id, { ...record, revision: "damaged" });
  await assert.rejects(() => readProjectRecovery(catalog, project.id));
});

// A writer prepared again in the same session (reopen, Undo across a file open) trusts its own
// commit as well (docs/performance/RECOVERY_CHECKS.md).
test("a writer prepared again after an own save does not restore it and keeps saving", async () => {
  const { catalog, records, restores } = setup();
  const project = owned();
  await saveProjectRecovery(project, catalog, instant);
  const first = records.get(project.id)!;
  const before = restores();
  const writer = await prepareRecoveryV2Writer(
    catalog.v2!.project(project.id),
    project.id,
    catalog.v2!.codec,
  );
  assert.equal(restores(), before);
  assert.equal(writer.project, project);
  // The next save keeps the former current snapshot as fallback and advances the revision.
  const edited = addWall(project, {
    id: "w2",
    start: { x: 0, y: 2 },
    end: { x: 4, y: 2 },
    thickness: 0.3,
    height: 3,
  });
  await writer.save(edited, () => true, undefined, instant);
  const next = records.get(project.id)!;
  assert.notEqual(next.revision, first.revision);
  assert.equal(JSON.stringify(next.previous), JSON.stringify(first.current));
  const full = await readProjectRecovery(catalog, project.id);
  assert.ok(sameRecoveryContent(full!.project, edited));
});

test("a writer still restores a foreign revision and rejects a damaged one (counter-check)", async () => {
  const { catalog, records, restores } = setup();
  const project = owned();
  await saveProjectRecovery(project, catalog, instant);
  const record = structuredClone(records.get(project.id)!);
  records.set(project.id, { ...record, revision: "other-tab" });
  const before = restores();
  await prepareRecoveryV2Writer(catalog.v2!.project(project.id), project.id, catalog.v2!.codec);
  assert.equal(restores(), before + 1);
  const blobs = (record.current.document as unknown as { blobs: Record<string, { data: string }> })
    .blobs;
  const [key] = Object.keys(blobs);
  blobs[key!]!.data = png.replace("AAAA", "AAAB");
  records.set(project.id, { ...record, revision: "damaged" });
  await assert.rejects(() =>
    prepareRecoveryV2Writer(catalog.v2!.project(project.id), project.id, catalog.v2!.codec),
  );
});

test("a revision verified in full once is not checked again by status or writer", async () => {
  const { catalog, records, restores } = setup();
  const project = owned();
  await saveProjectRecovery(project, catalog, instant);
  // A record from an earlier session: unknown revision, checked in full once.
  records.set(project.id, { ...records.get(project.id)!, revision: "earlier-session" });
  const before = restores();
  const status = await readProjectRecovery(catalog, project.id, { trustOwnCommit: true });
  assert.equal(restores(), before + 1);
  const again = await readProjectRecovery(catalog, project.id, { trustOwnCommit: true });
  const writer = await prepareRecoveryV2Writer(
    catalog.v2!.project(project.id),
    project.id,
    catalog.v2!.codec,
  );
  assert.equal(restores(), before + 1);
  assert.equal(again!.project, status!.project);
  assert.equal(writer.project, status!.project);
  // A restore (no trust) still checks in full.
  await readProjectRecovery(catalog, project.id);
  assert.equal(restores(), before + 2);
});

test("a verified fallback keeps the valid predecessor for status and writer", async () => {
  const { catalog, records } = setup();
  const project = owned();
  await saveProjectRecovery(project, catalog, instant);
  await saveProjectRecovery(project, catalog, new Date("2026-10-26T12:05:00Z"));
  const record = structuredClone(records.get(project.id)!);
  const blobs = (record.current.document as unknown as { blobs: Record<string, { data: string }> })
    .blobs;
  const [key] = Object.keys(blobs);
  blobs[key!]!.data = png.replace("AAAA", "AAAB");
  records.set(project.id, { ...record, revision: "damaged-current" });
  const full = await readProjectRecovery(catalog, project.id, { trustOwnCommit: true });
  assert.equal(full!.fallback, true);
  const trusted = await readProjectRecovery(catalog, project.id, { trustOwnCommit: true });
  assert.equal(trusted!.fallback, true);
  assert.equal(trusted!.savedAt, full!.savedAt);
  const writer = await prepareRecoveryV2Writer(
    catalog.v2!.project(project.id),
    project.id,
    catalog.v2!.codec,
  );
  await writer.save(project, () => true, undefined, instant);
  // The next record keeps the valid predecessor, not the damaged current snapshot.
  const next = records.get(project.id)!;
  assert.equal(JSON.stringify(next.previous), JSON.stringify(record.previous));
  const restored = await readProjectRecovery(catalog, project.id);
  assert.equal(restored!.fallback, false);
});
