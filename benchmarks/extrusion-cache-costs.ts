import assert from "node:assert/strict";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { cpus } from "node:os";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { createProjectSnapshot } from "../src/domain/project/owned-snapshot.ts";
import { updateWindow } from "../src/application/windows/actions.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { setStoreyHeight } from "../src/application/storeys/actions.ts";
import { buildBuildingSolid, type Solid } from "../src/lib/bim/geometry.ts";

// Diagnostics only: exact anchors, exclusive sibling, cleanup even on failed oracle.
const generated = new URL("../src/lib/bim/geometry.cache-control.ts", import.meta.url);
const source = await readFile(new URL("./free-wall-reuse-candidate.txt", import.meta.url), "utf8");
const groups = (solid: Solid) => {
  const result = new Map<string, Solid["faces"]>();
  for (const face of solid.faces) {
    const group = result.get(face.wallId);
    if (group) group.push(face);
    else result.set(face.wallId, [face]);
  }
  return result;
};
const instrumented = new URL("../src/lib/bim/geometry.cache-probe.ts", import.meta.url);
let measured = source.replaceAll("\r\n", "\n");
function patch(anchor: string, replacement: string) {
  assert.equal(measured.split(anchor).length, 2, "Unique probe anchor: " + anchor);
  measured = measured.replace(anchor, replacement);
}
measured += `\nexport const cacheCosts: Record<string, number> = {};\nfunction addCost(k:string,t:number){cacheCosts[k]=(cacheCosts[k]??0)+performance.now()-t;}\nfunction count(k:string){cacheCosts[k]=(cacheCosts[k]??0)+1;}\n`;
patch(
  "    const signature = reuse",
  "    const signatureStart = performance.now();\n    const signature = reuse",
);
patch(
  "    const prior = reuse?.prior?.get(wall.id);",
  '    const prior = reuse?.prior?.get(wall.id);\n    addCost("signatureMs", signatureStart);',
);
patch(
  "      for (const value of prior.volumes)",
  '      count("hits");\n      const hitStart = performance.now();\n      for (const value of prior.volumes)',
);
patch(
  "      reuse!.next.set(wall.id, prior);",
  '      reuse!.next.set(wall.id, prior);\n      addCost("hitReplayMs", hitStart);',
);
patch(
  "    const faceStart = solid.faces.length;",
  '    count("misses");\n    const extrusionStart = performance.now();\n    const faceStart = solid.faces.length;',
);
patch(
  "    if (reuse) {\n      const faces = solid.faces.slice(faceStart);",
  '    addCost("missExtrusionMs", extrusionStart);\n    if (reuse) {\n      const publishStart = performance.now();\n      const faces = solid.faces.slice(faceStart);',
);
patch(
  "      reuse.next.set(wall.id, Object.freeze({ signature, faces, volumes }));",
  '      reuse.next.set(wall.id, Object.freeze({ signature, faces, volumes }));\n      addCost("publishMs", publishStart);',
);
patch(
  "  const bases = new Map(",
  "  const elevationStart = performance.now();\n  const bases = new Map(",
);
patch("  return solid;", '  addCost("elevationMs", elevationStart);\n  return solid;');
patch(
  "function freezeBuilding(result: Solid): Solid {",
  "function freezeBuilding(result: Solid): Solid {\n  const freezeStart = performance.now();",
);
patch(
  "    if (frozenFaces.has(face)) continue;",
  '    if (frozenFaces.has(face)) {count("frozenHits");continue;}\n    count("freshFrozen");',
);
patch(
  "  return Object.freeze(result);",
  '  const frozen=Object.freeze(result);\n  addCost("freezeMs",freezeStart);\n  return frozen;',
);
await writeFile(generated, source, { flag: "wx" });
let instrumentedCreated = false;
try {
  await writeFile(instrumented, measured, { flag: "wx" });
  instrumentedCreated = true;
  const diagnostic = (await import(instrumented.href)) as {
    buildBuildingSolid: typeof buildBuildingSolid;
    cacheCosts: Record<string, number>;
  };
  const probe = (await import(generated.href)) as {
    buildBuildingSolid: typeof buildBuildingSolid;
  };
  const rows = [];
  for (const extra of [0, 1000])
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
        assert.deepEqual(buildBuildingSolid(base), before);
        assert.deepEqual(diagnostic.buildBuildingSolid(base), before);
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
        for (const key of Object.keys(diagnostic.cacheCosts)) delete diagnostic.cacheCosts[key];
        const diagnosticStart = performance.now();
        const diagnosticSolid = diagnostic.buildBuildingSolid(model);
        const diagnosticMs = performance.now() - diagnosticStart;
        assert.deepEqual(diagnosticSolid, expected);
        const phases = { ...diagnostic.cacheCosts };
        const prior = groups(before),
          next = groups(actual);
        const changedIds = [...next.keys()].filter(
          (id) => !isDeepStrictEqual(prior.get(id), next.get(id)),
        );
        assert.ok(changedIds.length > 0);

        rows.push({
          diagnosticMs,
          diagnosticDifferenceMs: diagnosticMs - totalMs,
          phases,
          extra,
          kind,
          trial,
          order,
          totalMs,
          controlMs,
          overheadMs: totalMs - controlMs,
          changedIds,
        });
      }
  console.log(
    JSON.stringify(
      {
        basis: "PR417 709df03; unchanged production main 11a13b1",
        runtime: process.version,
        cpu: cpus()[0]?.model,
        method:
          "Production vs uninstrumented archived candidate alternate order; instrumented candidate runs afterward. 2 sizes, 4 independent changes, 7 trials = 56 cases. Base scenes built first. totalMs=candidate, controlMs=production, diagnosticMs=instrumented candidate. Extra timers/counters and third execution perturb JIT/GC/lower caches; difference not pure timer correction. Phases inclusive, signature comparison included in hit/miss residual. Snapshot/mutation outside timing. Two complete equality comparisons per case. No browser/GPU/frame/native claim.",
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  await unlink(generated);
  if (instrumentedCreated) await unlink(instrumented);
}
