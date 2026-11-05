import { buildingDoorFixture } from "./building-view-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { openingOverlaps } from "../src/domain/elements/wall/opening-overlaps.ts";
import { previewOverlapHint } from "../src/application/openings/overlap-hint.ts";
import { updateDoor } from "../src/application/doors/actions.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
import { validateProject, type Project } from "../src/domain/project/schema.ts";

// Hint cost per preview frame: 100 walls with a window and a door on the working storey
// (500 of each across five storeys), without overlaps and with every door over its window.
const median = (run: () => unknown, samples = 31) => {
  const times: number[] = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    run();
    times.push(performance.now() - start);
  }
  return times.sort((a, b) => a - b)[Math.floor(samples / 2)]!;
};

function profile(p: Project) {
  const door = storeyOf(p).doors![0]!;
  const moved = updateDoor(p, door.id, { position: door.position + 0.05 });
  return {
    overlaps: openingOverlaps(storeyOf(p)).length,
    storeyOverlapsMs: median(() => openingOverlaps(storeyOf(p))),
    previewHintMs: median(() => previewOverlapHint(p, moved)),
    planSceneMs: median(() => derivePlanScene(moved, () => true)),
  };
}

const clear = buildingDoorFixture(100);
const overlapping = validateProject({
  ...clear,
  storeys: clear.storeys.map((s) => ({
    ...s,
    doors: s.doors!.map((d) => ({ ...d, position: 0.4 })),
  })),
});
console.log(
  JSON.stringify(
    {
      walls: 500,
      windows: 500,
      doors: 500,
      clear: profile(clear),
      overlapping: profile(overlapping),
    },
    null,
    2,
  ),
);
