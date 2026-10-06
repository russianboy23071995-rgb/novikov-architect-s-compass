import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { addWall, updateWall, updateWindow } from "../../lib/bim/model.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "./projection-state.ts";
import { getWallFootSources } from "./wall-foot-sources.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import {
  hoveredSegment,
  withParallelDirections,
} from "../../constraints/inference/segment-hover.ts";
import {
  advanceHoverReference,
  emptyHoverReference,
  suspendHoverReference,
  sameHoverSession,
} from "../../constraints/inference/hover-reference.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import { advanceGuideDirections } from "../../constraints/guides/directions.ts";

const project = createExampleProject();
const projection = (yaw = 0, zoom = 1) =>
  createProjectionState(
    createProjectionFrame(buildSolid(project)),
    { ...initialCamera, yaw, pitch: 0.5, zoom },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;

test("foot edge index uses actual material, caches by model and excludes a floor-level opening", () => {
  assert.equal(getWallFootSources(project), getWallFootSources(project));
  const opened = updateWindow(project, "window-1", { sillHeight: 0 });
  const index = getWallFootSources(opened);
  assert.notEqual(index, getWallFootSources(project));
  assert.ok(index.segmentCount > 0);
  assert.equal(index.queryPrimitives({ x: 1.5, y: -0.18 }, 100, 1).segments.length, 0);
  assert.ok(index.queryPrimitives({ x: 0.3, y: -0.18 }, 100, 1).segments.length > 0);
});

test("local CSS hover finds visible interiors, rejects hidden and moving edges, retains old point sources", () => {
  for (const zoom of [0.5, 1.2]) {
    const { context } = createWallPreviewContext(project, projection(0, zoom), true, 0);
    const at = { x: 0.3, y: -0.18 };
    const refs = context.sourceQuery!(at, 1, 10, []);
    const edge = hoveredSegment(at, refs, context.metric!);
    assert.ok(edge?.segment);
    assert.ok(context.acceptReference!(edge));
    const hidden = { x: 0.3, y: 0.18 };
    assert.equal(
      hoveredSegment(hidden, context.sourceQuery!(hidden, 1, 1, []), context.metric!, 1),
      null,
    );
    const moving = createWallPreviewContext(
      project,
      projection(0, zoom),
      true,
      0,
      null,
      "wall-1",
    ).context;
    assert.equal(hoveredSegment(at, moving.sourceQuery!(at, 1, 10, []), moving.metric!), null);
    assert.ok(
      context.sourceQuery!({ x: 0, y: -0.18 }, 1, 10, []).some((r) => r.feature === "corner-0--1"),
    );
    const reverse = createWallPreviewContext(project, projection(Math.PI, zoom), true, 0).context;
    assert.equal(reverse.acceptReference!(edge), false);
  }
});

test("visible edge uses shared 600ms acquire/revisit toggle and survives camera navigation", () => {
  const a = createWallPreviewContext(project, projection(), true, 0).context;
  const cursor = { x: 0.3, y: -0.18 };
  const edge = hoveredSegment(cursor, a.sourceQuery!(cursor, 1, 10, []), a.metric!)!;
  let state = advanceHoverReference(emptyHoverReference(), edge, 0, 600);
  state = advanceHoverReference(state, edge, 599, 600);
  assert.equal(state.references.length, 0);
  state = advanceHoverReference(state, edge, 600, 600);
  assert.equal(state.references.length, 1);
  const b = createWallPreviewContext(project, projection(0.1, 2), true, 0).context;
  assert.ok(sameHoverSession(a, b));
  state = suspendHoverReference(state, true);
  assert.equal(state.references.length, 1);
  state = advanceHoverReference(state, edge, 1000, 600);
  state = advanceHoverReference(state, edge, 1600, 600);
  assert.equal(state.references.length, 0);
});

test("shared parallel direction reaches a pinned movement origin and excludes its own wall", () => {
  const model = addWall(updateWall(project, "wall-1", { end: { x: 2.4, y: 1.8 } }), {
    id: "moving",
    start: { x: 0, y: -2 },
    end: { x: 2, y: -2 },
    height: 2.8,
    thickness: 0.36,
  });
  const origin = { entityId: "@edit-origin", feature: "origin", point: { x: 0, y: -2 } };
  const policy = {
    origin,
    sources: (refs: readonly import("../../constraints/snapping/engine.ts").SnapReference[]) =>
      refs.filter((r) => r.entityId !== "moving"),
    resolve: querySnap,
  };
  const { context } = createWallPreviewContext(model, projection(), true, 0, policy, "moving");
  const point = { x: 0.3 * 0.8 + 0.18 * 0.6, y: 0.3 * 0.6 - 0.18 * 0.8 };
  const edge = hoveredSegment(point, context.sourceQuery!(point, 1, 10, []), context.metric!)!;
  assert.ok(edge);
  const active = withParallelDirections([origin, edge]);
  assert.deepEqual(active[0]!.parallelDirections, edge.directions);
  assert.ok(context.acceptReference!(origin));
  const directions = advanceGuideDirections({ x: 1, y: -1.25 }, active, []);
  assert.ok(
    directions.some(
      (g) =>
        g.source.entityId === "@edit-origin" &&
        Math.abs(g.direction.y * 0.8 - g.direction.x * 0.6) < 1e-9,
    ),
  );
  const remote = context.sourceQuery!({ x: 2, y: -2 }, 1, 10, active);
  assert.ok(remote.some((r) => r.entityId === edge.entityId && r.feature === edge.feature));
  assert.ok(!remote.some((r) => r.entityId === "moving"));
});
