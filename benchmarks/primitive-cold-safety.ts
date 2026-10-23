import assert from "node:assert/strict";
import { drawingPrimitiveCandidate } from "./primitive-cold-candidate.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { projectSnapPrimitives } from "../src/application/snapping/project-references.ts";
const p = tPairFixture(),
  s = storeyOf(p);
s.hatches = storeyOf(hatchPointFixture(2, 10)).hatches;
s.lines = [
  {
    id: "line",
    kind: "polyline",
    points: [
      { x: 0, y: 0 },
      { x: 2, y: 1 },
      { x: 4, y: 0 },
    ],
    layerId: p.defaultLayerIds.line,
    color: "#334155",
    penWidth: 0.2,
    style: "solid",
  },
];
const cache = drawingPrimitiveCandidate();
let checks = 0;
const check = () => {
  const snapshot = structuredClone(p);
  assert.deepEqual(cache.build(snapshot).data, projectSnapPrimitives(snapshot));
  checks++;
};
check();
check();
assert.equal(cache.stats().hits, 3);
// Wall T changes must still be derived even when every drawing cache entry hits.
s.walls[0]!.thickness = 0.3;
s.walls[1]!.thickness = 0.3;
s.walls[0]!.bodyOffset = 0.15;
s.walls[1]!.bodyOffset = 0.15;
check();
assert.equal(cache.stats().hits, 3);
s.lines[0]!.points.reverse();
check();
assert.equal(cache.stats().misses, 1);
s.lines[0]!.points.push({ x: 8, y: 4 });
check();
assert.equal(cache.stats().misses, 1);
s.lines[0]!.color = "#ff0000";
check();
assert.equal(cache.stats().hits, 3);
s.hatches.reverse();
check();
assert.equal(cache.stats().hits, 3);
// Same ID can be reused after deletion, but cannot recover an old geometry entry.
s.lines = [];
check();
s.lines = [
  {
    id: "line",
    kind: "line",
    points: [
      { x: 50, y: 1 },
      { x: 51, y: 1 },
    ],
    layerId: p.defaultLayerIds.line,
    color: "#000000",
    penWidth: 0.2,
    style: "solid",
  },
];
check();
assert.equal(cache.stats().misses, 1);
console.log(
  JSON.stringify({
    checks,
    wallTFullPath: true,
    reorderAndInsertion: true,
    appearanceReuse: true,
    deletedIdRecreated: true,
  }),
);

// Shallow caller freezing must not grant trust to mutable nested coordinates.
const shallow = Object.freeze(structuredClone(p));
const isolated = drawingPrimitiveCandidate();
const before = isolated.build(shallow);
storeyOf(shallow).lines![0]!.points[0]!.x += 0.05;
const after = isolated.build(shallow);
assert.deepEqual(after.data, projectSnapPrimitives(structuredClone(shallow)));
assert.notDeepEqual(before.data, after.data);
assert.equal(isolated.stats().misses, 1);
assert.throws(() => {
  after.data.references[0]!.point.x = 123;
}, TypeError);
console.log(JSON.stringify({ shallowFreezeNotTrusted: true, derivedMutationRejected: true }));
