import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject } from "../src/lib/bim/model.ts";
import { defaultLineAppearance } from "../src/lib/bim/lines.ts";
export function lineEdgeFixture(count = 10, vertices = 100) {
  const base = hatchPointFixture(count, vertices),
    ring = storeyOf(base).hatches[0]!.points;
  storeyOf(base).lines = [
    {
      id: "l",
      kind: "polyline",
      layerId: base.defaultLayerIds.line,
      points: [...ring.map((p) => ({ ...p })), { ...ring[0]! }],
      ...defaultLineAppearance,
    },
  ];
  return validateProject(base);
}
