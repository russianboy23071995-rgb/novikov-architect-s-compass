import test from "node:test";
import assert from "node:assert/strict";
import { createCompatiblePointIndex } from "../src/geometry/spatial/compatible-point-index.ts";
import { pointsCompatible } from "../src/geometry/tolerances/model.ts";
import { connectionGroupFixture } from "./connection-group-fixture.ts";
import { prepareEndpoint } from "../src/application/direct-edit/prepared-endpoint.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
test("point index matches full scan at tolerance boundaries and coordinate scales", () => {
  for (const coordinate of [0, 1e3, 1e8, 1e10, Number.MAX_VALUE, -Number.MAX_VALUE]) {
    const points = [
      { x: coordinate, y: -coordinate },
      { x: NaN, y: 0 },
    ];
    const index = createCompatiblePointIndex(points);
    for (const delta of [0, 1e-10, 1e-9, 1.01e-9, 1e-7, 1e-6, 1.01e-6, 1]) {
      const p = { x: coordinate + delta, y: -coordinate - delta };
      assert.equal(
        index.has(p),
        points.some((q) => pointsCompatible(p, q)),
      );
    }
  }
  assert.equal(createCompatiblePointIndex([]).has({ x: 0, y: 0 }), false);
  assert.equal(createCompatiblePointIndex([{ x: 0, y: 0 }]).has({ x: NaN, y: 0 }), false);
});
test("index owns coordinates and matches distributed and coincident points", () => {
  const points = Array.from({ length: 3000 }, (_, i) => ({
    x: (i % 100) * 3,
    y: Math.floor(i / 100) * 3,
  }));
  points.push({ ...points[0]! });
  const index = createCompatiblePointIndex(points);
  for (let i = 0; i < 100; i++) {
    const p = { x: (i * 17) % 300, y: (i * 13) % 90 };
    assert.equal(
      index.has(p),
      points.some((q) => pointsCompatible(p, q)),
    );
  }
  points[0]!.x = -99;
  assert.equal(index.has({ x: -99, y: 0 }), false);
  assert.equal(index.has({ x: 0, y: 0 }), true);
});
test("large complete connection group preserves windows, detachments and foreign contact validation", () => {
  const p = connectionGroupFixture(50, 100),
    wall = storeyOf(p).walls[0]!;
  const session: EditSession = {
    base: p,
    target: { kind: "wall", id: wall.id },
    action: "point",
    index: 1,
    anchor: wall.end,
  };
  const prepared = prepareEndpoint(p, wall.id);
  assert.equal(prepared.affectedWalls, 51);
  for (const point of [
    { x: 160, y: 0 },
    { x: 30, y: 0 },
    { x: 50, y: 1 },
    { x: 0, y: 30 },
    { x: 0, y: 33 },
  ]) {
    let full;
    try {
      full = editAtPointer(session, p, point);
    } catch {
      assert.throws(() => prepared.evaluate(point));
      continue;
    }
    assert.deepEqual(prepared.evaluate(point).project, full);
    assert.deepEqual(prepared.confirm(point), full);
  }
});
