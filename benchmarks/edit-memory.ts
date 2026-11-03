// [EDITS=n] node --experimental-strip-types --expose-gc benchmarks/edit-memory.ts [sizes] [out.json]
// Korrektur 3 (docs/performance/GESAMTNACHWEIS_2026-11.md): heap retained per edit of the
// Gesamtmodell through the editing reducer the workspace uses, with the derived data the
// workspace requests per snapshot. Every variant runs in its own child process.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { selectionIndex } from "../src/application/selection/state.ts";
import { getLocalSnapSources } from "../src/application/snapping/local-sources.ts";
import { getProjectSnapReferences } from "../src/application/snapping/project-references.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { getWallFootSources } from "../src/rendering/viewport/wall-foot-sources.ts";
import { connectedWallSolids } from "../src/domain/elements/wall/connections.ts";
import { rememberedSectionDrawing } from "../src/rendering/viewport/section-drawing.ts";
import type { Project } from "../src/domain/project/schema.ts";

const EDITS = Number(process.env["EDITS"] ?? 30);
const caches = {
  plan: (p: Project) => {
    selectionIndex(p);
    getLocalSnapSources(p);
    getProjectSnapReferences(p);
    getWallFootSources(p);
    connectedWallSolids(p);
  },
  building: (p: Project) => buildBuildingSolid(p),
  sections: (p: Project) => p.sections?.forEach((s) => rememberedSectionDrawing(p, s)),
};
type CacheName = keyof typeof caches;
const mib = (bytes: number) => +(bytes / 2 ** 20).toFixed(2);

async function runVariant(size: number, use: readonly CacheName[], history: boolean) {
  const gc = (globalThis as { gc?: () => void }).gc;
  if (!gc) throw new Error("run with --expose-gc");
  const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
  const settle = async () => {
    for (let i = 0; i < 3; i++) {
      await tick();
      gc();
    }
  };
  let state = createEditingState(createProjectSnapshot(gesamtFixture(size)));
  const derive = (p: Project) => use.forEach((name) => caches[name](p));
  derive(state.history.present);
  await settle();
  const before = process.memoryUsage().heapUsed;
  const wall = () => state.history.present.storeys[2]!.walls[0]!;
  for (let i = 0; i < EDITS; i++) {
    const present = state.history.present;
    state = editingReducer(state, {
      type: "project",
      project: updateWall(present, wall().id, { height: i % 2 ? 2.8 : 2.6 }),
    });
    if (state.error) throw new Error(state.error);
    if (!history)
      state = { ...state, history: { past: [], present: state.history.present, future: [] } };
    derive(state.history.present);
    await tick();
  }
  await settle();
  const retained = process.memoryUsage().heapUsed - before;
  // Undo with the derived data of the new current state (released ones are rebuilt).
  const undo: number[] = [];
  for (let i = 0; history && i < 9; i++) {
    const t = performance.now();
    state = editingReducer(state, { type: "undo" });
    derive(state.history.present);
    undo.push(performance.now() - t);
  }
  undo.sort((a, b) => a - b);
  return {
    retainedMiB: mib(retained),
    perEditMiB: mib(retained / EDITS),
    ...(undo.length ? { undoMedianMs: Math.round(undo[4]!) } : {}),
  };
}

const self = fileURLToPath(import.meta.url);
if (process.argv[2] === "--variant") {
  const [size, use, history] = process.argv.slice(3) as [string, string, string];
  const names = (use ? use.split(",") : []) as CacheName[];
  process.stdout.write(JSON.stringify(await runVariant(+size, names, history === "1")));
} else {
  const sizes = (process.argv[2] ?? "3000,10000,20000").split(",").map(Number);
  const variants: { name: string; use: readonly CacheName[]; history: boolean }[] = [
    { name: "modelOnly", use: [], history: true },
    { name: "plan", use: ["plan"], history: true },
    { name: "building", use: ["building"], history: true },
    { name: "sections", use: ["sections"], history: true },
    { name: "all", use: ["plan", "building", "sections"], history: true },
    { name: "allNoHistory", use: ["plan", "building", "sections"], history: false },
  ];
  const results: Record<string, Record<string, unknown>> = {};
  for (const size of sizes) {
    results[size] = {};
    for (const v of variants) {
      process.stderr.write(`${size} ${v.name}\n`);
      const child = spawnSync(
        process.execPath,
        [
          "--experimental-strip-types",
          "--expose-gc",
          "--max-old-space-size=8192",
          self,
          "--variant",
          String(size),
          v.use.join(","),
          v.history ? "1" : "0",
        ],
        { encoding: "utf8", maxBuffer: 1 << 20 },
      );
      if (child.status !== 0) throw new Error(`${size} ${v.name}: ${child.stderr}`);
      results[size]![v.name] = JSON.parse(child.stdout);
      process.stderr.write(`  ${child.stdout}\n`);
    }
  }
  const report = {
    runtime: `node ${process.version} ${process.platform} ${process.arch}`,
    date: new Date().toISOString(),
    edits: EDITS,
    notes: "heapUsed after gc, difference over 30 wall height edits on storey 2 (editingReducer).",
    results,
  };
  const text = JSON.stringify(report, null, 2);
  if (process.argv[3]) writeFileSync(process.argv[3], text + "\n");
  process.stdout.write(text + "\n");
}
