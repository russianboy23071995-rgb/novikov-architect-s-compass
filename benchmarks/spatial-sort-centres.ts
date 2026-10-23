import assert from "node:assert/strict";
import { createBoxIndex as candidate } from "./spatial-sort-candidate.ts";
import { createBoxIndex as baseline } from "./spatial-sort-baseline.ts";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
const rows = [];
for (const size of [100, 1000]) {
  const data = projectSnapPrimitives(hatchPointFixture(size, 100));
  for (const kind of ["points", "segments"] as const)
    for (let repeat = 0; repeat < 4; repeat++) {
      const entries =
        kind === "points"
          ? data.references.map((r, value) => ({
              value,
              box: { minX: r.point.x, maxX: r.point.x, minY: r.point.y, maxY: r.point.y },
            }))
          : data.segments.map((s, value) => ({
              value,
              box: {
                minX: Math.min(s.start.x, s.end.x),
                maxX: Math.max(s.start.x, s.end.x),
                minY: Math.min(s.start.y, s.end.y),
                maxY: Math.max(s.start.y, s.end.y),
              },
            }));
      const run = (build: typeof candidate) => {
        global.gc?.();
        const heap = process.memoryUsage().heapUsed;
        const start = performance.now();
        const index = build(entries);
        const ms = performance.now() - start;
        const heapDelta = process.memoryUsage().heapUsed - heap;
        return { index, ms, heapDelta };
      };
      const first = run(repeat % 2 ? candidate : baseline),
        second = run(repeat % 2 ? baseline : candidate);
      const old = repeat % 2 ? second : first,
        next = repeat % 2 ? first : second;
      for (const box of [
        { minX: 9.9, maxX: 10.1, minY: -0.1, maxY: 0.1 },
        { minX: -1, maxX: 1, minY: 9.9, maxY: 10.1 },
        { minX: -100, maxX: 30 * size, minY: -100, maxY: 100 },
        { minX: -100, maxX: -90, minY: -100, maxY: -90 },
      ])
        assert.deepEqual(next.index.query(box), old.index.query(box));
      rows.push({
        size,
        kind,
        repeat,
        candidateFirst: !!(repeat % 2),
        baselineMs: old.ms,
        candidateMs: next.ms,
        baselineHeapDelta: old.heapDelta,
        candidateHeapDelta: next.heapDelta,
      });
    }
}
for (const offset of [0, 1e9, 1e308]) {
  const entries = Array.from({ length: 33 }, (_, value) => ({
    value,
    box: { minX: -offset, maxX: offset, minY: value % 3, maxY: (value % 3) + 1 },
  }));
  const original = structuredClone(entries),
    old = baseline(entries),
    next = candidate(entries);
  assert.deepEqual(entries, original);
  const query = { minX: -offset, maxX: offset, minY: -1, maxY: 10 };
  assert.deepEqual(next.query(query), old.query(query));
  entries[0]!.box.minX = NaN;
  assert.deepEqual(next.query(query), old.query(query));
}
for (const box of [
  { minX: NaN, maxX: 1, minY: 0, maxY: 1 },
  { minX: 2, maxX: 1, minY: 0, maxY: 1 },
  { minX: 0, maxX: Infinity, minY: 0, maxY: 1 },
])
  assert.throws(() => candidate([{ box, value: 0 }]));
console.log(
  JSON.stringify(
    {
      basis: "PR43489a391e",
      runtime: process.version,
      method:
        "Four fresh trees per size/type; alternating order, GC before build. Heap delta is transient observation, not retained/peak. 64 ordered queries plus ties/large/input-mutation/invalid checks. No frame/native claim.",
      rows,
    },
    null,
    2,
  ),
);
