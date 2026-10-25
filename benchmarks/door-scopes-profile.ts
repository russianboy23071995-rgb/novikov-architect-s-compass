import { buildingDoorFixture, buildingViewFixture } from "./building-view-fixture.ts";
import { prepareEndpoint } from "./prepared-endpoint.ts";
import { fullSelectionMove } from "./selection-move-oracle.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
import type { Project } from "../src/domain/project/schema.ts";

// Endpoint, XY and Z previews with and without doors: 500 walls/windows (and 500 doors).
const time = (run: () => unknown) => {
  const start = performance.now();
  run();
  return performance.now() - start;
};
const median = (values: number[]) => values.sort((a, b) => a - b)[Math.floor(values.length / 2)]!;

function profile(p: Project) {
  const wall = p.storeys[0]!.walls[0]!,
    solid = buildBuildingSolid(p);
  const targets = [{ kind: "wall" as const, id: wall.id }];
  const endpoint = prepareEndpoint(p, wall.id),
    xy = prepareSelectionTranslation(p, [wall.id]),
    z = prepareZTranslation(p, targets);
  const rows = { endpoint: [] as number[][], xy: [] as number[][], z: [] as number[][] };
  for (let i = 1; i <= 7; i++) {
    const end = { x: wall.end.x + 0.05 * i, y: wall.end.y },
      delta = { x: 0.05 * i, y: 0.02 * i },
      dz = 0.02 * i;
    rows.endpoint.push([
      time(() => buildBuildingSolid(updateWall(p, wall.id, { end }))),
      time(() => selectionMoveSurfaces(solid, p, endpoint.evaluateGeometry(end).patch)),
    ]);
    rows.xy.push([
      time(() => buildBuildingSolid(fullSelectionMove(p, targets, delta))),
      time(() => selectionMoveSurfaces(solid, p, xy.evaluate(delta))),
    ]);
    rows.z.push([
      time(() => buildBuildingSolid(z.materialize(p, targets, dz))),
      time(() => selectionMoveSurfaces(solid, p, z.evaluate(p, targets, dz))),
    ]);
  }
  // First sample separate; warm median of the remaining six.
  return Object.fromEntries(
    Object.entries(rows).map(([name, r]) => [
      name,
      {
        firstMs: r[0],
        warmFullMs: median(r.slice(1).map((x) => x[0]!)),
        warmPreparedMs: median(r.slice(1).map((x) => x[1]!)),
      },
    ]),
  );
}

console.log(
  JSON.stringify(
    {
      walls: 500,
      windows: 500,
      withoutDoors: profile(buildingViewFixture(100)),
      withDoors: profile(buildingDoorFixture(100)),
    },
    null,
    2,
  ),
);
