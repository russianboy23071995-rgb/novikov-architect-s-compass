/** Diagnostic only: isolate the four existing cold-index preparation phases. */
import { readFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { referenceKey } from "../src/constraints/inference/construction-reference.ts";
import { createBoxIndex } from "../src/geometry/spatial/box-index.ts";
import { createBoxIndex as baseline } from "./box-index-baseline.ts";

function freeze(value: object): void {
  for (const nested of Object.values(value))
    if (nested && typeof nested === "object") freeze(nested);
  Object.freeze(value);
}
function measure(
  index: typeof createBoxIndex,
  project: Parameters<typeof projectSnapPrimitives>[0],
) {
  const { references, segments } = projectSnapPrimitives(project);
  const t = [performance.now()];
  freeze(references);
  freeze(segments);
  t.push(performance.now());
  const lookup = new Map(references.map((r) => [referenceKey(r), r]));
  t.push(performance.now());
  const points = index(
    references.map((r, value) => ({
      value,
      box: {
        minX: r.point.x,
        maxX: r.point.x,
        minY: r.point.y,
        maxY: r.point.y,
      },
    })),
  );
  t.push(performance.now());
  const lines = index(
    segments.map((s, value) => ({
      value,
      box: {
        minX: Math.min(s.start.x, s.end.x),
        maxX: Math.max(s.start.x, s.end.x),
        minY: Math.min(s.start.y, s.end.y),
        maxY: Math.max(s.start.y, s.end.y),
      },
    })),
  );
  t.push(performance.now());
  // Consume the structures outside the measured preparation intervals.
  const box = { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  return {
    phasesMs: t.slice(1).map((v, i) => v - t[i]!),
    counts: [lookup.size, points.query(box).length, lines.query(box).length],
  };
}
const path = process.argv[2];
if (!path) throw new Error("Pass a project JSON fixture path");
const project = JSON.parse(readFileSync(path, "utf8"));
console.log(
  JSON.stringify(
    {
      phaseOrder: ["freeze", "lookup", "points", "segments"],
      runs: Array.from({ length: 7 }, (_, i) => {
        // Alternate order to reduce systematic first-run advantage.
        if (i % 2) {
          const optimized = measure(createBoxIndex, project);
          return { baseline: measure(baseline, project), optimized };
        }
        return {
          baseline: measure(baseline, project),
          optimized: measure(createBoxIndex, project),
        };
      }),
    },
    null,
    2,
  ),
);
