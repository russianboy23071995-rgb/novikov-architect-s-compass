import assert from "node:assert/strict";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createPrimitiveSourceIndex } from "../src/constraints/snapping/local-source-index.ts";
import { getLocalSnapSources } from "../src/application/snapping/local-sources.ts";
const rows = [];
for (const size of [10, 100, 1000])
  for (let repeat = 0; repeat < 3; repeat++) {
    const base = hatchPointFixture(size, 100);
    const phases: Record<string, number> = {};
    const measure = <T>(name: string, run: () => T): T => {
      const start = performance.now();
      const value = run();
      phases[name] = performance.now() - start;
      return value;
    };
    const primitives = measure("primitives", () => projectSnapPrimitives(base));
    const measured = createPrimitiveSourceIndex(primitives, measure);
    const normal = getLocalSnapSources(base);
    assert.equal(getLocalSnapSources(base), normal);
    assert.equal(measured.sourceCount, normal.sourceCount);
    assert.equal(measured.segmentCount, normal.segmentCount);
    assert.deepEqual(measured.allSegments, normal.allSegments);
    for (const cursor of [
      { x: 10, y: 0 },
      { x: 0, y: 10 },
      { x: 5, y: 5 },
      { x: 30 * (size - 1) + 10, y: 0 },
    ])
      for (const hidden of [false, true]) {
        const allowed = (r: { entityId: string }) => !hidden || r.entityId !== "h0";
        assert.deepEqual(
          measured.query(cursor, 200, 12, allowed),
          normal.query(cursor, 200, 12, allowed),
        );
      }
    rows.push({
      size,
      repeat,
      sourceCount: measured.sourceCount,
      segmentCount: measured.segmentCount,
      phases,
    });
  }
console.log(
  JSON.stringify(
    {
      basis: "PR43196d9639",
      runtime: process.version,
      method:
        "Three fresh fixtures per size; no forced GC. Identical production index builder with optional phase measurement. Four local queries, each visible/filtered, compared to normal cached production path. Index mapping and tree construction grouped together. Node CPU measurements, not frames.",
      queryComparisons: 72,
      rows,
    },
    null,
    2,
  ),
);
