// node --experimental-strip-types benchmarks/undo-reuse-profile.ts <l|x> [repoRoot]
// 3D-side derivations after an edit, an undo and a redo (docs/performance/UNDO_STOREY_REUSE.md):
// building solid, wall foot snap sources and local snap sources of the working storey, median of 5,
// plus a hash of the derived results for an equality check against another checkout.
const size = (process.argv[2] ?? "x") as "l" | "x";
const root = process.argv[3] ?? new URL("../", import.meta.url).href;
const load = (path: string) => import(new URL(path, root.endsWith("/") ? root : root + "/").href);
const { schoolFixture } = await import("./school-fixture.ts");
const { schoolPlanFixture } = await import("./school-plan-fixture.ts");
const { snapshotWithWorkingStorey } = await load("src/domain/project/owned-snapshot.ts");
const { createHistory, commitProject, undoProject, redoProject } = await load(
  "src/application/history/project-history.ts",
);
const { buildBuildingSolid } = await load("src/rendering/viewport/building-solid.ts");
const { getWallFootSources } = await load("src/rendering/viewport/wall-foot-sources.ts");
const { getLocalSnapSources } = await load("src/application/snapping/local-sources.ts");
const { updateWall } = await load("src/application/walls/actions.ts");
const { storeyOf } = await load("src/domain/storeys/access.ts");
const { createHash } = await import("node:crypto");

let history = createHistory(
  size === "x"
    ? snapshotWithWorkingStorey(schoolFixture(20000), "s2")
    : schoolPlanFixture({ wings: 3, desksPerRoom: 50 }),
);
const median = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1]!;
const time = (run: () => unknown) => {
  const t0 = performance.now();
  run();
  return performance.now() - t0;
};
const derive = (p: object) => ({
  building: time(() => buildBuildingSolid(p)),
  foot: time(() => getWallFootSources(p)),
  local: time(() => getLocalSnapSources(p)),
});
const rows: Record<"edit" | "undo" | "redo", ReturnType<typeof derive>[]> = {
  edit: [],
  undo: [],
  redo: [],
};
const hash = createHash("sha256");
derive(history.present);
for (let i = 0; i < 6; i++) {
  const p = history.present;
  const wall = storeyOf(p).walls[3]!;
  history = commitProject(
    history,
    updateWall(p, wall.id, { end: { x: wall.end.x + (i % 2 ? -0.2 : 0.2), y: wall.end.y } }),
  );
  rows.edit.push(derive(history.present));
  const undone = undoProject(history);
  rows.undo.push(derive(undone.present));
  const redone = redoProject(undone);
  rows.redo.push(derive(redone.present));
  history = redone;
  for (const project of [undone.present, redone.present]) {
    hash.update(JSON.stringify(buildBuildingSolid(project).faces.length));
    // All wall foot sources: one query over the whole index bounds.
    const foot = getWallFootSources(project);
    const b = foot.bounds;
    if (b) {
      const all = foot.queryPrimitives(
        { x: (b.minX + b.maxX) / 2, y: (b.minY + b.maxY) / 2 },
        1,
        Math.hypot(b.maxX - b.minX, b.maxY - b.minY),
      );
      hash.update(JSON.stringify(all.references.map((r: { feature: string }) => r.feature)));
    }
  }
}
const summary = Object.fromEntries(
  Object.entries(rows).map(([step, list]) => [
    step,
    Object.fromEntries(
      (["building", "foot", "local"] as const).map((k) => [
        k,
        +median(list.slice(1).map((r) => r[k])).toFixed(1),
      ]),
    ),
  ]),
);
process.stdout.write(
  JSON.stringify({ size, root, ...summary, resultsHash: hash.digest("hex").slice(0, 16) }) + "\n",
);
