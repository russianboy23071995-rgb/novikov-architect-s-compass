// node --experimental-strip-types benchmarks/picking-storey-profile.ts <s|l|x>
// Picking index after one wall edit in the building scene (docs/performance/PICKING_PER_STOREY.md):
// complete rebuild (previous behaviour) against the per-storey index, the full-scan fallback
// per click until the index is ready, and equality of every hit against the full scan.
import { schoolPlanFixture } from "./school-plan-fixture.ts";
import { schoolFixture } from "./school-fixture.ts";
import { snapshotWithWorkingStorey } from "../src/domain/project/owned-snapshot.ts";
import { commitProject, createHistory } from "../src/application/history/project-history.ts";
import {
  applySelectionCommand,
  previewSelectionCommand,
} from "../src/application/commands/selection-command.ts";
import {
  ALL_LAYERS_VISIBLE,
  createLayerVisibilityPolicy,
} from "../src/application/layers/visibility.ts";
import { buildBuildingSolid, buildingFacePart } from "../src/rendering/viewport/building-solid.ts";
import { visibleSurfaces } from "../src/rendering/viewport/layer-display.ts";
import { buildWorldPicking } from "../src/rendering/viewport/world-picking.ts";
import {
  buildingWindowSelectionSurfaces,
  pickSolidElement,
} from "../src/rendering/viewport/window-selection.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
import type { Project } from "../src/domain/project/schema.ts";

const size = (process.argv[2] ?? "s") as "s" | "l" | "x";
const config =
  size === "x"
    ? { project: snapshotWithWorkingStorey(schoolFixture(20000), "s2"), wall: "s2-b0" }
    : {
        project:
          size === "l" ? schoolPlanFixture({ wings: 3, desksPerRoom: 50 }) : schoolPlanFixture(),
        wall: "s0-w0-par-n3",
      };
const scene = (p: Project) => ({
  solid: visibleSurfaces(buildBuildingSolid(p), () => true),
  windows: buildingWindowSelectionSurfaces(p, () => true),
});
const drain = <T>(build: Generator<void, T, void>) => {
  let step = build.next();
  while (!step.done) step = build.next();
  return step.value;
};
const time = <T>(run: () => T) => {
  const t0 = performance.now();
  const value = run();
  return { value, ms: performance.now() - t0 };
};
const median = (values: number[]) => [...values].sort((a, b) => a - b)[values.length >> 1]!;

let history = createHistory(config.project);
// Warm the per-storey index on the scene before the edit, as the open 3D view does.
const before = scene(history.present);
drain(buildWorldPicking(before.solid, before.windows, buildingFacePart));
const full: number[] = [],
  storey: number[] = [];
let checked = 0,
  mismatches = 0,
  last = before;
for (let i = 0; i < 6; i++) {
  const p = history.present;
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const text = `Wandlänge auf ${i % 2 ? "8 m" : "8,2 m"}`;
  const targets = [{ kind: "wall" as const, id: config.wall }];
  const next = applySelectionCommand(
    p,
    targets,
    visibility,
    previewSelectionCommand(p, targets, visibility, text),
  );
  history = commitProject(history, next);
  last = scene(history.present);
  full.push(time(() => drain(buildWorldPicking(last.solid, last.windows))).ms);
  const indexed = time(() => drain(buildWorldPicking(last.solid, last.windows, buildingFacePart)));
  storey.push(indexed.ms);
  // Equality against the full scan for several views and a grid of screen points.
  const frame = createProjectionFrame(last.solid);
  for (const yaw of [0.3, 1.9]) {
    const projection = createProjectionState(
      frame,
      { yaw, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
      { left: 0, top: 0, width: 800, height: 600 },
      { width: 800, height: 600 },
    )!;
    for (let k = 0; k < 64; k++) {
      const x = ((k % 8) + 0.5) / 4 - 1,
        y = (Math.floor(k / 8) + 0.5) / 4 - 1;
      const a = indexed.value.query(last.solid, last.windows, projection, x, y).target;
      const b = pickSolidElement(last.solid, last.windows, projection.project, x, y);
      checked++;
      if (JSON.stringify(a) !== JSON.stringify(b)) mismatches++;
    }
  }
}
const projection = createProjectionState(
  createProjectionFrame(last.solid),
  { yaw: 0.8, pitch: 0.6, zoom: 1, panX: 0, panY: 0 },
  { left: 0, top: 0, width: 800, height: 600 },
  { width: 800, height: 600 },
)!;
const index = drain(buildWorldPicking(last.solid, last.windows, buildingFacePart));
const clicks = Array.from({ length: 20 }, (_, k) => ({ x: (k % 5) / 3 - 0.6, y: k / 25 - 0.4 }));
const scan = clicks.map(
  (c) => time(() => pickSolidElement(last.solid, last.windows, projection.project, c.x, c.y)).ms,
);
const query = clicks.map(
  (c) => time(() => index.query(last.solid, last.windows, projection, c.x, c.y)).ms,
);
process.stdout.write(
  JSON.stringify({
    size,
    faces: last.solid.faces.length,
    windows: last.windows.length,
    triangles: index.triangleCount,
    rebuildFullMs: +median(full.slice(1)).toFixed(1),
    rebuildPerStoreyMs: +median(storey.slice(1)).toFixed(1),
    clickFullScanMs: +median(scan).toFixed(2),
    clickIndexMs: +median(query).toFixed(2),
    checked,
    mismatches,
  }) + "\n",
);
