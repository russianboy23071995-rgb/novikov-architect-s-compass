import assert from "node:assert/strict";
import { originFixture } from "./local-origin-fixture.ts";
import { linearMovementOriginQuery } from "./movement-origin-oracle.ts";
import { createMovementOriginQuery } from "../src/rendering/viewport/movement-origin.ts";
const runs = [];
for (const scenario of ["mixed", "empty"] as const)
  for (const zoom of [1, 0.02])
    for (const size of [10, 100]) {
      const { project, view, cursors } = originFixture(size, 0.7, zoom);
      const t = performance.now(),
        full = linearMovementOriginQuery(project, view, () => true),
        t1 = performance.now(),
        local = createMovementOriginQuery(project, view, () => true),
        t2 = performance.now();
      const samples: Record<string, number>[] = [];
      for (let i = 0; i < 40; i++) {
        const cursor =
          scenario === "empty"
            ? { x: -10000 - i, y: -10000 }
            : i % 2
              ? cursors[i % cursors.length]!
              : { x: 40 + i * 11, y: 25 + i * 7 };
        let a, b;
        const times: Record<string, number> = {};
        for (const which of i % 2 ? ["local", "full"] : ["full", "local"]) {
          const start = performance.now();
          if (which === "local") a = local(cursor);
          else b = full(cursor);
          times[which] = performance.now() - start;
        }
        assert.deepEqual(a, b);
        samples.push(times);
      }
      const median = (key: string) => {
        const v = samples
          .slice(2)
          .map((s) => s[key]!)
          .sort((a, b) => a - b);
        return (v[18]! + v[19]!) / 2;
      };
      runs.push({
        scenario,
        walls: size * 5,
        zoom,
        preparationMs: { full: t1 - t, local: t2 - t1 },
        samples,
        medianMs: { full: median("full"), local: median("local") },
      });
    }
console.log(
  JSON.stringify(
    {
      method:
        "Frozen linear oracle versus local index; alternating order; 40 queries, first two excluded from median; preparation sequential full then local with shared warmed geometry (not comparable cold timings), equality outside timing; no frame guarantee",
      runs,
    },
    null,
    2,
  ),
);
