import { buildingDoorFixture } from "./building-view-fixture.ts";
import { previewDeleteSelection } from "../src/application/elements/delete.ts";
import { createHistory, commitProject } from "../src/application/history/project-history.ts";
import { createLayerVisibilityPolicy } from "../src/application/layers/visibility.ts";
import type { SelectionSet } from "../src/application/selection/state.ts";

// Delete one wall and 50 walls (each with window and door) in 500 walls/windows/doors.
const median = (run: () => unknown, samples = 15) => {
  const times: number[] = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    run();
    times.push(performance.now() - start);
  }
  return times.sort((a, b) => a - b)[Math.floor(samples / 2)]!;
};

const history = createHistory(buildingDoorFixture(100)),
  p = history.present;
const visibility = createLayerVisibilityPolicy(p, {
  scope: { kind: "bim-project" },
  hiddenLayerIds: [],
});
const walls = p.storeys[0]!.walls;
const profile = (targets: SelectionSet) => ({
  previewMs: median(() => previewDeleteSelection(p, targets, visibility)),
  previewAndCommitMs: median(() =>
    commitProject(history, previewDeleteSelection(p, targets, visibility).result),
  ),
});
console.log(
  JSON.stringify(
    {
      walls: 500,
      windows: 500,
      doors: 500,
      oneWall: profile([{ kind: "wall", id: walls[0]!.id }]),
      fiftyWalls: profile(walls.slice(0, 50).map((w) => ({ kind: "wall" as const, id: w.id }))),
    },
    null,
    2,
  ),
);
