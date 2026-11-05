// node --experimental-strip-types --expose-gc benchmarks/commit-sharing-node.ts [out.json]
import { writeFileSync } from "node:fs";
import { profileCommitSharing } from "./commit-sharing-profile.ts";
import { schoolFixture } from "./school-fixture.ts";
import { operations, paths } from "./commit-sharing.ts";

const gc = (globalThis as { gc?: () => void }).gc;
/** Heap retained by 30 successive model commits on top of the base history (after GC). */
function retained(size: number) {
  if (!gc) return null;
  const base = schoolFixture(size);
  const result: Record<string, number> = {};
  for (const path of ["legacy", "current"] as const) {
    let history = paths[path].create(base);
    gc();
    const before = process.memoryUsage().heapUsed;
    for (let i = 0; i < 30; i++)
      history = paths[path].commit(history, operations.wallReshape(history.present, i + 1));
    gc();
    result[`${path}MiB`] = +((process.memoryUsage().heapUsed - before) / 2 ** 20).toFixed(1);
    if (history.past.length !== 30) throw new Error("unexpected history length");
  }
  return result;
}

const timing = await profileCommitSharing({
  sizes: [100, 1000, 5000, 20000],
  samples: (size) => (size >= 20000 ? 11 : 21),
  now: () => performance.now(),
  progress: (text) => process.stderr.write(`\r${text}        `),
});
const report = {
  runtime: `node ${process.version} ${process.platform} ${process.arch}`,
  date: new Date().toISOString(),
  timing,
  retainedAfter30Commits: { 5000: retained(5000), 20000: retained(20000) },
};
process.stderr.write("\n");
const text = JSON.stringify(report, null, 2);
if (process.argv[2]) writeFileSync(process.argv[2], text + "\n");
console.log(text);
