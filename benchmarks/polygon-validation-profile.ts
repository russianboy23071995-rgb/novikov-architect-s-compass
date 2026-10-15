import assert from "node:assert/strict";
import { validateSimplePolygon as indexed } from "../src/geometry/polygons/simple-polygon.ts";
import { validateSimplePolygon as full } from "./polygon-validation-oracle.ts";
const profiles = [];
for (const size of [100, 200, 500, 2000]) {
  for (const concave of [false, true]) {
    const base = Array.from({ length: size }, (_, i) => {
      const a = (2 * Math.PI * i) / size,
        r = concave && i % 2 ? 7 : 10;
      return { x: Math.cos(a) * r, y: Math.sin(a) * r };
    });
    const samples: Record<string, number>[] = [];
    for (let i = 0; i < 9; i++) {
      const points = base.map((p) => ({ x: p.x + i * 0.27, y: p.y - i * 0.13 }));
      const values: Record<string, number> = {};
      const runs: [string, typeof full][] =
        i % 2
          ? [
              ["full", full],
              ["indexed", indexed],
            ]
          : [
              ["indexed", indexed],
              ["full", full],
            ];
      for (const [name, run] of runs) {
        const start = performance.now();
        const result = run(points);
        values[name] = performance.now() - start;
        assert.deepEqual(result, full(points));
      }
      samples.push(values);
    }
    const median = (key: string) => {
      const values = samples
        .slice(1)
        .map((s) => s[key]!)
        .sort((a, b) => a - b);
      return (values[3]! + values[4]!) / 2;
    };
    profiles.push({
      size,
      concave,
      samples,
      warmMedianMs: { full: median("full"), indexed: median("indexed") },
    });
  }
}
console.log(
  JSON.stringify(
    {
      method:
        "Node, translated rings; one first plus eight warm evaluations; alternating order; index construction included; full result equality each time. Polygon validation only, not frame time. Dense overlapping bounds may remain quadratic.",
      profiles,
    },
    null,
    2,
  ),
);
