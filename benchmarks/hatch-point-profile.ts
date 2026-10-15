import assert from "node:assert/strict";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
const profiles = [];
for (const [count, vertices] of [
  [1, 500],
  [100, 100],
  [500, 4],
] as const) {
  const base = hatchPointFixture(count, vertices);
  const edit: EditSession = {
    base,
    target: { kind: "hatch", id: "h0" },
    action: "point",
    index: 0,
    anchor: { ...storeyOf(base).hatches[0]!.points[0]! },
  };
  const start = performance.now(),
    prepared = prepareDirectEditPreview(edit)!;
  const preparationMs = performance.now() - start;
  const samples: Record<string, number>[] = [];
  for (let i = 0; i < 9; i++) {
    const point = { x: edit.anchor.x + (i + 1) * 0.01, y: edit.anchor.y };
    const runs: [string, () => unknown][] = [
      ["full", () => editAtPointer(edit, base, point)],
      ["preparedProject", () => prepared.materialize!(base, edit.target, point)],
      ["patch", () => prepared.evaluate(base, edit.target, point)],
    ];
    if (i % 2) runs.reverse();
    const times: Record<string, number> = {};
    for (const [name, run] of runs) {
      const t = performance.now();
      run();
      times[name] = performance.now() - t;
    }
    assert.deepEqual(
      prepared.materialize!(base, edit.target, point),
      editAtPointer(edit, base, point),
    );
    samples.push(times);
  }
  const median = (key: string) => {
    const n = samples
      .slice(1)
      .map((s) => s[key]!)
      .sort((a, b) => a - b);
    return (n[3]! + n[4]!) / 2;
  };
  profiles.push({
    count,
    vertices,
    preparationMs,
    samples,
    warmMedianMs: {
      full: median("full"),
      preparedProject: median("preparedProject"),
      patch: median("patch"),
    },
  });
}
console.log(
  JSON.stringify(
    {
      method:
        "Node; preparation separate; one first plus eight warm targets; alternating order; exact full-project equality. Validation/materialization only, no rendering/frame guarantee. Target contour is still fully validated, metadata/pattern library retained.",
      profiles,
    },
    null,
    2,
  ),
);
