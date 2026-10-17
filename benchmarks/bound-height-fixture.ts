import { createProject, addWall, addWindow } from "../src/lib/bim/model.ts";
import { setStoreyHeight, addStorey, renameStorey } from "../src/application/storeys/actions.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { setWallHeightRule } from "../src/application/walls/height-binding.ts";
export function boundHeightFixture() {
  let p = createProject("height-workflow", "eg");
  p = renameStorey(p, p, { projectId: p.id, storeyId: "eg", name: "Erdgeschoss" });
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "above", id: "og", height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "og", side: "above", id: "dg", height: 3 });
  for (const [floor, upper] of [
    ["eg", "og"],
    ["og", "dg"],
  ] as const) {
    p = selectWorkingStorey(p, p, floor);
    p = addWall(p, {
      id: floor + "-a",
      start: { x: 0, y: 0 },
      end: { x: 4, y: 0 },
      thickness: 0.36,
      height: 2.8,
    });
    p = addWall(p, {
      id: floor + "-b",
      start: { x: 4, y: 0 },
      end: { x: 4, y: 4 },
      thickness: 0.36,
      height: 2.8,
    });
    p = addWindow(p, {
      id: floor + "-window",
      wallId: floor + "-a",
      width: 1.2,
      height: 1.2,
      sillHeight: 0.9,
      position: 0.5,
    });
    p = setWallHeightRule(p, p, {
      projectId: p.id,
      storeyId: floor,
      wallIds: [floor + "-a", floor + "-b"],
      rule: { kind: "slab-underside", storeyId: upper, topOffset: 0 },
    });
  }
  return selectWorkingStorey(p, p, "eg");
}
