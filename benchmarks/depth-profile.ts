import { originFixture } from "./local-origin-fixture.ts";
import { movementCorners } from "../src/rendering/viewport/movement-origin.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import {
  nearestWallSurface,
  prepareNearestWallSurface,
} from "../src/rendering/viewport/wall-depth.ts";
const { project, view } = originFixture(100);
const solid = buildBuildingSolid(project),
  samples = [];
const start = performance.now(),
  prepared = prepareNearestWallSurface(solid, view.project),
  preparationMs = performance.now() - start;
for (const corner of movementCorners(project).slice(0, 20)) {
  const p = view.project(corner.point),
    t = performance.now();
  nearestWallSurface(solid, view.project, p[0], p[1]);
  const fullMs = performance.now() - t,
    t2 = performance.now();
  prepared(p[0], p[1]);
  samples.push({ fullMs, preparedMs: performance.now() - t2 });
}
console.log(
  JSON.stringify(
    {
      walls: 500,
      phase: "depth query only; full first then prepared; preparation separate",
      preparationMs,
      samples,
    },
    null,
    2,
  ),
);
