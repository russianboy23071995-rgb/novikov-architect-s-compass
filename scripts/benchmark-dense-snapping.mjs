import assert from "node:assert/strict";
import os from "node:os";
import process from "node:process";
import { performance } from "node:perf_hooks";
import { validateProject } from "../src/lib/bim/model.ts";
import { createLocalSnapSources } from "../src/application/snapping/local-sources.ts";
import {
  projectSnapPrimitives,
  projectSnapReferences,
} from "../src/application/snapping/project-references.ts";
import {
  createToolSourceQuery,
  drawingSnapPolicy,
  resolveToolSnap,
  prepareToolReferences,
} from "../src/application/tools/snapping.ts";

function fixture(count, crossing) {
  return validateProject({
    schemaVersion: 1,
    unit: "m",
    id: "dense",
    storey: {
      id: "s",
      walls: [],
      windows: [],
      lines: Array.from({ length: count }, (_, i) => {
        const slope = crossing ? 0.2 + i * 0.002 : 1;
        const offset = crossing ? 0.001 * (i % 7) : 2 + i * 0.1;
        return {
          id: "l" + i,
          kind: "line",
          points: [
            { x: -100, y: -100 * slope + offset },
            { x: 100, y: 100 * slope + offset },
          ],
          color: "#334155",
          penWidth: 0.25,
          style: "solid",
        };
      }),
    },
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
for (const crossing of [false, true])
  for (const count of [100, 250, 500]) {
    const project = fixture(count, crossing),
      model = createLocalSnapSources(project);
    const policy = drawingSnapPolicy({ x: -2, y: -2 });
    const sourceQuery = createToolSourceQuery(model, policy);
    const activeReferences = [
      policy.origin,
      ...projectSnapPrimitives(project)
        .references.filter((r) => r.kind === "midpoint")
        .slice(0, 3),
    ];
    const context = {
      references: [],
      sourceQuery,
      activeReferences,
      pixelsPerMetre: 100,
      enabled: true,
      endpointRadiusPx: 10,
      gridSpacing: null,
    };
    const options = { ortho: false, shift: false, featureSnap: true };
    const cursor = { x: 0.013, y: 0.009 };
    const stats = model.query(cursor, 100, 10);
    const expectedSegments = crossing ? count : 0;
    assert.equal(stats.segments.length, expectedSegments);
    assert.equal(stats.segmentPairs, (expectedSegments * Math.max(0, expectedSegments - 1)) / 2);
    const full = prepareToolReferences(policy, projectSnapReferences(project));
    assert.deepEqual(
      resolveToolSnap(policy, cursor, context, options),
      resolveToolSnap(
        policy,
        cursor,
        { ...context, sourceQuery: undefined, references: full },
        options,
      ),
    );
    const query = measure(() => resolveToolSnap(policy, cursor, context, options), 5, 15);
    rows.push({
      scenario: crossing ? "dense-crossings" : "diagonal-box-false-positives",
      elements: count,
      localSegments: stats.segments.length,
      localReferences: stats.references.length,
      segmentPairs: stats.segmentPairs,
      query,
    });
    process.stderr.write("Completed " + count + " " + crossing + "\n");
  }
process.stdout.write(
  JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      cpu: os.cpus()[0]?.model,
      logicalCpus: os.cpus().length,
      clock: "performance.now",
      rows,
    },
    null,
    2,
  ) + "\n",
);
