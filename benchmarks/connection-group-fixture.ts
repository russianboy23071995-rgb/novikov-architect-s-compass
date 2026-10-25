import { tPairFixture } from "./t-pair-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { validateProject } from "../src/domain/project/schema.ts";
export function connectionGroupFixture(branches: number, foreign: number) {
  const p = tPairFixture(),
    s = storeyOf(p),
    host = s.walls[0]!,
    branch = s.walls[1]!;
  host.end = { x: (branches + 1) * 3, y: 0 };
  for (let i = 1; i < branches; i++) {
    const id = `branch-${i}`,
      x = (i + 1) * 3;
    s.walls.push({ ...branch, id, start: { x, y: -3 }, end: { x, y: 0 } });
    s.wallTJunctions.push({ hostWallId: host.id, incoming: { wallId: id, endpoint: 1 } });
    s.windows.push({ ...s.windows[1]!, id: `window-branch-${i}`, wallId: id });
  }
  for (let i = 0; i < foreign; i++)
    s.walls.push({
      ...branch,
      id: `foreign-${i}`,
      start: { x: i * 3, y: 30 },
      end: { x: i * 3, y: 33 },
    });
  return validateProject(p);
}
