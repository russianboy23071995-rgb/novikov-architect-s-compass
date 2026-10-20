import { tPairFixture } from "./t-pair-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject } from "../src/lib/bim/model.ts";

/** Two supported T groups, three hosted windows and one unrelated wall. */
export function tTransitionFixture() {
  const p = tPairFixture(),
    s = storeyOf(p);
  s.walls.push(
    { ...s.walls[0]!, id: "new-host", start: { x: 0, y: 3 }, end: { x: 6, y: 3 } },
    { ...s.walls[1]!, id: "new-neighbour", start: { x: 5, y: 6 }, end: { x: 5, y: 3 } },
    { ...s.walls[0]!, id: "unrelated", start: { x: 10, y: 0 }, end: { x: 16, y: 0 } },
  );
  s.wallTJunctions.push({
    hostWallId: "new-host",
    incoming: { wallId: "new-neighbour", endpoint: 1 },
  });
  s.windows.push({ ...s.windows[0]!, id: "new-window", wallId: "new-host", position: 0.75 });
  return validateProject(p);
}
