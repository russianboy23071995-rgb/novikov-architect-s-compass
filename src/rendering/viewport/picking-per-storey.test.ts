import test from "node:test";
import assert from "node:assert/strict";
import { schoolPlanFixture } from "../../../benchmarks/school-plan-fixture.ts";
import { buildBuildingSolid, buildingFacePart } from "./building-solid.ts";
import { visibleSurfaces, type DisplaySurfaces } from "./layer-display.ts";
import { buildWorldPicking } from "./world-picking.ts";
import { buildingWindowSelectionSurfaces, pickSolidElement } from "./window-selection.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import {
  commitProject,
  createHistory,
  undoProject,
} from "../../application/history/project-history.ts";
import { updateWall } from "../../application/walls/actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";

// Picking index per storey part (user decision 26.10.2026, docs/performance/PICKING_PER_STOREY.md).
const drain = <T>(build: Generator<void, T, void>) => {
  let step = build.next();
  while (!step.done) step = build.next();
  return step.value;
};
function scene(p: Project, allows: (id: string) => boolean = () => true) {
  return {
    solid: visibleSurfaces(buildBuildingSolid(p), allows),
    windows: buildingWindowSelectionSurfaces(p, allows),
  };
}
function assertSameHits(
  solid: DisplaySurfaces,
  windows: ReturnType<typeof buildingWindowSelectionSurfaces>,
  index: ReturnType<typeof drain<{ query: (...args: never[]) => unknown }>> & {
    query: (
      s: DisplaySurfaces,
      w: typeof windows,
      p: NonNullable<ReturnType<typeof createProjectionState>>,
      x: number,
      y: number,
    ) => { target: unknown; depth: number | null };
  },
  plain: typeof index,
) {
  const frame = createProjectionFrame(solid);
  for (const yaw of [0.2, 1.4, 3.6]) {
    const projection = createProjectionState(
      frame,
      { yaw, pitch: 0.5, zoom: 1, panX: 0, panY: 0 },
      { left: 0, top: 0, width: 600, height: 400 },
      { width: 600, height: 400 },
    )!;
    for (let k = 0; k < 100; k++) {
      const x = ((k % 10) + 0.5) / 5 - 1,
        y = (Math.floor(k / 10) + 0.5) / 5 - 1;
      const hit = index.query(solid, windows, projection, x, y);
      assert.deepEqual(hit.target, pickSolidElement(solid, windows, projection.project, x, y));
      const reference = plain.query(solid, windows, projection, x, y);
      assert.deepEqual([hit.target, hit.depth], [reference.target, reference.depth]);
    }
  }
}

test("after an edit only the changed storey is rebuilt and every hit equals the full scan", () => {
  let history = createHistory(schoolPlanFixture());
  const first = scene(history.present);
  const initial = drain(buildWorldPicking(first.solid, first.windows, buildingFacePart));
  assert.equal(initial.reusedParts, 0);
  const wall = storeyOf(history.present).walls[3]!;
  history = commitProject(
    history,
    updateWall(history.present, wall.id, { end: { x: wall.end.x + 0.4, y: wall.end.y } }),
  );
  const edited = scene(history.present);
  const index = drain(buildWorldPicking(edited.solid, edited.windows, buildingFacePart));
  // Five storeys with walls: four reused, the edited one rebuilt.
  assert.equal(index.faceParts, 5);
  assert.equal(index.reusedParts, 4);
  assertSameHits(
    edited.solid,
    edited.windows,
    index,
    drain(buildWorldPicking(edited.solid, edited.windows)),
  );
  // Undo returns to the earlier parts: still exact.
  const undone = scene(undoProject(history).present);
  const back = drain(buildWorldPicking(undone.solid, undone.windows, buildingFacePart));
  assertSameHits(
    undone.solid,
    undone.windows,
    back,
    drain(buildWorldPicking(undone.solid, undone.windows)),
  );
});

test("hidden walls change a part's faces: that part is rebuilt, hits stay exact", () => {
  const p = createHistory(schoolPlanFixture()).present;
  const all = scene(p);
  drain(buildWorldPicking(all.solid, all.windows, buildingFacePart));
  const hidden = new Set(
    storeyOf(p)
      .walls.slice(0, 20)
      .map((w) => w.id),
  );
  const some = scene(p, (id) => !hidden.has(id));
  const index = drain(buildWorldPicking(some.solid, some.windows, buildingFacePart));
  assert.equal(index.reusedParts, 4);
  assertSameHits(
    some.solid,
    some.windows,
    index,
    drain(buildWorldPicking(some.solid, some.windows)),
  );
});

test("equally deep hits in different parts keep the face order (counter-check)", () => {
  const face = (wallId: string) => ({
    wallId,
    vertices: [
      [0, 0, 0],
      [1, 0, 0],
      [0, 1, 0],
    ] as [number, number, number][],
    normal: [0, 0, 1] as [number, number, number],
  });
  const first = face("first"),
    second = face("second");
  const groups = new Map<object, object>([
    [first, { part: 1 }],
    [second, { part: 2 }],
  ]);
  const solid = { faces: [first, second], min: [0, 0, 0], max: [1, 1, 0] } as DisplaySurfaces;
  const projection = createProjectionState(
    { center: [0, 0, 0], radius: 0.85 },
    { yaw: 0, pitch: Math.PI / 2, zoom: 1, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 100, height: 100 },
    { width: 100, height: 100 },
  )!;
  const none: ReturnType<typeof buildingWindowSelectionSurfaces> = [];
  const index = drain(buildWorldPicking(solid, none, (f) => groups.get(f)));
  assert.equal(index.faceParts, 2);
  assert.equal(index.query(solid, none, projection, 0.1, 0.1).target?.id, "first");
  assert.deepEqual(
    index.query(solid, none, projection, 0.1, 0.1).target,
    pickSolidElement(solid, none, projection.project, 0.1, 0.1),
  );
  // A stale scene is never answered by the index.
  assert.throws(() => index.query({ ...solid }, none, projection, 0, 0));
});
