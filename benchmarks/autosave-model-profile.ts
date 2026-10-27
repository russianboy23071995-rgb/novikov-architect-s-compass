// node --experimental-strip-types benchmarks/autosave-model-profile.ts <s|l> [repoRoot]
// Model work of autosaves after PR475 (docs/performance/AUTOSAVE_MODEL_CHECKS.md): the real
// recovery writer and product codec on the school model with five images, one wall edit per
// save. Storage is in memory but checks like the IndexedDB adapter's publish (seal, full check of
// unchecked snapshots on the save path); no IndexedDB in Node. Median of 7 saves after a warm-up.
const size = (process.argv[2] ?? "l") as "s" | "l";
const root = process.argv[3] ?? new URL("../", import.meta.url).href;
const load = (path: string) => import(new URL(path, root.endsWith("/") ? root : root + "/").href);
const { schoolPlanFixture } = await import("./school-plan-fixture.ts");
const { createHistory, commitProject } = await load("src/application/history/project-history.ts");
const { createImageAssetHandle } = await load("src/domain/elements/reference/model.ts");
const { createProjectRecoveryCodec } = await load("src/interop/project-file/recovery-codec.ts");
const recovery = await load("src/application/project-files/recovery-v2.ts");
const { prepareRecoveryV2Writer } = await load(
  "src/application/project-files/recovery-v2-writer.ts",
);
const { updateWall } = await load("src/application/walls/actions.ts");
const { storeyOf } = await load("src/domain/storeys/access.ts");

function largePng(seed: number) {
  const header = Buffer.from("89504e470d0a1a0a0000000d4948445200000500000003e80806000000", "hex");
  return Buffer.concat([header, Buffer.alloc(4), Buffer.alloc(3_300_000, seed)]).toString("base64");
}
const fixture =
  size === "l" ? schoolPlanFixture({ wings: 3, desksPerRoom: 50 }) : schoolPlanFixture();
let history = createHistory({
  ...fixture,
  assets: Array.from({ length: 5 }, (_, i) =>
    createImageAssetHandle({
      id: `img-${i}`,
      mimeType: "image/png",
      pixelWidth: 1280,
      pixelHeight: 1000,
      data: largePng(i + 1),
    }),
  ),
});
const codec = createProjectRecoveryCodec();
const phases: Record<string, number[]> = {};
const timed = async <T>(name: string, run: () => Promise<T> | T): Promise<T> => {
  const t0 = performance.now();
  try {
    return await run();
  } finally {
    (phases[name] ??= []).push(performance.now() - t0);
  }
};
const timedCodec = {
  prepare: (p: unknown) => timed("prepare", () => codec.prepare(p)),
  restore: (d: unknown, c: unknown) => timed("check", () => codec.restore(d, c)),
};
let record: unknown = null;
const storage = {
  read: async () => ({ legacy: null, record }),
  async publish(_expected: unknown, input: Record<string, unknown>) {
    const { current, previous, ...rest } = input as { current: object; previous?: object };
    const seal = (s: object) => timed("seal", () => recovery.sealRecoverySnapshot(s));
    const next = {
      ...structuredClone(rest),
      current: await seal(current),
      ...(previous ? { previous: await seal(previous) } : {}),
    };
    for (const snapshot of [next.current, next.previous].filter(Boolean)) {
      if (recovery.isRecoverySnapshotChecked(snapshot)) continue;
      await recovery.restoreRecoveryV2(
        { ...next, current: snapshot },
        (next as unknown as { projectId: string }).projectId,
        timedCodec,
        undefined,
        true,
      );
      recovery.markRecoverySnapshotChecked(snapshot);
    }
    record = next;
  },
};
const median = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1]!;
const project = () => history.present;
const writer = await prepareRecoveryV2Writer(storage, project().id, timedCodec);
const totals: number[] = [];
for (let i = 0; i < 8; i++) {
  const wall = storeyOf(project()).walls[3]!;
  history = commitProject(
    history,
    updateWall(project(), wall.id, {
      end: { x: wall.end.x + (i % 2 ? -0.1 : 0.1), y: wall.end.y },
    }),
  );
  for (const k of Object.keys(phases)) phases[k]!.length = i;
  const t0 = performance.now();
  await writer.save(project(), () => true);
  totals.push(performance.now() - t0);
  for (const k of Object.keys(phases)) {
    const list = phases[k]!;
    // One entry per save and phase: sum repeated calls (seal of current and previous).
    const sum = list.slice(i).reduce((a, b) => a + b, 0);
    list.length = i;
    list.push(sum);
  }
}
const report = Object.fromEntries(
  Object.entries(phases).map(([k, v]) => [k, +median(v.slice(1)).toFixed(1)]),
);
process.stdout.write(
  JSON.stringify({ size, root, saveMs: +median(totals.slice(1)).toFixed(1), ...report }) + "\n",
);
