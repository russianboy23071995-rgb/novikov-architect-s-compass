import assert from "node:assert/strict";
import { wallPatchFixture } from "./wall-patch-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { previewEdit } from "../src/application/direct-edit/controller.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
const profiles = [];
for (const size of [10, 100])
  for (const index of [0, 1] as const) {
    const base = wallPatchFixture(size),
      wall = storeyOf(base).walls.find((w) => w.id === "wall-1")!;
    const session: EditSession = {
      base,
      target: { kind: "wall", id: wall.id },
      action: "stretch",
      index,
      anchor: { ...(index === 0 ? wall.start : wall.end) },
    };
    const start = performance.now(),
      prepared = prepareDirectEditPreview(session),
      preparationMs = performance.now() - start;
    const samples: Record<string, number>[] = [];
    for (let i = 0; i < 9; i++) {
      const point = {
        x: session.anchor.x + (index === 0 ? -1 : 1) * (i + 1) * 0.1,
        y: session.anchor.y + 0.2,
      };
      const times: Record<string, number> = {},
        results: ReturnType<typeof editAtPointer>[] = [];
      const runs: [string, () => ReturnType<typeof editAtPointer>][] = [
        ["full", () => editAtPointer(session, base, point)],
        [
          "preview",
          () =>
            prepared?.materialize
              ? prepared.materialize(base, session.target, point)
              : previewEdit(session, base, session.target, point),
        ],
      ];
      if (i % 2) runs.reverse();
      for (const [name, run] of runs) {
        const t = performance.now();
        results.push(run());
        times[name] = performance.now() - t;
      }
      assert.deepEqual(results[0], results[1]);
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
      size,
      index,
      walls: base.storeys.reduce((n, s) => n + s.walls.length, 0),
      preparedCapability: !!prepared,
      preparationMs,
      samples,
      warmMedianMs: { full: median("full"), preview: median("preview") },
    });
  }
console.log(
  JSON.stringify(
    {
      method:
        "Node; five storeys and T-pair with windows; first plus eight warm targets, alternating order; exact project equality outside timing; preparation separate. Before registration preview is legacy controller. No rendering/frame guarantee.",
      profiles,
    },
    null,
    2,
  ),
);
