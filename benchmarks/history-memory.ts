// node --experimental-strip-types --expose-gc benchmarks/history-memory.ts [out.json]
// Heap evidence for the school acceptance run (docs/acceptance/SCHOOL_RUN.md): how much heap
// each derived per-project cache retains through the undo history. Every variant runs in its
// own child process so module-level caches start empty.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { schoolFixture } from "./school-fixture.ts";
import { snapshotWithWorkingStorey } from "../src/domain/project/owned-snapshot.ts";
import {
  commitProject,
  createHistory,
  type ProjectHistory,
} from "../src/application/history/project-history.ts";
import {
  applySelectionCommand,
  previewSelectionCommand,
} from "../src/application/commands/selection-command.ts";
import {
  ALL_LAYERS_VISIBLE,
  createLayerVisibilityPolicy,
} from "../src/application/layers/visibility.ts";
import { selectionIndex } from "../src/application/selection/state.ts";
import { getLocalSnapSources } from "../src/application/snapping/local-sources.ts";
import { getProjectSnapReferences } from "../src/application/snapping/project-references.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { getWallFootSources } from "../src/rendering/viewport/wall-foot-sources.ts";
import { connectedWallSolids } from "../src/domain/elements/wall/connections.ts";
import type { Project } from "../src/domain/project/schema.ts";

const COMMITS = 50;
/** Derived data the workspace requests per project snapshot (BimPlan, CadViewport,
 * BimSolidView, CadWorkspace, snapping), each behind a WeakMap keyed by the snapshot. */
const caches = {
  selectionIndex: (p: Project) => selectionIndex(p),
  localSnapSources: (p: Project) => getLocalSnapSources(p),
  snapReferences: (p: Project) => getProjectSnapReferences(p),
  buildingSolid: (p: Project) => buildBuildingSolid(p),
  wallFootSources: (p: Project) => getWallFootSources(p),
  wallSolids: (p: Project) => connectedWallSolids(p),
};
type CacheName = keyof typeof caches;
const sizes = {
  s: () => ({ project: schoolPlanFixture(), wall: "s0-w0-par-n3", lengths: ["8 m", "8,2 m"] }),
  l: () => ({
    project: schoolPlanFixture({ wings: 3, desksPerRoom: 50 }),
    wall: "s0-w0-par-n3",
    lengths: ["8 m", "8,2 m"],
  }),
  x: () => ({
    project: snapshotWithWorkingStorey(schoolFixture(20000), "s2"),
    wall: "s2-b0",
    lengths: ["3 m", "3,5 m"],
  }),
};
type Size = keyof typeof sizes;

const mib = (bytes: number) => +(bytes / 2 ** 20).toFixed(2);

/** One variant: `history` keeps the undo stack (false = only the present survives). */
async function runVariant(size: Size, use: readonly CacheName[], history: boolean) {
  const gc = (globalThis as { gc?: () => void }).gc;
  if (!gc) throw new Error("run with --expose-gc");
  // Each commit is its own task as in the browser: WeakRef targets (recent building) are only
  // released after the job that created them ends.
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  const settle = async () => {
    await tick();
    gc();
    await tick();
    gc();
  };
  const { project, wall, lengths } = sizes[size]();
  let state: ProjectHistory = createHistory(project);
  const derive = (p: Project) => use.forEach((name) => caches[name](p));
  derive(state.present);
  await settle();
  const before = process.memoryUsage().heapUsed;
  const targets = [{ kind: "wall" as const, id: wall }];
  for (let i = 0; i < COMMITS; i++) {
    const present = state.present;
    const visibility = createLayerVisibilityPolicy(present, ALL_LAYERS_VISIBLE);
    const text = `Wandlänge auf ${lengths[(i + 1) % 2]}`;
    const preview = previewSelectionCommand(present, targets, visibility, text);
    state = commitProject(state, applySelectionCommand(present, targets, visibility, preview));
    if (!history) state = { past: [], present: state.present, future: [] };
    derive(state.present);
    await tick();
  }
  await settle();
  const retained = process.memoryUsage().heapUsed - before;
  if (state.past.length !== (history ? COMMITS : 0)) throw new Error("unexpected history length");
  return { retainedMiB: mib(retained), perCommitMiB: mib(retained / COMMITS) };
}

const self = fileURLToPath(import.meta.url);
if (process.argv[2] === "--variant") {
  const [size, use, history] = process.argv.slice(3) as [Size, string, string];
  const names = (use ? use.split(",") : []) as CacheName[];
  process.stdout.write(JSON.stringify(await runVariant(size, names, history === "1")));
} else {
  const all = Object.keys(caches) as CacheName[];
  const variants: { name: string; use: readonly CacheName[]; history: boolean }[] = [
    { name: "modelOnly", use: [], history: true },
    ...all.map((name) => ({ name, use: [name], history: true })),
    { name: "allCaches", use: all, history: true },
    { name: "allCachesNoHistory", use: all, history: false },
  ];
  const results: Record<string, Record<string, unknown>> = {};
  for (const size of ["s", "l", "x"] as Size[]) {
    results[size] = {};
    for (const v of variants) {
      process.stderr.write(`\r${size} ${v.name}                    `);
      const child = spawnSync(
        process.execPath,
        [
          "--experimental-strip-types",
          "--expose-gc",
          "--max-old-space-size=8192",
          self,
          "--variant",
          size,
          v.use.join(","),
          v.history ? "1" : "0",
        ],
        { encoding: "utf8", maxBuffer: 1 << 20 },
      );
      if (child.status !== 0) throw new Error(`${size} ${v.name}: ${child.stderr}`);
      results[size]![v.name] = JSON.parse(child.stdout);
    }
  }
  process.stderr.write("\n");
  const report = {
    runtime: `node ${process.version} ${process.platform} ${process.arch}`,
    date: new Date().toISOString(),
    commits: COMMITS,
    notes:
      "heapUsed after gc, difference between before and after 50 wall-length commands through the workspace command path; images not included (shared by identity).",
    results,
  };
  const text = JSON.stringify(report, null, 2);
  if (process.argv[2]) writeFileSync(process.argv[2], text + "\n");
  process.stdout.write(text + "\n");
}
