import { createProject } from "../src/application/projects/create.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { addWall, updateWall } from "../src/application/walls/actions.ts";
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

/** §9 acceptance: basement plus fixed/linked join conflict, with signed offsets. */
export function fullHeightFixture() {
  let p = boundHeightFixture();
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "below", id: "kg", height: 3 });
  p = selectWorkingStorey(p, p, "kg");
  for (const [id, start, end] of [
    ["kg-a", { x: 0, y: 0 }, { x: 4, y: 0 }],
    ["kg-b", { x: 4, y: 0 }, { x: 4, y: 4 }],
  ] as const) {
    p = addWall(p, { id, start, end, thickness: 0.36, height: 2.8, baseOffset: -0.1 });
  }
  p = addWindow(p, {
    id: "kg-window",
    wallId: "kg-a",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  p = setWallHeightRule(p, p, {
    projectId: p.id,
    storeyId: "kg",
    wallIds: ["kg-a", "kg-b"],
    rule: { kind: "slab-underside", storeyId: "eg", topOffset: -0.1 },
  });
  p = selectWorkingStorey(p, p, "og");
  // A mixed fixed/bound connected pair is valid initially, but rejects a later
  // storey-height change that would give the joined walls unequal heights.
  p = setWallHeightRule(p, p, {
    projectId: p.id,
    storeyId: "og",
    wallIds: ["og-b"],
    rule: { kind: "fixed", height: 2.8 },
  });
  p = selectWorkingStorey(p, p, "eg");
  // Separate bound wall exercises positive base/top offsets without imposing
  // an unsupported unequal-height join on the two connected fixture walls.
  p = addWall(p, {
    id: "eg-offset",
    start: { x: -2, y: 0 },
    end: { x: -2, y: 4 },
    thickness: 0.36,
    height: 2.8,
  });
  p = updateWall(p, "eg-offset", { baseOffset: 0.1 });
  return setWallHeightRule(p, p, {
    projectId: p.id,
    storeyId: "eg",
    wallIds: ["eg-offset"],
    rule: { kind: "slab-underside", storeyId: "og", topOffset: 0.2 },
  });
}
