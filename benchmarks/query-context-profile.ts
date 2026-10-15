import { prepareViewportModel } from "../src/rendering/viewport/prepared-model.ts";
import { buildingViewFixture } from "./building-view-fixture.ts";
import { buildBuildingSolid, initialCamera } from "../src/lib/bim/geometry.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
import { createWallPreviewContext } from "../src/rendering/viewport/wall-preview-context.ts";
import { createMovementOriginQuery } from "../src/rendering/viewport/movement-origin.ts";
const project = buildingViewFixture(100);
const frame = createProjectionFrame(buildBuildingSolid(project));
const preparing = performance.now();
const prepared = prepareViewportModel(project);
const preparationMs = performance.now() - preparing;
const runs = [];
for (let i = 0; i < 7; i++) {
  const projection = createProjectionState(
    frame,
    { ...initialCamera, yaw: i * 0.1 },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
  const start = performance.now();
  createWallPreviewContext(project, projection, true, 0, null, undefined, undefined, 1, prepared);
  createMovementOriginQuery(project, projection, () => true, prepared);
  runs.push(performance.now() - start);
}
console.log(
  JSON.stringify({
    preparationMs,
    walls: 500,
    windows: 500,
    firstMs: runs[0],
    warmMs: runs.slice(1),
  }),
);
