import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { updateWall, addWall } from "../../lib/bim/model.ts";
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
  const closed = { ...open, storey: { ...open.storey, windows: [] } };
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
