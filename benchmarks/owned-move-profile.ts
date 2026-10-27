// node --experimental-strip-types benchmarks/owned-move-profile.ts <l|x> [repoRoot]
// Confirming a Z and an XY group move on an owned project (docs/performance/OWNED_MOVE_CONFIRMATION.md):
// median of 7 materialize calls after one warm-up, against another checkout via repoRoot.
const size = (process.argv[2] ?? "x") as "l" | "x";
const root = process.argv[3] ?? new URL("../", import.meta.url).href;
const load = (path: string) => import(new URL(path, root.endsWith("/") ? root : root + "/").href);
const { schoolFixture } = await import("./school-fixture.ts");
const { schoolPlanFixture } = await import("./school-plan-fixture.ts");
const { snapshotWithWorkingStorey } = await load("src/domain/project/owned-snapshot.ts");
const { createHistory } = await load("src/application/history/project-history.ts");
const { prepareZTranslation } = await load("src/application/selection/z-translation.ts");
const { prepareTranslation } = await load("src/domain/project/prepared-translation.ts");
const { serializeProject } = await load("src/lib/bim/model.ts");

const project = createHistory(
  size === "x"
    ? snapshotWithWorkingStorey(schoolFixture(20000), "s2")
    : schoolPlanFixture({ wings: 3, desksPerRoom: 50 }),
).present;
const wall = size === "x" ? "s2-b0" : "s0-w0-par-n3";
const median = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1]!;
const time = (run: () => unknown) => {
  const t0 = performance.now();
  const value = run();
  return { value, ms: performance.now() - t0 };
};
const z: number[] = [],
  xy: number[] = [];
let zResult = "",
  xyResult = "";
for (let i = 0; i < 8; i++) {
  const targets = [{ kind: "wall", id: wall }];
  const zMove = prepareZTranslation(project, targets);
  const zRun = time(() => zMove.materialize(project, targets, 0.5));
  const xyMove = prepareTranslation(project, [wall]);
  const xyRun = time(() => xyMove.materialize(project, { x: 0.25, y: 0 }));
  if (i === 0) {
    zResult = serializeProject(zRun.value);
    xyResult = serializeProject(xyRun.value);
  } else {
    z.push(zRun.ms);
    xy.push(xyRun.ms);
  }
}
const { createHash } = await import("node:crypto");
const hash = (text: string) => createHash("sha256").update(text).digest("hex").slice(0, 16);
process.stdout.write(
  JSON.stringify({
    size,
    root,
    zMs: +median(z).toFixed(1),
    xyMs: +median(xy).toFixed(1),
    zResult: hash(zResult),
    xyResult: hash(xyResult),
  }) + "\n",
);
