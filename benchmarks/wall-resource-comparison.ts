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
const generated = new URL("../src/lib/bim/geometry.wall-resource-candidate.ts", import.meta.url);
const source = await readFile(new URL("./wall-resource-candidate.txt", import.meta.url), "utf8");
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
  };
  const rows = [];
  for (const extra of [0, 100, 1000])
    for (const kind of ["free-wall", "free-window", "connected-window", "storey-height"] as const)
      for (let trial = 0; trial < 7; trial++) {
        const input = structuredClone(boundHeightFixture());
        input.id = `resource-${extra}-${kind}-${trial}`;
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
        const oldColdStart = performance.now();
        const before = probe.buildBuildingSolid(base);
        const coldOldMs = performance.now() - oldColdStart;
        const newColdStart = performance.now();
        const newBefore = buildBuildingSolid(base);
        const coldNewMs = performance.now() - newColdStart;
        assert.deepEqual(newBefore, before);
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
        const prior = groups(before),
          next = groups(actual);
        const changedIds = [...next.keys()].filter(
          (id) => !isDeepStrictEqual(prior.get(id), next.get(id)),
        );
        assert.ok(changedIds.length > 0);

        rows.push({
          coldOldMs,
          coldNewMs,
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
        basis: "main 5d0ca31 vs bundled wall resources",
        runtime: process.version,
        cpu: cpus()[0]?.model,
        method:
          "Unique project ID per scene forces cold fallback (no prior resource match). Cold base then one change: free wall/window, connected window, storey height; 0/100/1000 rest walls + fixed target, 7 trials. Archived replay: totalMs=candidate, controlMs=production; coldOldMs=candidate, coldNewMs=production; historical results use opposite role mapping; old/new changed order alternates, cold old always first. 84 cold and 84 changed full geometry comparisons per process. Snapshot/action outside timing. Shared lower caches, JIT/GC/order uncontrolled; no CPU percentile, browser/frame/GPU/native claim.",
        rows,
      },
      null,
      2,
    ),
  );
} finally {
  await unlink(generated);
}
