import { buildingViewFixture } from "./building-view-fixture.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
for (const walls of [10, 50, 100]) {
  let p = buildingViewFixture(walls),
    previous = buildBuildingSolid(p);
  const runs = [];
  for (let i = 0; i < 7; i++) {
    const start = performance.now();
    p = selectWorkingStorey(p, p, `s${(i % 4) + 1}`);
    const selected = performance.now(),
      solid = buildBuildingSolid(p),
      end = performance.now();
    runs.push({ switchMs: selected - start, deriveMs: end - selected, reused: solid === previous });
    previous = solid;
  }
  console.log(
    JSON.stringify({ storeys: 5, wallsPerStorey: walls, first: runs[0], warm: runs.slice(1) }),
  );
}
