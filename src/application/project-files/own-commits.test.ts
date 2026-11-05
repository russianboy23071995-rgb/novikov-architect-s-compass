import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { createHistory } from "../history/project-history.ts";
import { createImageAssetHandle } from "../../domain/elements/reference/model.ts";
import {
  createAssetPreparation,
  createBoundedRecoveryCodec,
} from "../../interop/project-file/recovery-codec.ts";
import {
  readProjectRecovery,
  saveProjectRecovery,
  type RecoveryCatalog,
} from "./recovery-catalog.ts";
import { sameRecoveryContent } from "./recovery-status.ts";
import { prepareRecoveryV2Writer } from "./recovery-v2-writer.ts";
import {
  isRecoverySnapshotChecked,
  markRecoverySnapshotChecked,
  restoreRecoveryV2,
  sealRecoverySnapshot,
  type RecoveryDocument,
  type RecoveryRecordV2,
  type RecoverySnapshotV2,
} from "./recovery-v2.ts";
import { plainCopy } from "./own-commits.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";

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
  // Current and previous share one frozen payload (sealed snapshots); damage only current's link.
  blobs[key!] = { ...blobs[key!]!, data: png.replace("AAAA", "AAAB") };
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

// Autosave checks only images it has not prepared itself (user decision 27.10.2026,
// docs/performance/AUTOSAVE_IMAGE_CHECKS.md).
function pngOf(width: number, seed: number) {
  const header = Buffer.from("89504e470d0a1a0a0000000d49484452", "hex");
  const size = Buffer.alloc(8);
  size.writeUInt32BE(width, 0);
  size.writeUInt32BE(1, 4);
  const rest = Buffer.from("0806000000", "hex");
  return Buffer.concat([header, size, rest, Buffer.alloc(4), Buffer.alloc(64, seed)]).toString(
    "base64",
  );
}
const image = (id: string, width: number, seed: number) =>
  createImageAssetHandle({
    id,
    mimeType: "image/png",
    pixelWidth: width,
    pixelHeight: 1,
    data: pngOf(width, seed),
  });
function imageProject(assets = [image("a", 2, 1), image("b", 3, 2)]): Project {
  const p = addWall(createProject("p", "s0"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.3,
    height: 3,
  });
  return createHistory({ ...p, assets }).present;
}
const imageCodec = () =>
  createBoundedRecoveryCodec({ modelBytes: 1 << 20, payloadBytes: 1 << 20, pixels: 1000 });
function counted() {
  const phases: string[] = [];
  return { phases, measure: (phase: string) => phases.push(phase) };
}
const decodes = (phases: string[]) => phases.filter((p) => p === "decode").length;

test("the save check links prepared images and equals the full check", async () => {
  const c = imageCodec();
  const doc = await c.prepare(imageProject());
  const fast = counted(),
    full = counted();
  const linked = await c.restore(doc, { prepared: true, ...fast });
  const checked = await c.restore(doc, full);
  assert.equal(decodes(fast.phases), 0);
  assert.equal(decodes(full.phases), 2);
  assert.equal(JSON.stringify(linked), JSON.stringify(checked));
});

test("a changed image is hashed and checked; unchanged ones are not", async () => {
  const preparation = createAssetPreparation({ maxBytes: 1 << 20, maxPixels: 1000 });
  const assets = [image("a", 2, 1), image("b", 3, 2)];
  await preparation.prepare(imageProject(assets));
  const before = preparation.hashes;
  const doc = await preparation.prepare(imageProject([assets[0]!, image("b", 3, 9)]));
  assert.equal(preparation.hashes - before, 1);
  const c = imageCodec();
  // The save check links both: the new image was prepared (and hashed) in this session too.
  const save = counted();
  await c.restore(doc, { prepared: true, ...save });
  assert.equal(decodes(save.phases), 0);
  // Restores never link: both images are decoded and hashed again.
  const restore = counted();
  await c.restore(doc, restore);
  assert.equal(decodes(restore.phases), 2);
});

test("payloads not prepared in this session take the full check (counter-checks)", async () => {
  const c = imageCodec();
  const doc = await c.prepare(imageProject());
  const [key] = Object.keys(doc.blobs);
  // Same content, but a copy as storage would return it: decoded and hashed.
  const copy: RecoveryDocument = {
    ...doc,
    blobs: { ...doc.blobs, [key!]: { ...doc.blobs[key!]! } },
  };
  const probe = counted();
  await c.restore(copy, { prepared: true, ...probe });
  assert.equal(decodes(probe.phases), 1);
  // A damaged copy under the old key is rejected even on the save path.
  const damaged: RecoveryDocument = {
    ...doc,
    blobs: { ...doc.blobs, [key!]: { ...doc.blobs[key!]!, data: pngOf(2, 7) } },
  };
  await assert.rejects(c.restore(damaged, { prepared: true }), /integrity/);
  // A prepared payload linked under a different key is checked, not trusted.
  const keys = Object.keys(doc.blobs);
  const swapped: RecoveryDocument = {
    ...doc,
    blobs: { [keys[0]!]: doc.blobs[keys[1]!]!, [keys[1]!]: doc.blobs[keys[0]!]! },
  };
  await assert.rejects(c.restore(swapped, { prepared: true }));
});

test("sealed snapshots share frozen images, copy everything else and stay unchanged", async () => {
  const doc = await imageCodec().prepare(imageProject());
  const snapshot: RecoverySnapshotV2 = { savedAt: "2026-10-27T10:00:00.000Z", document: doc };
  const sealed = sealRecoverySnapshot(snapshot);
  assert.equal(JSON.stringify(sealed), JSON.stringify(snapshot));
  for (const key of Object.keys(doc.blobs))
    assert.equal(sealed.document.blobs[key], doc.blobs[key]);
  // The prepared manifest is deeply frozen by the codec and shared (AUTOSAVE_MODEL_CHECKS.md).
  assert.equal(sealed.document.model, doc.model);
  assert.ok(Object.isFrozen(sealed.document.model.assets[0]));
  // A loose manifest (as read from storage) is copied: later changes do not reach the seal.
  const plain = structuredClone(doc.model);
  const own = sealRecoverySnapshot({ ...snapshot, document: { ...doc, model: plain } });
  assert.notEqual(own.document.model, plain);
  plain.assets[0]!.id = "changed";
  assert.notEqual(own.document.model.assets[0]!.id, "changed");
  // Caller freezing grants no sharing: a shallow-frozen manifest is still copied.
  const shallow = Object.freeze(structuredClone(doc.model));
  assert.notEqual(
    sealRecoverySnapshot({ ...snapshot, document: { ...doc, model: shallow } }).document.model,
    shallow,
  );
  // Sealing again and copying an own commit keep the same object; unfrozen images are copied.
  assert.equal(sealRecoverySnapshot(sealed), sealed);
  assert.equal(plainCopy(sealed), sealed);
  const [key] = Object.keys(doc.blobs);
  const loose = { ...snapshot, document: { ...doc, blobs: { [key!]: { ...doc.blobs[key!]! } } } };
  assert.notEqual(sealRecoverySnapshot(loose).document.blobs[key!], loose.document.blobs[key!]);
});

test("only sealed snapshots can be marked as checked", async () => {
  const doc = await imageCodec().prepare(imageProject());
  const snapshot: RecoverySnapshotV2 = { savedAt: "2026-10-27T10:00:00.000Z", document: doc };
  markRecoverySnapshotChecked(snapshot);
  assert.equal(isRecoverySnapshotChecked(snapshot), false);
  const sealed = sealRecoverySnapshot(snapshot);
  assert.equal(isRecoverySnapshotChecked(sealed), false);
  markRecoverySnapshotChecked(sealed);
  assert.equal(isRecoverySnapshotChecked(sealed), true);
  // A restore of a sealed record is still a full check of every image.
  const c = imageCodec();
  const probe = counted();
  const restored = await restoreRecoveryV2(
    { version: 2, projectId: "p", revision: "r", current: sealed },
    "p",
    { prepare: c.prepare, restore: (d, control) => c.restore(d, { ...control, ...probe }) },
  );
  assert.equal(restored.fallback, false);
  assert.equal(decodes(probe.phases), 2);
});

// Autosave model checks without repetition (user decision 27.10.2026,
// docs/performance/AUTOSAVE_MODEL_CHECKS.md).
test("an owned project is prepared without a new validation and encodes the same document", async () => {
  const owned = imageProject();
  const mutable = validateProject(owned);
  const c = imageCodec();
  const fromOwned = await c.prepare(owned);
  const fromMutable = await c.prepare(mutable);
  assert.equal(JSON.stringify(fromOwned), JSON.stringify(fromMutable));
  // Counter-check: invalid mutable input is still rejected.
  const broken = { ...mutable, storeys: [{ ...mutable.storeys[0]!, walls: [{ id: 1 }] }] };
  await assert.rejects(c.prepare(broken as never));
});

test("the save check returns the prepared project; any other manifest is checked in full", async () => {
  const owned = imageProject();
  const c = imageCodec();
  const doc = await c.prepare(owned);
  assert.equal(await c.restore(doc, { prepared: true }), owned);
  const full = await c.restore(doc);
  assert.notEqual(full, owned);
  assert.equal(JSON.stringify(full), JSON.stringify(owned));
  // A copy of the manifest (as from storage) is migrated and validated again.
  const copy: RecoveryDocument = { ...doc, model: structuredClone(doc.model) };
  const checked = await c.restore(copy, { prepared: true });
  assert.notEqual(checked, owned);
  assert.equal(JSON.stringify(checked), JSON.stringify(owned));
  // An image that was not prepared in this session takes the full path, too.
  const [key] = Object.keys(doc.blobs);
  const foreign: RecoveryDocument = {
    ...doc,
    blobs: { ...doc.blobs, [key!]: { ...doc.blobs[key!]! } },
  };
  assert.notEqual(await c.restore(foreign, { prepared: true }), owned);
  // A broken copy of the manifest is rejected on the save path.
  const broken: RecoveryDocument = {
    ...doc,
    model: { ...structuredClone(doc.model), schemaVersion: 999 } as never,
  };
  await assert.rejects(c.restore(broken, { prepared: true }));
});

test("budgets still apply to every save", async () => {
  const tight = createBoundedRecoveryCodec({
    modelBytes: 100,
    payloadBytes: 1 << 20,
    pixels: 1000,
  });
  await assert.rejects(tight.prepare(imageProject()), /Model budget/);
  const pixels = createBoundedRecoveryCodec({
    modelBytes: 1 << 20,
    payloadBytes: 1 << 20,
    pixels: 4,
  });
  await assert.rejects(pixels.prepare(imageProject()), /budget/);
});
