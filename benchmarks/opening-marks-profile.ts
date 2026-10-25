import { buildingDoorFixture } from "./building-view-fixture.ts";
import { serializeProject } from "../src/lib/bim/model.ts";
import { readProjectFile } from "../src/lib/bim/history.ts";
import { nextOpeningMark, withOpeningMarks } from "../src/domain/elements/wall/opening-marks.ts";

// 500 windows and 500 doors on 500 walls across five storeys.
const median = (run: () => unknown, samples = 15) => {
  const times: number[] = [];
  for (let i = 0; i < samples; i++) {
    const start = performance.now();
    run();
    times.push(performance.now() - start);
  }
  return times.sort((a, b) => a - b)[Math.floor(samples / 2)]!;
};

const unmarked = buildingDoorFixture(100);
const marked = withOpeningMarks(unmarked);
const v27 = JSON.parse(serializeProject(unmarked));
v27.schemaVersion = 27;
const v27Text = JSON.stringify(v27);
const v28Text = serializeProject(readProjectFile(v27Text));
console.log(
  JSON.stringify(
    {
      windows: 500,
      doors: 500,
      nextMarkMs: median(() => nextOpeningMark(marked, marked.storeys[0]!.id, "door"), 31),
      assignAllMs: median(() => withOpeningMarks(unmarked)),
      loadV27Ms: median(() => readProjectFile(v27Text)),
      loadV28Ms: median(() => readProjectFile(v28Text)),
    },
    null,
    2,
  ),
);
