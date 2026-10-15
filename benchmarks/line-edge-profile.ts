import assert from "node:assert/strict";
import { lineEdgeFixture } from "./line-edge-fixture.ts";
import { previewEdit } from "../src/application/direct-edit/controller.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { contourEdge } from "../src/geometry/polygons/edit-edge.ts";
import { boundedEdgeTarget } from "../src/application/direct-edit/contour.ts";
const profiles = [];
for (const [count, vertices] of [
  [1, 500],
  [100, 100],
  [10, 100],
] as const) {
  const base = lineEdgeFixture(count, vertices),
    ring = storeyOf(base).lines![0]!.points.slice(0, -1);
  const { a, b, normal } = contourEdge(ring, 0),
    anchor = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
  const session: EditSession = {
    base,
    target: { kind: "line", id: "l" },
    action: "edge",
    index: 0,
    anchor,
  };
  // Independent cap caches; neither timed path warms the other's current target.
  const fullSession = { ...session, target: { ...session.target }, anchor: { ...anchor } };
  let start = performance.now();
  boundedEdgeTarget(fullSession, anchor);
  const fullPreparationMs = performance.now() - start;
  start = performance.now();
  const prepared = prepareDirectEditPreview(session);
  const preparationMs = performance.now() - start;
  const samples: Record<string, number>[] = [];
  for (let i = 0; i < 9; i++) {
    const d = (i + 1) * 0.05,
      point = { x: anchor.x + normal.x * d, y: anchor.y + normal.y * d };
    const runs: [string, () => ReturnType<typeof editAtPointer>][] = [
      ["full", () => editAtPointer(fullSession, base, point)],
      [
        "prepared",
        () =>
          prepared
            ? prepared.materialize!(base, session.target, point)
            : previewEdit(session, base, session.target, point),
      ],
    ];
    if (i % 2) runs.reverse();
    const times: Record<string, number> = {},
      results: ReturnType<typeof editAtPointer>[] = [];
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
    count,
    vertices,
    fullPreparationMs,
    preparationMs,
    preparedCapability: !!prepared,
    samples,
    warmMedianMs: { full: median("full"), prepared: median("prepared") },
  });
}
console.log(
  JSON.stringify(
    {
      method:
        "Node; full and prepared path have independent session/cap caches; include cap work for changing targets; first and eight warm samples separate; alternate order; exact project equality every sample. No frame/rendering guarantee.",
      profiles,
    },
    null,
    2,
  ),
);
