// node --experimental-strip-types benchmarks/move-start-profile.ts <l|x> [repoRoot]
// Start of the 3D group move (docs/performance/MOVE_START_ORIGIN.md): building the movement
// origin query after a wall edit, the first query and the first query that checks visibility,
// plus a hash of all query results on a screen grid for an equality check against main.
const size = (process.argv[2] ?? "x") as "l" | "x";
const root = process.argv[3] ?? new URL("../", import.meta.url).href;
const load = (path: string) => import(new URL(path, root.endsWith("/") ? root : root + "/").href);
const { schoolFixture } = await import("./school-fixture.ts");
const { schoolPlanFixture } = await import("./school-plan-fixture.ts");
const { snapshotWithWorkingStorey } = await load("src/domain/project/owned-snapshot.ts");
const { createHistory, commitProject } = await load("src/application/history/project-history.ts");
const { buildBuildingSolid } = await load("src/rendering/viewport/building-solid.ts");
const { createMovementOriginQuery, movementCorners } = await load(
  "src/rendering/viewport/movement-origin.ts",
);
const { createProjectionFrame } = await load("src/geometry/projections/orthographic.ts");
const { createProjectionState } = await load("src/rendering/viewport/projection-state.ts");
const { updateWall } = await load("src/application/walls/actions.ts");
const { storeyOf } = await load("src/domain/storeys/access.ts");
const { createHash } = await import("node:crypto");

let history = createHistory(
  size === "x"
    ? snapshotWithWorkingStorey(schoolFixture(20000), "s2")
    : schoolPlanFixture({ wings: 3, desksPerRoom: 50 }),
);
const median = (v: number[]) => [...v].sort((a, b) => a - b)[v.length >> 1]!;
const time = <T>(run: () => T) => {
  const t0 = performance.now();
  const value = run();
  return { value, ms: performance.now() - t0 };
};
// Warm caches as an open 3D view does before the first move.
movementCorners(history.present);
const rows = { corners: [] as number[], query: [] as number[], first: [] as number[] };
let hash = "";
for (let i = 0; i < 6; i++) {
  const p = history.present;
  const wall = storeyOf(p).walls[3]!;
  history = commitProject(
    history,
    updateWall(p, wall.id, { end: { x: wall.end.x + (i % 2 ? -0.2 : 0.2), y: wall.end.y } }),
  );
  const project = history.present;
  const solid = buildBuildingSolid(project);
  const projection = createProjectionState(
    createProjectionFrame(solid),
    { yaw: 0.8, pitch: 0.6, zoom: 1.6, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 1200, height: 800 },
    { width: 1200, height: 800 },
  )!;
  rows.corners.push(time(() => movementCorners(project)).ms);
  const query = time(() => createMovementOriginQuery(project, projection, () => true));
  rows.query.push(query.ms);
  // First query near the screen centre (checks visibility of the nearest candidates).
  rows.first.push(time(() => query.value({ x: 600, y: 400 }, 40)).ms);
  if (i === 0) {
    // Every result on a 40 × 30 grid with three radii: equal sets, order and winners.
    const results: unknown[] = [];
    for (let gx = 0; gx < 40; gx++)
      for (let gy = 0; gy < 30; gy++)
        for (const radius of [4, 10, 25])
          results.push(query.value({ x: gx * 30 + 7, y: gy * 26 + 5 }, radius));
    hash = createHash("sha256").update(JSON.stringify(results)).digest("hex").slice(0, 16);
  }
}
process.stdout.write(
  JSON.stringify({
    size,
    root,
    cornersAfterEditMs: +median(rows.corners.slice(1)).toFixed(1),
    originQueryMs: +median(rows.query.slice(1)).toFixed(1),
    firstQueryMs: +median(rows.first.slice(1)).toFixed(1),
    resultsHash: hash,
  }) + "\n",
);
