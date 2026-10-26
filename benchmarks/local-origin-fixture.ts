import { buildingViewFixture } from "./building-view-fixture.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { initialCamera } from "../src/lib/bim/geometry.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
import { movementCorners } from "../src/rendering/viewport/movement-origin.ts";
export function originFixture(size = 10, yaw = 0.7, zoom = 1) {
  const project = buildingViewFixture(size);
  const view = createProjectionState(
    createProjectionFrame(buildBuildingSolid(project)),
    { ...initialCamera, yaw, pitch: 0.6, zoom },
    { left: 37, top: 23, width: 600, height: 400 },
    { width: 600, height: 400 },
  )!;
  const cursors = movementCorners(project)
    .filter((_, i) => i % 31 === 0)
    .slice(0, 16)
    .map((c) => {
      const p = view.project(c.point);
      return { x: 37 + (p[0] + 1) * 300, y: 23 + (1 - p[1]) * 200 };
    });
  return { project, view, cursors };
}
