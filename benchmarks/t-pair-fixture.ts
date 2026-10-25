import { storeyOf } from "../src/domain/storeys/access.ts";
import { createProject } from "../src/application/projects/create.ts";
import { validateProject } from "../src/domain/project/schema.ts";

/** User regression: both walls of a T, two hosted windows, outer drawing axes. */
export function tPairFixture() {
  const p = createProject("t-pair", "storey");
  for (const [id, start, end] of [
    ["wall-1", { x: 0, y: 0 }, { x: 6, y: 0 }],
    ["wall-2", { x: 3, y: -3 }, { x: 3, y: 0 }],
  ] as const)
    storeyOf(p).walls.push({
      id,
      start,
      end,
      layerId: p.defaultLayerIds.wall,
      height: 2.8,
      thickness: 0.36,
      bodyOffset: 0.18,
    });
  storeyOf(p).wallTJunctions.push({
    hostWallId: "wall-1",
    incoming: { wallId: "wall-2", endpoint: 1 },
  });
  for (let i = 0; i < 2; i++)
    storeyOf(p).windows.push({
      id: `window-${i}`,
      wallId: `wall-${i + 1}`,
      layerId: p.defaultLayerIds.window,
      width: 1.2,
      height: 1.2,
      sillHeight: 0.9,
      position: 0.5,
    });
  return validateProject(p);
}
