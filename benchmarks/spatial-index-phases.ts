import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { stripTypeScriptTypes } from "node:module";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
import { createBoxIndex, type Box2 } from "../src/geometry/spatial/box-index.ts";
const source = readFileSync(
  new URL("../src/geometry/spatial/box-index.ts", import.meta.url),
  "utf8",
).replace(/\r\n/g, "\n");
let instrumented = source;
const replace = (from: string, to: string) => {
  assert.equal(instrumented.split(from).length, 2, `Instrumentation anchor: ${from}`);
  instrumented = instrumented.replace(from, to);
};
replace(
  "    const box = { ...entries[0]!.box };",
  "    const boundsStart = performance.now();\n    phases.nodes++;\n    const box = { ...entries[0]!.box };",
);
replace(
  "    if (entries.length <= 8) return { box, entries };",
  "    phases.boundsMs += performance.now() - boundsStart;\n    if (entries.length <= 8) return { box, entries };",
);
replace(
  "    entries.sort((a, b) =>",
  "    const sortStart = performance.now();\n    phases.sortItems += entries.length;\n    entries.sort((a, b) =>",
);
replace(
  "    const middle = Math.floor(entries.length / 2);",
  "    phases.sortMs += performance.now() - sortStart;\n    const partitionStart = performance.now();\n    const middle = Math.floor(entries.length / 2);",
);
replace(
  "    return { box, left: build(entries.slice(0, middle))!, right: build(entries.slice(middle))! };",
  "    const left = entries.slice(0, middle), right = entries.slice(middle);\n    phases.partitionMs += performance.now() - partitionStart;\n    return { box, left: build(left)!, right: build(right)! };",
);
replace(
  "  const root = build(\n    input.map((e) => {",
  "  const copyStart = performance.now();\n  const owned = input.map((e) => {",
);
replace(
  "    }),\n  );",
  "    });\n  phases.copyMs += performance.now() - copyStart;\n  const root = build(owned);",
);
instrumented =
  "export const phases = {boundsMs:0,sortMs:0,partitionMs:0,copyMs:0,nodes:0,sortItems:0};\n" +
  instrumented;
const module = (await import(
  "data:text/javascript;base64," +
    Buffer.from(stripTypeScriptTypes(instrumented)).toString("base64")
)) as { createBoxIndex: typeof createBoxIndex; phases: Record<string, number> };
const rows = [];
for (const size of [10, 100, 1000]) {
  const primitives = projectSnapPrimitives(hatchPointFixture(size, 100));
  for (const kind of ["points", "segments"] as const)
    for (let repeat = 0; repeat < 3; repeat++) {
      const start = performance.now();
      const entries =
        kind === "points"
          ? primitives.references.map((r, value) => ({
              value,
              box: { minX: r.point.x, maxX: r.point.x, minY: r.point.y, maxY: r.point.y },
            }))
          : primitives.segments.map((s, value) => ({
              value,
              box: {
                minX: Math.min(s.start.x, s.end.x),
                maxX: Math.max(s.start.x, s.end.x),
                minY: Math.min(s.start.y, s.end.y),
                maxY: Math.max(s.start.y, s.end.y),
              },
            }));
      const entriesMs = performance.now() - start;
      const run = (build: typeof createBoxIndex) => {
        global.gc?.();
        const start = performance.now();
        const index = build(entries);
        return { index, ms: performance.now() - start };
      };
      for (const k of Object.keys(module.phases)) module.phases[k] = 0;
      const first = run(repeat % 2 ? module.createBoxIndex : createBoxIndex),
        second = run(repeat % 2 ? createBoxIndex : module.createBoxIndex);
      const normal = repeat % 2 ? second : first,
        profiled = repeat % 2 ? first : second;
      const boxes: Box2[] = [
        { minX: 9.9, maxX: 10.1, minY: -0.1, maxY: 0.1 },
        { minX: -1, maxX: 1, minY: 9.9, maxY: 10.1 },
        { minX: 30 * (size - 1) + 9.9, maxX: 30 * (size - 1) + 10.1, minY: -0.1, maxY: 0.1 },
        { minX: -100, maxX: 30 * size, minY: -100, maxY: 100 },
        { minX: -100, maxX: -90, minY: -100, maxY: -90 },
      ];
      for (const box of boxes) assert.deepEqual(profiled.index.query(box), normal.index.query(box));
      assert.throws(() =>
        module.createBoxIndex([{ value: 0, box: { minX: NaN, maxX: 1, minY: 0, maxY: 1 } }]),
      );
      rows.push({
        size,
        kind,
        repeat,
        instrumentedFirst: !!(repeat % 2),
        count: entries.length,
        entriesMs,
        normalMs: normal.ms,
        instrumentedMs: profiled.ms,
        phases: { ...module.phases },
      });
    }
}
console.log(
  JSON.stringify(
    {
      basis: "PR433 eaeb885",
      sourceHash: createHash("sha256").update(source).digest("hex"),
      runtime: process.version,
      method:
        "Current production source instrumented in memory using unique checked anchors. Three fresh trees per size/type, alternating normal/profiled order. Optional GC before each build. Bounds entries separate; copying includes validation. Per-node timers perturb measured phases; compare uninstrumented total. Partition slices moved before recursion only in probe; no product changes. 90 ordered query comparisons incl full/empty bounds. No browser/frame/native claim.",
      rows,
    },
    null,
    2,
  ),
);
