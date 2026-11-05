// node --experimental-strip-types benchmarks/remaining-actions-node.ts [out.json]
import { writeFileSync } from "node:fs";
import { schoolFixture } from "./school-fixture.ts";
import { paths } from "./commit-sharing.ts";
import type { Project } from "../src/domain/project/schema.ts";
import { renameStorey } from "../src/application/storeys/actions.ts";
import { previewLayerManagement } from "../src/application/layers/actions.ts";
import { previewHatch } from "../src/application/hatches/actions.ts";

/** Action families switched in stage 3; each sample changes something from the same base. */
const operations: Record<string, (p: Project, i: number) => Project> = {
  storeyRename: (p, i) =>
    renameStorey(p, p, { projectId: p.id, storeyId: p.storeys[1]!.id, name: `OG ${i}` }),
  layerRename: (p, i) =>
    previewLayerManagement(p, p, { kind: "rename", id: p.layers[1]!.id, name: `Ebene ${i}` }),
  hatchCreate: (p, i) =>
    previewHatch(p, p, {
      projectId: p.id,
      kind: "create",
      hatch: {
        id: `hatch-${i}`,
        points: [
          { x: 200, y: 0 },
          { x: 203, y: 0 },
          { x: 203, y: 2 },
          { x: 200, y: 2 },
        ],
        fill: { color: "#aabbcc", opacity: 0.5 },
      },
    }),
};
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const at = (q: number) => sorted[Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1)]!;
  return { median: +at(0.5).toFixed(2), p95: +at(0.95).toFixed(2), n: values.length };
};
const results = [];
for (const size of [5000, 20000]) {
  const base = schoolFixture(size);
  const histories = { legacy: paths.legacy.create(base), current: paths.current.create(base) };
  for (const [name, op] of Object.entries(operations)) {
    const totals = { legacy: [] as number[], current: [] as number[] };
    let equivalent = true;
    for (let i = -1; i < 11; i++) {
      const out: Record<string, string> = {};
      for (const path of i % 2
        ? (["legacy", "current"] as const)
        : (["current", "legacy"] as const)) {
        const t = performance.now();
        const next = paths[path].commit(histories[path], op(histories[path].present, i + 2));
        if (i >= 0) totals[path].push(performance.now() - t);
        out[path] = JSON.stringify(next.present) + next.past.length;
      }
      equivalent &&= out["legacy"] === out["current"];
    }
    results.push({
      size,
      operation: name,
      equivalent,
      legacyTotalMs: stats(totals.legacy),
      currentTotalMs: stats(totals.current),
    });
    process.stderr.write(`${size} ${name}\n`);
  }
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
