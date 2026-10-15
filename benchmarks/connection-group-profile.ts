import assert from "node:assert/strict";
import { connectionGroupFixture } from "./connection-group-fixture.ts";
import { prepareEndpoint } from "../src/application/direct-edit/prepared-endpoint.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
const runs = [];
for (const [branches, foreign] of [
  [1, 0],
  [1, 1000],
  [10, 100],
  [50, 100],
]) {
  const p = connectionGroupFixture(branches!, foreign!),
    host = storeyOf(p).walls[0]!;
  const session: EditSession = {
    base: p,
    target: { kind: "wall", id: host.id },
    action: "point",
    index: 1,
    anchor: host.end,
  };
  const t = performance.now(),
    prepared = prepareEndpoint(p, host.id),
    preparationMs = performance.now() - t;
  const samples = [];
  for (let i = 0; i < 7; i++) {
    const point = { x: host.end.x + (i + 1) * 0.1, y: 0 };
    const a = performance.now(),
      local = prepared.evaluate(point),
      b = performance.now(),
      full = editAtPointer(session, p, point),
      c = performance.now();
    assert.deepEqual(local.project, full);
    samples.push({ previewMs: b - a, fullMs: c - b, path: local.path });
  }
  runs.push({ branches, foreign, affectedWalls: prepared.affectedWalls, preparationMs, samples });
}
console.log(
  JSON.stringify(
    {
      method:
        "7 targets; prepared then full; exact project comparison outside timing; preparation separate; connected branches each host a window",
      runs,
    },
    null,
    2,
  ),
);
