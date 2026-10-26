import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { cpus } from "node:os";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";

// Temporary sibling preserves the real imports/algorithm. Never patch product source.
// Fail closed if an instrumentation anchor changes; exclusive creation + finally cleanup.
const original = new URL("../src/lib/bim/geometry.ts", import.meta.url);
const generated = new URL("../src/lib/bim/geometry.detail-probe.ts", import.meta.url);
let source = (await readFile(original, "utf8")).replaceAll("\r\n", "\n");
const replace = (anchor: string, replacement: string) => {
  assert.equal(source.split(anchor).length, 2, `Unique instrumentation anchor: ${anchor}`);
  source = source.replace(anchor, replacement);
};
source += `\nexport const phaseTimes: Record<string, number> = {};
function addTime(key: string, start: number) { phaseTimes[key] = (phaseTimes[key] ?? 0) + performance.now() - start; }
`;
replace(
  "  const joined = new Map(connectedWallSolids(project).map((w) => [w.wallId, w]));",
  "  const joinedStart = performance.now();\n  const joined = new Map(connectedWallSolids(project).map((w) => [w.wallId, w]));\n  addTime('connectionsMs', joinedStart);\n  const wallsStart = performance.now();",
);
replace(
  "    const openings = (windowsByHost.get(wall.id) ?? [])",
  "    const openingsStart = performance.now();\n    const openings = (windowsByHost.get(wall.id) ?? [])",
);
replace(
  "    const sorted = (values: number[])",
  "    addTime('openingLookupMs', openingsStart);\n    const sorted = (values: number[])",
);
replace(
  "  if (!solid.faces.length) {",
  "  addTime('wallLoopInclusiveMs', wallsStart);\n  const heightStart = performance.now();\n  if (!solid.faces.length) {",
);
replace("  return solid;", "  addTime('heightMs', heightStart);\n  return solid;");
replace(
  "function freezeBuilding(result: Solid): Solid {",
  "function freezeBuilding(result: Solid): Solid {\n  const freezeStart = performance.now();",
);
replace(
  "  return Object.freeze(result);",
  "  const frozen = Object.freeze(result);\n  addTime('freezeMs', freezeStart);\n  return frozen;",
);
replace(
  "  const parts = project.storeys",
  "  const partsStart = performance.now();\n  const parts = project.storeys",
);
replace(
  "  const result: Solid = {",
  "  addTime('partsInclusiveMs', partsStart);\n  const aggregateStart = performance.now();\n  const result: Solid = {",
);
replace(
  "  const entry = { project, result: freezeBuilding(result) };",
  "  addTime('aggregateMs', aggregateStart);\n  const entry = { project, result: freezeBuilding(result) };",
);
replace(
  "    const sorted = (values: number[])",
  "    const gridStart = performance.now();\n    const sorted = (values: number[])",
);
replace(
  "    const world = ([x, y, z]: Vec3): Vec3 => [",
  "    addTime('openingGridMs', gridStart);\n    const world = ([x, y, z]: Vec3): Vec3 => [",
);
replace(
  '      const vertices = points.map(world) as Face["vertices"];',
  "      const transformStart = performance.now();\n      const vertices = points.map(world) as Face[\"vertices\"];\n      addTime('transformMs', transformStart);\n      const boundsStart = performance.now();",
);
replace(
  "      solid.faces.push({",
  "      addTime('boundsMs', boundsStart);\n      phaseTimes.faceCount = (phaseTimes.faceCount ?? 0) + 1;\n      solid.faces.push({",
);
await writeFile(generated, source, { flag: "wx" });
try {
  const probe = (await import(generated.href)) as {
    buildBuildingSolid: typeof buildBuildingSolid;
    phaseTimes: Record<string, number>;
  };
  const rows = [];
  for (const windows of [false, true])
    for (const extra of [0, 100, 1000])
      for (let trial = 0; trial < 7; trial++) {
        const input = structuredClone(boundHeightFixture());
        const eg = input.storeys[0]!;
        // Distinct geometry defeats recent-model equality reuse between trials.
        eg.walls[0]!.thickness += trial * 0.0001;
        eg.walls[1]!.thickness = eg.walls[0]!.thickness;
        for (let i = 0; i < extra; i++) {
          eg.walls.push({
            ...eg.walls[0]!,
            id: `rest-${i}`,
            start: { x: 20 + i * 5, y: 10 },
            end: { x: 23 + i * 5, y: 10 + (trial % 3) },
            baseOffset: trial % 2 ? -0.2 : 0.15,
          });
          if (windows)
            eg.windows.push({ ...eg.windows[0]!, id: `window-${i}`, wallId: `rest-${i}` });
        }
        const project = createProjectSnapshot(input);
        for (const key of Object.keys(probe.phaseTimes)) delete probe.phaseTimes[key];
        const order = trial % 2 ? ["control", "probe"] : ["probe", "control"];
        let actual!: ReturnType<typeof buildBuildingSolid>;
        let expected!: ReturnType<typeof buildBuildingSolid>;
        let totalMs = 0,
          controlMs = 0;
        for (const path of order) {
          const start = performance.now();
          if (path === "probe") {
            actual = probe.buildBuildingSolid(project);
            totalMs = performance.now() - start;
          } else {
            expected = buildBuildingSolid(project);
            controlMs = performance.now() - start;
          }
        }
        assert.ok((probe.phaseTimes["partsInclusiveMs"] ?? 0) > 0, "Must measure a cache miss");
        const phases = { ...probe.phaseTimes };
        assert.deepEqual(actual, expected);
        assert.ok(Object.isFrozen(actual) && Object.isFrozen(actual.faces));
        rows.push({
          windows,
          extra,
          trial,
          order,
          totalMs,
          overheadMs: totalMs - controlMs,
          controlMs,
          phases,
          wallLoopExclusiveMs: phases["wallLoopInclusiveMs"]! - phases["openingLookupMs"]!,
          faces: actual.faces.length,
        });
      }
  console.log(
    JSON.stringify(
      {
        runtime: process.version,
        cpu: cpus()[0]?.model,
        basis: "PR413 74dcdd5; unchanged product geometry from main dacfee1",
        method:
          "Two window densities; 0/100/1000 extra walls; 7 fresh owned scenes. Instrumented original algorithm in temporary sibling; production source unchanged. Nested wallLoop/parts phases must not be summed. Window lookup includes host Map lookup+map; grouping construction remains in inclusive wall loop. Control/probe alternate order. Fine timers per face perturb hot paths; total minus control is observed instrumentation/order/JIT/GC difference, not a pure timer correction. Shared lower-level caches remain. Trial angle varies 0/1/2 m and base offset -0.2/0.15 m. Not a paired optimization comparison. Snapshot preparation excluded. CPU only, no browser/GPU/frame/native claim. Full faces, volume, bounds equivalence in all 42 cases; fixed order, timer overhead/JIT/GC uncontrolled.",
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  await unlink(generated);
}
