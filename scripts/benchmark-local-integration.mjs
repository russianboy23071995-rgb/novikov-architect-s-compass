import assert from "node:assert/strict";
import os from "node:os";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { validateProject } from "../src/lib/bim/model.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createLocalSnapSources } from "../src/application/snapping/local-sources.ts";
import {
  drawingSnapPolicy,
  createToolSourceQuery,
  resolveToolSnap,
} from "../src/application/tools/snapping.ts";
import { editInteraction } from "../src/application/tools/adapters.ts";

// Deterministic separated crossing pairs, half walls/half lines. No random seed needed.
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
const noop = () => {};
const rows = [];
for (const count of [100, 1000, 5000]) {
  const base = fixture(count);
  const model = createLocalSnapSources(base);
  const references = projectSnapPrimitives(base).references;
  const origin = { x: 0, y: 0 };
  const session = {
    base,
    target: { kind: "wall", id: "w0" },
    action: "point",
    index: 0,
    anchor: origin,
  };
  const policies = {
    drawing: drawingSnapPolicy(origin),
    edit: editInteraction(session, base, session.target, noop, noop).snapping,
  };
  const queries = {};
  for (const [mode, policy] of Object.entries(policies)) {
    const sources = policy.sources(references);
    const sourceQuery = createToolSourceQuery(model, policy);
    for (const active of [false, true]) {
      const context = {
        references: [],
        sourceQuery,
        pixelsPerMetre: 100,
        enabled: true,
        endpointRadiusPx: 10,
        gridSpacing: 0.1,
        activeReferences: active
          ? [policy.origin, ...sources.filter((r) => r.kind === "midpoint").slice(2, 5)]
          : [],
      };
      let checksum = 0;
      const query = measure(
        (i) => {
          const pair = 1 + ((i * 17) % (count / 2 - 1));
          const cursor = { x: (pair % 50) * 4 + 1.02, y: Math.floor(pair / 50) * 4 + 0.01 };
          const result = resolveToolSnap(policy, cursor, context, {
            ortho: false,
            shift: false,
            featureSnap: true,
          });
          checksum += result.point.x + result.point.y;
        },
        30,
        150,
      );
      assert.ok(Number.isFinite(checksum));
      queries[`${mode}-${active ? "four-guides" : "no-guides"}`] = { ...query, checksum };
    }
  }
  rows.push({ elements: count, references: references.length, queries });
  process.stderr.write(`Completed ${count} elements\n`);
}
process.stdout.write(
  JSON.stringify(
    {
      schema: 1,
      node: process.version,
      platform: process.platform,
      arch: process.arch,
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      memoryGiB: os.totalmem() / 2 ** 30,
      clock: "performance.now",
      rows,
    },
    null,
    2,
  ) + "\n",
);
