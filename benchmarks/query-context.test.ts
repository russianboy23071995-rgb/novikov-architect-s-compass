import test from "node:test";
import assert from "node:assert/strict";
import { buildingViewFixture } from "./building-view-fixture.ts";
import { prepareViewportModel, viewportModel } from "../src/rendering/viewport/prepared-model.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { initialCamera } from "../src/lib/bim/geometry.ts";
import { createWallPreviewContext } from "../src/rendering/viewport/wall-preview-context.ts";
import {
  createMovementOriginQuery,
  movementCorners,
} from "../src/rendering/viewport/movement-origin.ts";
import {
  createLayerVisibilityPolicy,
  isLayerVisible,
} from "../src/application/layers/visibility.ts";

function projection(project: ReturnType<typeof buildingViewFixture>, yaw = 0, zoom = 1) {
  return createProjectionState(
    createProjectionFrame(buildBuildingSolid(project)),
    { ...initialCamera, yaw, zoom },
    { left: 10, top: 20, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
}

test("prepared 3D queries match fresh validation across cameras, heights, visibility and moving wall", () => {
  const p = buildingViewFixture(2),
    basis = prepareViewportModel(p);
  const corners = movementCorners(p, basis);
  let comparisons = 0;
  for (const yaw of [0, 0.7, Math.PI])
    for (const zoom of [0.5, 2]) {
      const view = projection(basis.model, yaw, zoom);
      for (const hidden of [false, true]) {
        const visibility = createLayerVisibilityPolicy(p, {
          scope: { kind: "bim-project" },
          hiddenLayerIds: hidden ? [p.defaultLayerIds.wall] : [],
        });
        const allows = (id: string) => isLayerVisible(p, visibility, id);
        const fresh = createMovementOriginQuery(p, view, allows);
        const prepared = createMovementOriginQuery(p, view, allows, basis);
        for (const corner of corners.slice(0, 12)) {
          const q = view.project(corner.point);
          const cursor = { x: 10 + (q[0] + 1) * 400, y: 20 + (1 - q[1]) * 300 };
          assert.deepEqual(prepared(cursor), fresh(cursor));
          if (hidden) assert.equal(prepared(cursor), null);
          comparisons++;
        }
        for (const height of [0, 2.8]) {
          const freshContext = createWallPreviewContext(
            p,
            view,
            true,
            0,
            null,
            p.storeys[0]!.walls[0]!.id,
            visibility,
            height,
          );
          const preparedContext = createWallPreviewContext(
            p,
            view,
            true,
            0,
            null,
            p.storeys[0]!.walls[0]!.id,
            visibility,
            height,
            basis,
          );
          for (const cursor of [
            { x: 0, y: 0 },
            { x: 4, y: 0.36 },
            { x: 6, y: 0 },
          ]) {
            assert.deepEqual(
              preparedContext.context.sourceQuery!(cursor, 1, 10, []),
              freshContext.context.sourceQuery!(cursor, 1, 10, []),
            );
            comparisons++;
          }
          assert.deepEqual(preparedContext.adapter!.query({ ...p }, view, { x: 100, y: 100 }, 10), {
            status: "paused",
            reason: "stale-snapshot",
          });
          assert.equal(
            preparedContext.adapter!.query(p, projection(basis.model, 1), { x: 100, y: 100 }, 10)
              .status,
            "paused",
          );
        }
      }
    }
  assert.equal(comparisons, 216);
});

test("camera contexts do not re-read validation payload; source and prepared basis remain separate", () => {
  const p = buildingViewFixture(1),
    assets = p.assets;
  let reads = 0;
  Object.defineProperty(p, "assets", {
    enumerable: true,
    get() {
      reads++;
      return assets;
    },
  });
  const basis = prepareViewportModel(p);
  assert.ok(reads > 0);
  const initialReads = reads;
  for (const yaw of [0, 0.5, 1]) {
    const view = projection(basis.model, yaw);
    createWallPreviewContext(p, view, true, 0, null, undefined, undefined, 1, basis);
    createMovementOriginQuery(p, view, () => true, basis);
  }
  assert.equal(reads, initialReads);
  const before = movementCorners(p, basis);
  p.storeys[0]!.walls[0]!.height = 4;
  assert.equal(viewportModel(p, basis).storeys[0]!.walls[0]!.height, 2.8);
  assert.equal(movementCorners(p, basis), before);
  assert.notDeepEqual(movementCorners(p), before); // public mutable call must not reuse stale corners
  const changed = { ...p };
  assert.throws(() => viewportModel(changed, basis));
  assert.throws(() => viewportModel(p, { model: basis.model })); // copied token has no provenance
  p.storeys[0]!.walls[0]!.height = -1;
  assert.throws(() => prepareViewportModel(p));
  assert.throws(() => movementCorners(p));
});
