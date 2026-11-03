// node --experimental-strip-types benchmarks/roof-trim-profile.ts [sizes] [out.json]
// Korrektur 4 (docs/performance/ROOF_TRIM.md): time of the roof trim per validation of the
// Gesamtmodell, and of whole validations after a wall edit in the trimmed storey and in another.
import { writeFileSync } from "node:fs";
import { gesamtFixture } from "./gesamt-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { resolveRoofTrims } from "../src/domain/elements/wall/roof-trim.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import type { Project } from "../src/domain/project/schema.ts";

const SAMPLES = 15;
const median = (run: (i: number) => void) => {
  const times: number[] = [];
  for (let i = -2; i < SAMPLES; i++) {
    const t = performance.now();
    run(i);
    if (i >= 0) times.push(performance.now() - t);
  }
  times.sort((a, b) => a - b);
  return Math.round(times[Math.floor(SAMPLES / 2)]! * 100) / 100;
};
const sizes = (process.argv[2] ?? "3000,10000,20000").split(",").map(Number);
const results: Record<string, unknown> = {};
for (const size of sizes) {
  const project = createProjectSnapshot(gesamtFixture(size));
  const roofStorey = project.storeys.findIndex((s) => s.walls.some((w) => w.roofTrim));
  // A fresh copy of every storey: nothing can be reused from an earlier call.
  const fresh = () => ({ ...project, storeys: project.storeys.map((s) => ({ ...s })) });
  const copies = Array.from({ length: SAMPLES + 2 }, fresh);
  const edit = (storey: number) => {
    let state = createEditingState(
      createProjectSnapshot({ ...project, workingStoreyId: project.storeys[storey]!.id }),
    );
    return median((i) => {
      const present: Project = state.history.present;
      const wall = present.storeys[storey]!.walls[0]!;
      state = editingReducer(state, {
        type: "project",
        project: updateWall(present, wall.id, { thickness: i % 2 ? 0.25 : 0.24 }),
      });
      if (state.error) throw new Error(state.error);
    });
  };
  results[size] = {
    trimmedWalls: project.storeys[roofStorey]!.walls.filter((w) => w.roofTrim).length,
    resolveFreshMs: median((i) => resolveRoofTrims(copies[i + 2]!)),
    resolveSameMs: median(() => resolveRoofTrims(project)),
    editRoofStoreyMs: edit(roofStorey),
    editOtherStoreyMs: edit(2),
  };
  process.stderr.write(`${size} ${JSON.stringify(results[size])}\n`);
}
const report = {
  runtime: `node ${process.version} ${process.platform} ${process.arch}`,
  date: new Date().toISOString(),
  notes:
    "median of 15; resolveFresh: every storey a new object, resolveSame: the same validated project again; edit*: wall thickness through editingReducer (whole validation).",
  results,
};
if (process.argv[3]) writeFileSync(process.argv[3], JSON.stringify(report, null, 2) + "\n");
process.stdout.write(JSON.stringify(report, null, 2) + "\n");
