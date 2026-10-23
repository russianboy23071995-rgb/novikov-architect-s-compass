import assert from "node:assert/strict";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createPrimitiveSourceIndex as candidate } from "./snap-freeze-candidate.ts";
import { createPrimitiveSourceIndex as baseline } from "./snap-freeze-baseline.ts";
const rows = [];
for (const size of [100, 1000])
  for (let repeat = 0; repeat < 4; repeat++) {
    const base = hatchPointFixture(size, 100);
    const run = (build: typeof candidate) => {
      const primitives = projectSnapPrimitives(base);
      global.gc?.();
      const heap = process.memoryUsage().heapUsed;
      const start = performance.now();
      const index = build(primitives);
      const ms = performance.now() - start;
      const heapDelta = process.memoryUsage().heapUsed - heap;
      return { index, ms, heapDelta };
    };
    const first = run(repeat % 2 ? candidate : baseline),
      second = run(repeat % 2 ? baseline : candidate);
    const old = repeat % 2 ? second : first,
      current = repeat % 2 ? first : second;
    assert.deepEqual(current.index.allSegments, old.index.allSegments);
    for (const x of [10, 40, 30 * (size - 1) + 10])
      for (const hidden of [false, true]) {
        const allowed = (r: { entityId: string }) => !hidden || r.entityId !== "h0";
        assert.deepEqual(
          current.index.query({ x, y: 0 }, 200, 12, allowed),
          old.index.query({ x, y: 0 }, 200, 12, allowed),
        );
      }
    rows.push({
      size,
      repeat,
      candidateFirst: !!(repeat % 2),
      baselineMs: old.ms,
      candidateMs: current.ms,
      baselineHeapDelta: old.heapDelta,
      candidateHeapDelta: current.heapDelta,
    });
  }
const point = { x: 0, y: 0 };
const reference = Object.freeze({
  entityId: "test",
  feature: "endpoint",
  point,
  directions: [{ x: 1, y: 0 }],
});
const segments = [{ start: point, end: { x: 1, y: 0 }, source: reference }];
candidate({ references: [reference], segments });
assert.ok(Object.isFrozen(point));
assert.ok(Object.isFrozen(reference.directions[0]));
assert.throws(() => {
  point.x = 9;
});
assert.throws(() => {
  segments[0]!.end.x = 9;
});
console.log(
  JSON.stringify(
    {
      basis: "PR4322b4763e",
      runtime: process.version,
      method:
        "Four fresh builds per size, alternating order. Primitive creation excluded; optional explicit GC before build. Heap delta is transient allocation observation, not peak or retained memory. Deep equality of segments and48 filtered/local queries; shallow-frozen parent mutation probes.",
      rows,
    },
    null,
    2,
  ),
);
