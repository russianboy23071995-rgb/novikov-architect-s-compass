import assert from "node:assert/strict";
import { connectionGroupFixture } from "./connection-group-fixture.ts";
import { prepareEndpoint } from "../src/application/direct-edit/prepared-endpoint.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { buildPreviewSolid } from "../src/lib/bim/geometry.ts";
import { workingStoreyElevation } from "../src/domain/storeys/elevation.ts";
const summary = (xs: number[]) => {
  const sorted = [...xs].sort((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
  };
};
const runs = [];
for (const [branches, foreign] of [
  [1, 0],
  [1, 1000],
  [10, 100],
  [50, 100],
  [50, 1000],
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
  for (let i = 0; i < 28; i++) {
    const point = { x: host.end.x + (i % 2 ? -0.2 : 0.1) * (1 + (i % 5)), y: 0 };
    const a = performance.now(),
      geometry = prepared.evaluateGeometry(point),
      b = performance.now(),
      local = prepared.evaluate(point),
      materializedEnd = performance.now(),
      full = editAtPointer(session, p, point),
      c = performance.now();
    assert.deepEqual(local.project, full);
    const replaced = new Set(geometry.patch.replacedIds);
    const expectedFaces = buildPreviewSolid(full, workingStoreyElevation(full)).faces.filter(
      (face) => replaced.has(face.wallId),
    );
    assert.deepEqual(
      buildPreviewSolid(geometry.patch.geometry, workingStoreyElevation(p)).faces,
      expectedFaces,
    );
    if (i >= 7)
      samples.push({
        geometryMs: b - a,
        materializedMs: materializedEnd - b,
        fullMs: c - materializedEnd,
        path: geometry.path,
      });
  }
  // Confirmation remains complete; compare it separately, outside pointer timings.
  const target = { x: host.end.x + 0.5, y: 0 };
  const confirmStart = performance.now();
  const confirmed = prepared.confirm(target);
  const confirmMs = performance.now() - confirmStart;
  assert.deepEqual(confirmed, editAtPointer(session, p, target));
  assert.throws(() => prepared.evaluateGeometry(host.start));
  assert.throws(() => prepared.confirm(host.start));
  const edgeCases = [];
  const foreignWall = storeyOf(p).walls.find((wall) => wall.id === "foreign-0");
  for (const [name, point] of [
    ["detach distant T junctions", { x: 4.5, y: 0 }],
    ...(foreignWall ? [["foreign endpoint", foreignWall.start] as const] : []),
  ] as const) {
    const outcome = (run: () => unknown) => {
      try {
        return { value: run(), rejected: false };
      } catch {
        return { rejected: true };
      }
    };
    const expected = outcome(() => editAtPointer(session, p, point));
    const local = outcome(() => prepared.evaluate(point).project);
    const commit = outcome(() => prepared.confirm(point));
    assert.deepEqual(local, expected);
    assert.deepEqual(commit, expected);
    edgeCases.push({ name, rejected: expected.rejected });
  }
  runs.push({
    branches,
    foreign,
    affectedWalls: prepared.affectedWalls,
    preparationMs,
    confirmMs,
    edgeCases,
    geometry: summary(samples.map((s) => s.geometryMs)),
    materialized: summary(samples.map((s) => s.materializedMs)),
    full: summary(samples.map((s) => s.fullMs)),
    samples,
  });
}
console.log(
  JSON.stringify(
    {
      method:
        "7 warm + 21 measured targets, alternating extension/shortening; geometry then materialized then full; exact faces/project and confirmation outside pointer timings; preparation separate; Node CPU only, no browser/native/frame evidence",
      runs,
    },
    null,
    2,
  ),
);
