import test from "node:test";
import assert from "node:assert/strict";
import { schoolPlanFixture } from "../../../benchmarks/school-plan-fixture.ts";
import { buildBuildingSolid } from "./building-solid.ts";
import { visibleSurfaces } from "./layer-display.ts";
import { classifyAnchorVisibility, lazyAnchorVisibility } from "./anchor-visibility.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import { createWallPointCandidates } from "./wall-point-candidates.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { workingStoreyElevation } from "../../domain/storeys/elevation.ts";
import { createHistory } from "../../application/history/project-history.ts";

// Snap candidate visibility through the prepared depth index instead of a scan over all faces
// (user decision 27.10.2026, docs/performance/SNAP_VISIBILITY_INDEX.md).
const project = createHistory(schoolPlanFixture()).present;
const solid = visibleSurfaces(buildBuildingSolid(project), () => true);
const frame = createProjectionFrame(solid);
const projections = [0.3, 1.7, 3.9].map((yaw, i) =>
  createProjectionState(
    frame,
    { yaw, pitch: [0.5, 0.9, 0.25][i]!, zoom: 1.4, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!,
);
const elevation = workingStoreyElevation(project);
const heights = [elevation, elevation + 1.05];
function* grid() {
  for (let i = 0; i < 12; i++)
    for (let j = 0; j < 8; j++)
      yield {
        x: solid.min[0] - 1 + ((solid.max[0] - solid.min[0] + 2) * (i + 0.5)) / 12,
        y: solid.min[1] - 1 + ((solid.max[1] - solid.min[1] + 2) * (j + 0.5)) / 8,
      };
}

test("indexed anchor visibility equals the full scan on storey and opening height", () => {
  const seen = new Set<string>();
  let checked = 0;
  for (const projection of projections) {
    const indexed = lazyAnchorVisibility(solid, projection);
    for (const h of heights)
      for (const p of grid()) {
        const anchor: [number, number, number] = [p.x, p.y, h];
        const expected = classifyAnchorVisibility(solid, projection, anchor);
        assert.equal(indexed(anchor), expected);
        seen.add(expected);
        checked++;
      }
  }
  assert.equal(checked, 3 * 2 * 12 * 8);
  // The grid covers hidden and visible anchors, not only one answer.
  assert.ok(seen.has("visible") && seen.has("occluded"), [...seen].join());
});

test("snap contexts accept the same candidates as before on both workplanes", () => {
  for (const projection of projections) {
    // Opening height: the separate workplane branch used while moving a door or window.
    const { context } = createWallPreviewContext(
      project,
      projection,
      true,
      0,
      null,
      undefined,
      undefined,
      heights[1],
    );
    const walls = createWallPointCandidates(project, projection);
    for (const p of grid()) {
      assert.equal(
        context.acceptCandidate!({ worldPoint: p } as never),
        classifyAnchorVisibility(solid, projection, [p.x, p.y, heights[1]!]) === "visible",
      );
      assert.equal(
        walls.visibilityAt(p),
        classifyAnchorVisibility(solid, projection, [p.x, p.y, elevation]),
      );
    }
  }
});

test("the index is built once, on the first query, not with the context", () => {
  let reads = 0;
  const counted = {
    get faces() {
      reads++;
      return solid.faces;
    },
  };
  const visibility = lazyAnchorVisibility(counted, projections[0]!);
  assert.equal(reads, 0);
  for (const p of [...grid()].slice(0, 50)) visibility([p.x, p.y, elevation]);
  assert.equal(reads, 1);
});
