// node --experimental-strip-types benchmarks/edit-cycle-profile.ts <s|l|x> [repoRoot]
// Median phase costs of one wall length edit through the workspace command path
// (docs/performance/EDIT_CYCLE.md). repoRoot (file URL) measures another checkout with the
// same fixture, e.g. the state before the change.
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { schoolFixture } from "./school-fixture.ts";

const size = (process.argv[2] ?? "s") as "s" | "l" | "x";
const root = process.argv[3] ?? new URL("../", import.meta.url).href;
const load = (path: string) => import(new URL(path, root.endsWith("/") ? root : root + "/").href);
const { snapshotWithWorkingStorey } = await load("src/domain/project/owned-snapshot.ts");
const { commitProject, createHistory } = await load("src/application/history/project-history.ts");
const { applySelectionCommand, previewSelectionCommand } = await load(
  "src/application/commands/selection-command.ts",
);
const { ALL_LAYERS_VISIBLE, createLayerVisibilityPolicy } = await load(
  "src/application/layers/visibility.ts",
);
const { getLocalSnapSources } = await load("src/application/snapping/local-sources.ts");
const { connectedWallSolids } = await load("src/domain/elements/wall/connections.ts");

const config =
  size === "x"
    ? {
        project: snapshotWithWorkingStorey(schoolFixture(20000), "s2"),
        wall: "s2-b0",
        lengths: ["3 m", "3,5 m"],
      }
    : {
        project:
          size === "l" ? schoolPlanFixture({ wings: 3, desksPerRoom: 50 }) : schoolPlanFixture(),
        wall: "s0-w0-par-n3",
        lengths: ["8 m", "8,2 m"],
      };
let history = createHistory(config.project);
const targets = [{ kind: "wall", id: config.wall }];
const phases: Record<string, number[]> = {};
const time = (name: string, run: () => unknown) => {
  const t0 = performance.now();
  const value = run();
  (phases[name] ??= []).push(performance.now() - t0);
  return value;
};
connectedWallSolids(history.present);
getLocalSnapSources(history.present);
for (let i = 0; i < 14; i++) {
  const p = history.present;
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const text = `Wandlänge auf ${config.lengths[i % 2]}`;
  const preview = time("preview", () => previewSelectionCommand(p, targets, visibility, text));
  const next = time("apply", () => applySelectionCommand(p, targets, visibility, preview));
  history = time("commit", () => commitProject(history, next));
  time("wallSolids", () => connectedWallSolids(history.present));
  time("localSnapSources", () => getLocalSnapSources(history.present));
}
const median = (values: number[]) => [...values.slice(2)].sort((a, b) => a - b)[6]!;
const row = Object.fromEntries(Object.entries(phases).map(([k, v]) => [k, +median(v).toFixed(1)]));
const total = Object.values(row).reduce((a, b) => a + b, 0);
process.stdout.write(JSON.stringify({ size, root, ...row, total: +total.toFixed(1) }) + "\n");
