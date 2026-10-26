// node --experimental-strip-types benchmarks/recovery-status-profile.ts [out.json]
// Cost of the recovery status read after an own autosave (docs/performance/RECOVERY_STATUS.md):
// full read-back (decode and hash every image, validate the model) against confirmation of the
// own revision. School model l with five images of about 4.4 MB each, as in the acceptance run.
import { writeFileSync } from "node:fs";
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { createHistory } from "../src/application/history/project-history.ts";
import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { createProjectRecoveryCodec } from "../src/interop/project-file/recovery-codec.ts";
import {
  readProjectRecovery,
  saveProjectRecovery,
  type RecoveryCatalog,
} from "../src/application/project-files/recovery-catalog.ts";
import type { RecoveryRecordV2 } from "../src/application/project-files/recovery-v2.ts";

/** A valid PNG header (1280 × 1000) followed by filler, so decoding and hashing cost is real. */
function largePng(seed: number) {
  const header = Buffer.from("89504e470d0a1a0a0000000d4948445200000500000003e80806000000", "hex");
  const filler = Buffer.alloc(3_300_000, seed);
  return Buffer.concat([header, Buffer.alloc(4), filler]).toString("base64");
}
const assets = Array.from({ length: 5 }, (_, i) =>
  createImageAssetHandle({
    id: `img-${i}`,
    mimeType: "image/png",
    pixelWidth: 1280,
    pixelHeight: 1000,
    data: largePng(i + 1),
  }),
);
const project = createHistory({
  ...schoolPlanFixture({ wings: 3, desksPerRoom: 50 }),
  assets,
}).present;
const records = new Map<string, RecoveryRecordV2>();
const catalog: RecoveryCatalog = {
  legacy: { read: async () => null, replace: async () => {} },
  list: async () => [],
  project: () => ({ read: async () => null, replace: async () => {} }),
  v2: {
    codec: createProjectRecoveryCodec(),
    project: (id) => ({
      read: async () => ({ legacy: null, record: records.get(id) ?? null }),
      publish: async (_expected, next) => {
        records.set(id, next);
      },
    }),
  },
};
await saveProjectRecovery(project, catalog);
const median = (values: number[]) =>
  [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)]!;
const time = async (trust: boolean) => {
  const runs: number[] = [];
  for (let i = 0; i < 7; i++) {
    const t0 = performance.now();
    await readProjectRecovery(catalog, project.id, { trustOwnCommit: trust });
    runs.push(performance.now() - t0);
  }
  return +median(runs).toFixed(1);
};
const report = {
  runtime: `node ${process.version} ${process.platform} ${process.arch}`,
  date: new Date().toISOString(),
  imageMB: +(assets.reduce((n, a) => n + a.data.length, 0) / 1048576).toFixed(1),
  fullReadMs: await time(false),
  ownCommitMs: await time(true),
};
const text = JSON.stringify(report, null, 2);
if (process.argv[2]) writeFileSync(process.argv[2], text + "\n");
process.stdout.write(text + "\n");
