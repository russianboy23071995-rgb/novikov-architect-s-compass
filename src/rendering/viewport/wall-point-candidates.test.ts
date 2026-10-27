import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import test from "node:test";
import { schoolPlanFixture } from "../../../benchmarks/school-plan-fixture.ts";
import {
  commitProject,
  createHistory,
  undoProject,
} from "../../application/history/project-history.ts";
import { selectionEdges } from "./selection-outline.ts";
import { visibleSurfaces } from "./layer-display.ts";
import { prepareAnchorVisibility } from "./anchor-visibility.ts";
import { createBoxIndex } from "../../geometry/spatial/box-index.ts";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { updateWall, addWall } from "../../application/walls/actions.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState, backbufferSize } from "./projection-state.ts";
import { createWallPointCandidates } from "./wall-point-candidates.ts";
import { projectSnapPrimitives } from "../../application/snapping/project-references.ts";
import { collectSnapCandidates } from "../../constraints/snapping/candidates.ts";
import { compareSnapCandidates } from "../../constraints/snapping/ranking.ts";

test("a foot corner behind a window is visible, closing the opening occludes it", () => {
  const open = addWall(createExampleProject(), {
    id: "back",
    start: { x: 1.5, y: 2 },
    end: { x: 3, y: 2 },
    height: 2.8,
    thickness: 0.36,
  });
  const closed = { ...replaceStorey(open, { ...storeyOf(open), windows: [] }) };
  for (const [project, visibility] of [
    [open, "visible"],
    [closed, "occluded"],
  ] as const) {
    const s = setup(project, 1, 0.6),
      plane = s.projection.workplane();
    if (plane.status !== "ok") throw Error("plane");
    const screen = plane.value.toScreen({ x: 1.5, y: 1.82 });
    if (screen.status !== "ok") throw Error("screen");
    const result = s.adapter.query(project, s.projection, screen.value, 10);
    if (result.status !== "ok") throw Error(result.reason);
    assert.equal(
      result.candidates.find(
        (c) => c.sourceEntityId === "back" && c.sourceFeature === "corner-0--1",
      )?.visibility,
      visibility,
    );
  }
});

function setup(project = createExampleProject(), zoom = 1, pitch = 0.5, panX = 0) {
  const projection = createProjectionState(
    createProjectionFrame(buildSolid(project)),
    { ...initialCamera, yaw: 0, pitch, zoom, panX },
    { left: 20, top: 30, width: 801, height: 603 },
    backbufferSize(801, 603, 1.25),
  )!;
  return { project, projection, adapter: createWallPointCandidates(project, projection) };
}

test("local wall candidates preserve shared radius, ranking, identity and CSS distances", () => {
  for (const zoom of [0.5, 1, 2]) {
    const { project, projection, adapter } = setup(undefined, zoom);
    const plane = projection.workplane();
    assert.equal(plane.status, "ok");
    if (plane.status !== "ok") throw Error("plane");
    const screen = plane.value.toScreen({ x: 0, y: 0 });
    if (screen.status !== "ok") throw Error("screen");
    const client = { x: screen.value.x + 3, y: screen.value.y + 4 };
    const inverse = plane.value.toPlane(client);
    if (inverse.status !== "ok") throw Error("inverse");
    const result = adapter.query(project, projection, client, 30);
    if (result.status !== "ok") throw Error(result.reason);
    const expected = collectSnapCandidates(
      inverse.value.point,
      {
        references: projectSnapPrimitives(project).references,
        metric: plane.value.metric,
        pixelsPerMetre: 1,
        endpointRadiusPx: 30,
        enabled: true,
        gridSpacing: null,
        orthoOrigin: null,
      },
      (p) => p,
    ).sort(compareSnapCandidates);
    assert.deepEqual(
      result.candidates.map((c) => [c.sourceEntityId, c.sourceFeature, c.distanceOnScreen]),
      expected.map(({ candidate: c }) => [c.sourceEntityId, c.sourceFeature, c.distanceOnScreen]),
    );
    assert.ok(result.candidates.length > 0);
    for (const c of result.candidates) {
      assert.ok(c.distanceOnScreen <= 30);
      assert.equal(c.sourceId, JSON.stringify([c.sourceEntityId, c.sourceFeature]));
      assert.equal(c.modelPoint[2], 0);
    }
  }
});

test("model/projection changes pause old queries; rebuilt queries see changed wall points", () => {
  const { project, projection, adapter } = setup();
  const changed = updateWall(project, "wall-1", { end: { x: 6, y: 0 } });
  assert.deepEqual(adapter.query(changed, projection, { x: 0, y: 0 }, 10), {
    status: "paused",
    reason: "stale-snapshot",
  });
  const next = setup(changed);
  assert.equal(adapter.query(project, next.projection, { x: 0, y: 0 }, 10).status, "paused");
  const plane = next.projection.workplane();
  if (plane.status !== "ok") throw Error("plane");
  const screen = plane.value.toScreen({ x: 6, y: 0 });
  if (screen.status !== "ok") throw Error("screen");
  const found = next.adapter.query(changed, next.projection, screen.value, 10);
  assert.equal(found.status, "ok");
  if (found.status === "ok")
    assert.ok(found.candidates.some((c) => c.sourceFeature === "axis-end" && c.worldPoint.x === 6));
});

test("edge-on inverse and invalid pointer/radius pause explicitly", () => {
  const { project, projection, adapter } = setup(undefined, 1, 0);
  assert.equal(adapter.query(project, projection, { x: 400, y: 300 }, 10).status, "paused");
  for (const radius of [-1, NaN, Infinity])
    assert.equal(adapter.query(project, projection, { x: 400, y: 300 }, radius).status, "paused");
  const normal = setup();
  assert.equal(
    normal.adapter.query(normal.project, normal.projection, { x: NaN, y: 0 }, 10).status,
    "paused",
  );
});

test("visibility is annotated without filtering hidden or outside footpoints", () => {
  const project = addWall(createExampleProject(), {
    id: "back",
    start: { x: 0, y: 2 },
    end: { x: 3, y: 2 },
    height: 2.8,
    thickness: 0.36,
  });
  for (const panX of [0, 3]) {
    const s = setup(project, 1, 0.5, panX),
      plane = s.projection.workplane();
    if (plane.status !== "ok") throw Error("plane");
    const screen = plane.value.toScreen({ x: 1.5, y: 1 });
    if (screen.status !== "ok") throw Error("screen");
    const result = s.adapter.query(project, s.projection, screen.value, 2000);
    if (result.status !== "ok") throw Error(result.reason);
    assert.equal(result.candidates.length, 14);
    assert.ok(result.candidates.some((c) => c.visibility === (panX ? "outside" : "occluded")));
    if (!panX) assert.ok(result.candidates.some((c) => c.visibility === "visible"));
  }
});

import { createMovementOriginQuery, movementCorners } from "./movement-origin.ts";
import { buildBuildingSolid } from "./building-solid.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import { beginSelectionMove } from "../../application/selection/move.ts";
test("3D movement origin acquires real upper corners, respects pixel radius and visibility", () => {
  const project = createExampleProject();
  const projection = createProjectionState(
    createProjectionFrame(buildBuildingSolid(project)),
    initialCamera,
    { left: 20, top: 30, width: 800, height: 600 },
    backbufferSize(800, 600, 1),
  )!;
  const query = createMovementOriginQuery(project, projection, () => true);
  const screen = (p: readonly [number, number, number]) => {
    const q = projection.project(p);
    return { x: 20 + (q[0] + 1) * 400, y: 30 + (1 - q[1]) * 300 };
  };
  const corner = movementCorners(project).find(
    (c) => c.point[2] === 2.8 && query(screen(c.point), 0.01),
  );
  assert.ok(corner);
  const cursor = screen(corner.point);
  assert.deepEqual(query({ x: cursor.x + 4, y: cursor.y }, 10)?.point, corner.point);
  assert.equal(query({ x: cursor.x + 4, y: cursor.y }, 1), null);
  assert.equal(createMovementOriginQuery(project, projection, () => false)(cursor), null);
  const plane = projection.workplane(corner.point[2]);
  assert.equal(plane.status, "ok");
  if (plane.status !== "ok") return;
  const inverse = plane.value.toPlane(cursor);
  assert.equal(inverse.status, "ok");
  if (inverse.status !== "ok") return;
  assert.ok(Math.abs(inverse.value.point.x - corner.point[0]) < 1e-10);
  assert.ok(Math.abs(inverse.value.point.y - corner.point[1]) < 1e-10);
  const session = beginSelectionMove(
    project,
    [{ kind: "wall", id: corner.id }],
    inverse.value.point,
  );
  const context = createWallPreviewContext(
    project,
    projection,
    true,
    0,
    session.snapping,
    undefined,
    undefined,
    corner.point[2],
  );
  assert.equal(context.context.pinnedReferences?.length, 1);
  assert.ok(context.context.acceptReference!(session.snapping.origin));
});

// Start of the 3D group move: corners per storey part, point grid, visibility on demand
// (user decision 27.10.2026, docs/performance/MOVE_START_ORIGIN.md). Oracle = previous code.
function oracleCorners(project: Parameters<typeof buildBuildingSolid>[0]) {
  const solid = buildBuildingSolid(project);
  const grouped = new Map<string, typeof solid.faces>();
  for (const f of solid.faces) grouped.set(f.wallId, [...(grouped.get(f.wallId) ?? []), f]);
  const corners: { id: string; point: readonly [number, number, number] }[] = [];
  for (const [id, faces] of grouped) {
    const points = new Map<string, readonly [number, number, number]>();
    for (const edge of selectionEdges(faces))
      for (const point of edge) points.set(JSON.stringify(point), point);
    for (const point of points.values()) corners.push({ id, point });
  }
  return corners;
}
function oracleQuery(
  project: Parameters<typeof buildBuildingSolid>[0],
  projection: NonNullable<ReturnType<typeof createProjectionState>>,
  allows: (id: string) => boolean,
) {
  const solid = visibleSurfaces(buildBuildingSolid(project), allows);
  const visibility = prepareAnchorVisibility(solid, projection);
  const projected = oracleCorners(project)
    .filter((c) => allows(c.id))
    .map((c) => {
      const p = projection.project(c.point);
      return {
        ...c,
        screen: {
          x: projection.viewport.left + ((p[0] + 1) * projection.viewport.width) / 2,
          y: projection.viewport.top + ((1 - p[1]) * projection.viewport.height) / 2,
        },
      };
    });
  const index = createBoxIndex(
    projected.flatMap((c, order) =>
      Number.isFinite(c.screen.x) && Number.isFinite(c.screen.y)
        ? [
            {
              box: { minX: c.screen.x, maxX: c.screen.x, minY: c.screen.y, maxY: c.screen.y },
              value: order,
            },
          ]
        : [],
    ),
  );
  return (client: { x: number; y: number }, radius = 10, height?: number) =>
    index
      .query({
        minX: client.x - radius,
        maxX: client.x + radius,
        minY: client.y - radius,
        maxY: client.y + radius,
      })
      .sort((a, b) => a - b)
      .map((i) => projected[i]!)
      .map((c) => ({ ...c, distance: Math.hypot(c.screen.x - client.x, c.screen.y - client.y) }))
      .filter(
        (c) =>
          c.distance <= radius && (height === undefined || Math.abs(c.point[2] - height) < 1e-8),
      )
      .sort((a, b) => a.distance - b.distance)
      .find((c) => visibility(c.point) === "visible") ?? null;
}

test("movement corners per storey part equal the previous derivation, also after an edit", () => {
  let history = createHistory(schoolPlanFixture());
  const first = movementCorners(history.present);
  assert.deepEqual(first, oracleCorners(history.present));
  const wall = storeyOf(history.present).walls[3]!;
  history = commitProject(
    history,
    updateWall(history.present, wall.id, { end: { x: wall.end.x + 0.4, y: wall.end.y } }),
  );
  const edited = movementCorners(history.present);
  assert.deepEqual(edited, oracleCorners(history.present));
  // Unchanged storeys keep their corner objects; the edited wall's corners are new.
  const before = new Set(first);
  assert.ok(edited.filter((c) => before.has(c)).length > edited.length / 2);
  assert.ok(edited.filter((c) => c.id === wall.id).every((c) => !before.has(c)));
  assert.deepEqual(movementCorners(undoProject(history).present), first);
});

test("the origin query with point grid and lazy visibility answers exactly like before", () => {
  const project = createHistory(schoolPlanFixture()).present;
  const hidden = new Set(
    storeyOf(project)
      .walls.slice(0, 15)
      .map((w) => w.id),
  );
  let hits = 0;
  for (const [yaw, zoom] of [
    [0.8, 1.4],
    [2.6, 0.9],
  ] as const) {
    const projection = createProjectionState(
      createProjectionFrame(buildBuildingSolid(project)),
      { yaw, pitch: 0.55, zoom, panX: 0, panY: 0 },
      { left: 10, top: 20, width: 900, height: 600 },
      { width: 900, height: 600 },
    )!;
    for (const allows of [() => true, (id: string) => !hidden.has(id)]) {
      const query = createMovementOriginQuery(project, projection, allows);
      const oracle = oracleQuery(project, projection, allows);
      for (let gx = 0; gx < 15; gx++)
        for (let gy = 0; gy < 10; gy++)
          for (const [radius, height] of [
            [4, undefined],
            [10, undefined],
            [10, 0],
            [25, undefined],
            [2000, undefined],
          ] as const) {
            const client = { x: 10 + gx * 60 + 3, y: 20 + gy * 60 + 7 };
            const actual = query(client, radius, height);
            assert.deepEqual(actual, oracle(client, radius, height));
            if (actual) hits++;
          }
    }
  }
  assert.ok(hits > 150, `${hits} hits`);
});
