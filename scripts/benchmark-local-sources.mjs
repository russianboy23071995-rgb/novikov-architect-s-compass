import assert from "node:assert/strict";
import os from "node:os";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { validateProject } from "../src/lib/bim/model.ts";
import { createLocalSnapSources } from "../src/application/snapping/local-sources.ts";
function fixture(count, shift = 0) {
  const walls = [],
    lines = [];
  for (let i = 0; i < count / 2; i++) {
    const x = (i % 50) * 4 + shift,
      y = Math.floor(i / 50) * 4;
    walls.push({
      id: `w${i}`,
      start: { x, y },
      end: { x: x + 2, y },
      thickness: 0.36,
      height: 2.8,
    });
    lines.push({
      id: `l${i}`,
      kind: "line",
      points: [
        { x: x + 1, y: y - 1 },
        { x: x + 1, y: y + 1 },
      ],
      color: "#334155",
      penWidth: 0.25,
      style: "solid",
    });
  }
  return validateProject({
    schemaVersion: 1,
    unit: "m",
    id: "benchmark",
    storey: { id: "s", walls, windows: [], lines },
  });
}
function measure(fn, warmup, samples) {
  for (let i = 0; i < warmup; i++) fn(i);
  const times = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    fn(i);
    times.push(performance.now() - start);
  }
  const sorted = [...times].sort((a, b) => a - b);
  return {
    samples,
    medianMs: sorted[Math.floor(samples / 2)],
    p95Ms: sorted[Math.ceil(samples * 0.95) - 1],
    rawMs: times,
  };
}

const rows = [];
for (const count of [100, 1000, 5000]) {
  const project = fixture(count),
    changed = fixture(count, 0.125);
  let source;
  const build = measure(
    () => {
      source = createLocalSnapSources(project);
    },
    2,
    9,
  );
  assert.equal(source.segmentCount, count);
  assert.equal(source.sourceCount, count * 5);
  const rebuild = measure(
    () => {
      source = createLocalSnapSources(changed);
    },
    2,
    9,
  );
  assert.equal(
    source
      .query({ x: 1.125, y: 0 }, 100, 10)
      .references.filter((r) => r.kind === "segment-intersection").length,
    1,
  );
  source = createLocalSnapSources(project);
  let maxPairs = 0;
  const query = measure(
    (i) => {
      const pair = 1 + ((i * 17) % (count / 2 - 1));
      const result = source.query(
        { x: (pair % 50) * 4 + 1.02, y: Math.floor(pair / 50) * 4 + 0.01 },
        100,
        10,
      );
      maxPairs = Math.max(maxPairs, result.segmentPairs);
      assert.equal(result.references.filter((r) => r.kind === "segment-intersection").length, 1);
    },
    30,
    150,
  );
  rows.push({ elements: count, sourceCount: source.sourceCount, build, rebuild, query, maxPairs });
}
process.stdout.write(
  JSON.stringify(
    {
      node: process.version,
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      platform: process.platform,
      rows,
    },
    null,
    2,
  ) + "\n",
);
