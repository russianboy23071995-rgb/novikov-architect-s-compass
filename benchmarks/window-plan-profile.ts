import assert from "node:assert/strict";
import { buildingViewFixture } from "./building-view-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { editAnchor, editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { previewEdit } from "../src/application/direct-edit/controller.ts";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
const profiles = [];
for (const size of [10, 100]) {
  const base = buildingViewFixture(size),
    target = { kind: "window" as const, id: base.storeys[0]!.windows[0]!.id };
  const session: EditSession = {
    base,
    target,
    action: "axis",
    index: null,
    anchor: editAnchor(base, target),
  };
  const start = performance.now();
  const prepared = prepareDirectEditPreview(session)!;
  const preparationMs = performance.now() - start;
  const samples: Record<string, number>[] = [];
  for (let i = 0; i < 9; i++) {
    const point = { x: session.anchor.x + (i - 4) * 0.8, y: session.anchor.y + 2 };
    const times: Record<string, number> = {},
      results: ReturnType<typeof editAtPointer>[] = [];
    const runs: [string, () => ReturnType<typeof editAtPointer>][] = [
      ["full", () => editAtPointer(session, base, point)],
      ["prepared", () => prepared.materialize!(base, target, point)],
    ];
    if (i % 2) runs.reverse();
    for (const [name, run] of runs) {
      const t = performance.now();
      results.push(run());
      times[name] = performance.now() - t;
    }
    assert.deepEqual(results[0], results[1]);
    assert.deepEqual(previewEdit(session, base, target, point), results[0]);
    const t = performance.now();
    derivePlanScene(results[0]!, () => true);
    times["plan"] = performance.now() - t;
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
    walls: size * 5,
    windows: size * 5,
    preparationMs,
    samples,
    warmMedianMs: { full: median("full"), prepared: median("prepared"), plan: median("plan") },
  });
}
console.log(
  JSON.stringify(
    {
      method:
        "Node; first and eight warm targets including host caps; alternating full/prepared order; preparation separate; exact project/controller equality outside timing. Unconnected five-storey fixtures. Plan derivation measured separately; no frame/GPU/snapping guarantee.",
      profiles,
    },
    null,
    2,
  ),
);
