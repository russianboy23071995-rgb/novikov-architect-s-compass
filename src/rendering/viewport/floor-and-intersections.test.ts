import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { buildSolid, initialCamera } from "../../lib/bim/geometry.ts";
import { updateWall } from "../../lib/bim/model.ts";
import { createProjectionState } from "./projection-state.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { orientationFloor } from "./orientation-floor.ts";
import { createWallPreviewContext } from "./wall-preview-context.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import { acquisitionReference } from "../../constraints/inference/construction-reference.ts";
import {
  advanceHoverReference,
  emptyHoverReference,
  suspendHoverReference,
} from "../../constraints/inference/hover-reference.ts";

const project = createExampleProject(),
  solid = buildSolid(project);
const projection = createProjectionState(
  createProjectionFrame(solid),
  { ...initialCamera, yaw: 0, pitch: 0.5, zoom: 0.7 },
  { left: 10, top: 30, width: 800, height: 600 },
  { width: 1000, height: 750 },
)!;
const { context } = createWallPreviewContext(project, projection, true, 0);
const origins = [0, 3].map((x) => context.sourceQuery!({ x, y: -0.18 }, 1, 0.01, [])[0]!);
const cursor = { x: 1.5, y: -1.68 };
const resolve = (active = origins) =>
  querySnap(cursor, {
    ...context,
    activeReferences: active,
    endpointRadiusPx: 10,
    gridSpacing: null,
    orthoOrigin: null,
  });

test("two remote wall references form a visible shared guide intersection", () => {
  assert.equal(origins.length, 2);
  assert.ok(origins.every(Boolean));
  const candidate = resolve().candidate;
  assert.equal(candidate?.kind, "intersection");
  assert.ok(Math.abs(candidate!.worldPoint.x - cursor.x) < 1e-9);
  assert.ok(Math.abs(candidate!.worldPoint.y - cursor.y) < 1e-9);
  const generated = acquisitionReference(candidate, [])!;
  assert.equal(generated.dependencies?.length, 2);
  assert.equal(context.acceptReference!(generated), true);
  let state = advanceHoverReference(emptyHoverReference(), generated, 0, 600);
  state = advanceHoverReference(state, generated, 600, 600);
  assert.equal(state.references.length, 1);
  const repeated = resolve([...origins, generated]).candidate;
  assert.equal(repeated?.kind, "endpoint");
  const sources = context.sourceQuery!(cursor, 1, 10, [...origins, generated]);
  assert.deepEqual(acquisitionReference(repeated, sources), generated);
  state = suspendHoverReference(state, true);
  state = advanceHoverReference(state, generated, 1000, 600);
  state = advanceHoverReference(state, generated, 1600, 600);
  assert.equal(state.references.length, 0);
});

test("construction dependencies survive camera changes and reject changed model or hidden points", () => {
  const generated = acquisitionReference(resolve().candidate, [])!;
  const zoomed = createProjectionState(
    projection.frame,
    { ...projection.camera, zoom: 0.8 },
    projection.viewport,
    projection.backbuffer,
  )!;
  assert.equal(
    createWallPreviewContext(project, zoomed, true, 0).context.acceptReference!(generated),
    true,
  );
  const changed = updateWall(project, "wall-1", { end: { x: 4, y: 0 } });
  assert.equal(
    createWallPreviewContext(changed, projection, true, 0).context.acceptReference!(generated),
    false,
  );
  assert.equal(context.acceptReference!({ ...generated, point: { x: 1.5, y: 0 } }), false);
  assert.equal(context.acceptReference!({ ...generated, point: { x: NaN, y: 0 } }), false);
  assert.equal(
    context.acceptReference!({ ...generated, dependencies: [{ ...origins[0]!, feature: "gone" }] }),
    false,
  );
});

test("view eligibility rejects hidden ranked geometry before choosing a visible alternative", () => {
  const rejected = { entityId: "hidden", feature: "point", point: { x: 0, y: 0 } };
  const visible = { entityId: "visible", feature: "point", point: { x: 0.01, y: 0 } };
  const base = {
    references: [rejected, visible],
    enabled: true,
    pixelsPerMetre: 100,
    endpointRadiusPx: 10,
    gridSpacing: null,
    orthoOrigin: null,
  };
  assert.equal(querySnap({ x: 0, y: 0 }, base).candidate?.sourceEntityId, "hidden");
  assert.equal(
    querySnap({ x: 0, y: 0 }, { ...base, acceptCandidate: (c) => c.sourceEntityId !== "hidden" })
      .candidate?.sourceEntityId,
    "visible",
  );
});

test("decorative floor uses z=0 and preserves model/frame; invalid bounds yield no polygon", () => {
  const before = JSON.stringify({ project, solid, projection });
  const points = orientationFloor(solid, projection)!
    .split(" ")
    .map((p) => p.split(",").map(Number));
  assert.equal(points.length, 4);
  const corner = projection.project([-1, -1.18, 0]);
  assert.deepEqual(points[0], [(corner[0] + 1) * 400, (1 - corner[1]) * 300]);
  assert.equal(JSON.stringify({ project, solid, projection }), before);
  assert.equal(orientationFloor({ min: [Infinity, 0, 0], max: [1, 1, 1] }, projection), null);
});
