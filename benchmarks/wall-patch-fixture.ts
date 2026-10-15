import { buildingViewFixture } from "./building-view-fixture.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
export function wallPatchFixture(count = 3) {
  const p = buildingViewFixture(count);
  p.workingStoreyId = "s2";
  const s = storeyOf(p),
    t = storeyOf(tPairFixture());
  s.walls.push(
    ...t.walls.map((w) => ({
      ...w,
      baseOffset: 0.4,
      layerId: p.defaultLayerIds.wall,
      start: { x: w.start.x, y: w.start.y - 10 },
      end: { x: w.end.x, y: w.end.y - 10 },
    })),
  );
  s.windows.push(...t.windows.map((w) => ({ ...w, layerId: p.defaultLayerIds.window })));
  s.wallTJunctions.push(...t.wallTJunctions);
  return validateProject(p);
}
