import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { readProjectFile } from "../src/lib/bim/history.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import {
  createRecoveryContentComparator,
  sameRecoveryContent,
} from "../src/application/project-files/recovery-status.ts";

// Use a synthetic S1 GB export. No payloads in output; time only equality, not rendering.
const path = process.argv[2];
if (!path) throw Error("Expected synthetic S1 GB JSON path");
const base = createProjectSnapshot(readProjectFile(readFileSync(path, "utf8")));
const saved = readProjectFile(readFileSync(path, "utf8"));
const start = performance.now();
const compare = createRecoveryContentComparator(saved);
const prepareMs = performance.now() - start;
const coldStart = performance.now();
assert.equal(compare(base), sameRecoveryContent(base, saved));
const coldWithOracleMs = performance.now() - coldStart;
let current = base;
const full: number[] = [],
  cached: number[] = [];
for (let i = 0; i < 100; i++) {
  current = selectWorkingStorey(current, current, base.storeys[i % base.storeys.length]!.id);
  let t = performance.now();
  const expected = sameRecoveryContent(current, saved);
  full.push(performance.now() - t);
  t = performance.now();
  const actual = compare(current);
  cached.push(performance.now() - t);
  assert.equal(actual, expected);
}
const stats = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return { p50Ms: sorted[49], p95Ms: sorted[94], maxMs: sorted[99] };
};
console.log(
  JSON.stringify(
    {
      iterations: 100,
      storeys: base.storeys.length,
      assets: base.assets?.length,
      prepareMs,
      coldWithOracleMs,
      full: stats(full),
      cached: stats(cached),
      scope: "Node equality only; not browser frames",
      allResultsEqual: true,
    },
    null,
    2,
  ),
);
