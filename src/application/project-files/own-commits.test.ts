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
