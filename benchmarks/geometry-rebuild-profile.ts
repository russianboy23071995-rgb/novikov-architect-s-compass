import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { cpus } from "node:os";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { updateWall, updateWindow } from "../src/lib/bim/model.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
import { buildBuildingSolid, type Solid } from "../src/lib/bim/geometry.ts";

// Diagnostics only: exact anchors, exclusive sibling, cleanup even on failed oracle.
const generated = new URL("../src/lib/bim/geometry.rebuild-probe.ts", import.meta.url);
let source = (
  await readFile(new URL("../src/lib/bim/geometry.ts", import.meta.url), "utf8")
).replaceAll("\r\n", "\n");
function replace(anchor: string, replacement: string) {
  assert.equal(source.split(anchor).length, 2, `Unique anchor: ${anchor}`);
  source = source.replace(anchor, replacement);
}
source += `\nexport const rebuilds: {id:string; kind:string; ms:number}[] = [];\n`;
replace(
  "    const connection = joined.get(wall.id);",
  "    const wallStart = performance.now();\n    const connection = joined.get(wall.id);",
);
replace(
  "      continue;",
  "      rebuilds.push({id: wall.id, kind: 'connected', ms: performance.now()-wallStart});\n      continue;",
);
replace("  if (!solid.faces.length) {", "  if (!solid.faces.length) {");
const end = "\n  }\n  if (!solid.faces.length) {";
replace(
  end,
  "\n    rebuilds.push({id: wall.id, kind: 'free', ms: performance.now()-wallStart});" + end,
);
const groups = (solid: Solid) => {
  const result = new Map<string, Solid["faces"]>();
  for (const face of solid.faces) {
    const group = result.get(face.wallId);
    if (group) group.push(face);
    else result.set(face.wallId, [face]);
  }
  return result;
};
await writeFile(generated, source, { flag: "wx" });
try {
  const probe = (await import(generated.href)) as {
    buildBuildingSolid: typeof buildBuildingSolid;
    rebuilds: { id: string; kind: string; ms: number }[];
  };
  const rows = [];
  for (const extra of [0, 100, 1000])
    for (const kind of ["free-wall", "free-window", "connected-window", "storey-height"] as const)
      for (let trial = 0; trial < 7; trial++) {
        const input = structuredClone(boundHeightFixture());
        const eg = input.storeys[0]!;
        for (let i = 0; i <= extra; i++) {
          eg.walls.push({
            ...eg.walls[0]!,
            id: `free-${i}`,
            start: { x: 20 + i * 5, y: 10 },
            end: { x: 23 + i * 5, y: 10 + (trial % 3) },
            baseOffset: trial % 2 ? -0.2 : 0.15,
          });
          eg.windows.push({ ...eg.windows[0]!, id: `free-window-${i}`, wallId: `free-${i}` });
        }
        eg.walls[0]!.thickness += trial * 0.0001;
        eg.walls[1]!.thickness = eg.walls[0]!.thickness;
        const base = createProjectSnapshot(input);
        const before = probe.buildBuildingSolid(base);
        let changed;
        if (kind === "free-wall")
          changed = updateWall(base, "free-0", { end: { x: 23.2, y: 10 + (trial % 3) } });
        else if (kind === "free-window")
          changed = updateWindow(base, "free-window-0", { width: 1.4 });
        else if (kind === "connected-window")
          changed = updateWindow(base, "eg-window", { width: 1.4 });
        else
          changed = setStoreyHeight(base, base, {
            projectId: base.id,
            storeyId: "eg",
            height: 3.5,
          });
        const model = createProjectSnapshot(changed);
        probe.rebuilds.length = 0;
        let actual!: Solid,
          expected!: Solid,
          totalMs = 0,
          controlMs = 0;
        const order = trial % 2 ? ["control", "probe"] : ["probe", "control"];
        for (const path of order) {
          const start = performance.now();
          if (path === "probe") {
            actual = probe.buildBuildingSolid(model);
            totalMs = performance.now() - start;
          } else {
            expected = buildBuildingSolid(model);
            controlMs = performance.now() - start;
          }
        }
        assert.deepEqual(actual, expected);
        assert.ok(Object.isFrozen(actual) && Object.isFrozen(actual.faces));
        const prior = groups(before),
          next = groups(actual);
        const changedIds = [...next.keys()].filter(
          (id) => !isDeepStrictEqual(prior.get(id), next.get(id)),
        );
        assert.ok(changedIds.length > 0);
        const unchanged = probe.rebuilds.filter((r) => !changedIds.includes(r.id));
        const free = probe.rebuilds.filter((r) => r.kind === "free");
        rows.push({
          extra,
          kind,
          trial,
          order,
          totalMs,
          controlMs,
          overheadMs: totalMs - controlMs,
          changedIds,
          rebuilt: probe.rebuilds.length,
          freeRebuilt: free.length,
          unchangedRebuilt: unchanged.length,
          unchangedFreeRebuilt: unchanged.filter((r) => r.kind === "free").length,
          freeLoopMs: free.reduce((n, r) => n + r.ms, 0),
          unchangedFreeLoopMs: unchanged
            .filter((r) => r.kind === "free")
            .reduce((n, r) => n + r.ms, 0),
        });
      }
  console.log(
    JSON.stringify(
      {
        basis: "PR415 91442d3; product main e927cf9",
        runtime: process.version,
        cpu: cpus()[0]?.model,
        method:
          "Four independent changes, 0/100/1000 rest free walls plus one fixed free target; 7 trials, 84 full geometry comparisons. Prior scene warm; changed immutable scene cache miss. Mutation/snapshot creation and equality classification outside timing. Complete world faces/normals per wall determine unchanged output, not a safe cache key. Timers wrap free loop; final elevation/freeze outside. Connected timing excludes connectedWallSolids preparation. Alternating control/probe, shared lower caches and JIT/GC/system noise remain; differences are observed instrumentation/order effect, not exact correction. CPU only, no browser/frame/GPU/native.",
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  await unlink(generated);
}
