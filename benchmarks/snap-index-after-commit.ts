// node --experimental-strip-types benchmarks/snap-index-after-commit.ts [out.json]
import { writeFileSync } from "node:fs";
import { schoolFixture } from "./school-fixture.ts";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { legacySnapPrimitives } from "./legacy-snap-primitives.ts";
import { createLocalSnapSources } from "../src/application/snapping/local-sources.ts";
import { createPrimitiveSourceIndex } from "../src/constraints/snapping/local-source-index.ts";
import { createHistory, commitProject } from "../src/application/history/project-history.ts";
import { updateLine } from "../src/application/lines/actions.ts";
import { type Project } from "../src/domain/project/schema.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { previewHatch } from "../src/application/hatches/actions.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";

/** Snap index build right after a real commit: legacy full derivation vs reused parts. */
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]!;
  return { median: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2), n: values.length };
};
const scenarios: [string, () => Project, (p: Project, i: number) => Project][] = [
  [
    "school20000-line",
    () => schoolFixture(20000),
    (p, i) => updateLine(p, storeyOf(p).lines![0]!.id, { color: i % 2 ? "#123456" : "#654321" }),
  ],
  [
    "school20000-wall",
    () => schoolFixture(20000),
    (p, i) => {
      const w = storeyOf(p).walls[1]!;
      return updateWall(p, w.id, { end: { x: w.start.x, y: w.start.y + (i % 2 ? 4.5 : 5) } });
    },
  ],
  [
    "hatches1000x100-point",
    () => hatchPointFixture(1000, 100),
    (p, i) =>
      previewHatch(p, p, {
        projectId: p.id,
        kind: "update",
        id: "h0",
        changes: {
          points: storeyOf(p).hatches[0]!.points.map((q, k) =>
            k ? q : { x: q.x + (i % 2 ? 0.5 : -0.5), y: q.y },
          ),
        },
      }),
  ],
];
const results = [];
for (const [name, fixture, edit] of scenarios) {
  let history = createHistory(fixture());
  createLocalSnapSources(history.present);
  const times = { legacy: [] as number[], current: [] as number[] };
  for (let i = 0; i < 9; i++) {
    history = commitProject(history, edit(history.present, i));
    const project = history.present;
    for (const path of i % 2
      ? (["legacy", "current"] as const)
      : (["current", "legacy"] as const)) {
      const t = performance.now();
      if (path === "legacy") createPrimitiveSourceIndex(legacySnapPrimitives({ ...project }));
      else createLocalSnapSources(project);
      times[path].push(performance.now() - t);
    }
  }
  results.push({ scenario: name, legacyMs: stats(times.legacy), currentMs: stats(times.current) });
  process.stderr.write(`${name}\n`);
}
const text = JSON.stringify(
  {
    runtime: `node ${process.version} ${process.platform} ${process.arch}`,
    date: new Date().toISOString(),
    results,
  },
  null,
  2,
);
if (process.argv[2]) writeFileSync(process.argv[2], text + "\n");
console.log(text);
