import { createStandardLayers } from "../../domain/layers/model.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  validateProject,
  serializeProject,
  deserializeProject,
  updateWall,
} from "../../lib/bim/model.ts";
import { projectSnapReferences } from "./project-references.ts";
import { createLocalSnapSources, getLocalSnapSources } from "./local-sources.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";
import { createBoxIndex } from "../../geometry/spatial/box-index.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";

function fixture(pairs: number[][]) {
  return validateProject({
    schemaVersion: 5,
    bimVisibility: { hiddenLayerIds: [] },
    ...createStandardLayers([]),
    unit: "m",
    id: "p",
    storey: {
      hatches: [],
      id: "s",
      walls: [
        {
          id: "w",
          layerId: "layer:exterior-wall",
          start: { x: -3, y: -3 },
          end: { x: -1, y: -3 },
          height: 2.8,
          thickness: 0.36,
          bodyOffset: 0,
        },
      ],
      windows: [],
      lines: pairs.map(([x, y, a, b], i) => ({
        id: `l${i}`,
        layerId: "layer:drawing",
        kind: "line",
        points: [
          { x, y },
          { x: a, y: b },
        ],
        color: "#334155",
        penWidth: 0.25,
        style: "solid",
      })),
    },
  });
}
const pairs = [
  [-1000, 0, 1000, 0],
  [0, -1000, 0, 1000],
  [-2, -2, 2, 2],
  [2, 2, 4, 2],
  [3, 2, 5, 2],
  [-2, 1, 2, 1.000000001],
  [-2, 1.000000001, 2, 1],
  [10, 10, 10.00000001, 10],
  [1e7, 1e7, 1e7 + 3, 1e7 + 3],
  [1e7, 1e7 + 3, 1e7 + 3, 1e7],
];
test("numerically accepted contact outside an exact segment box is not lost", () => {
  const project = fixture([
    [0, 0, 1, 0],
    [1 + 5e-10, -1, 1 + 5e-10, 1],
  ]);
  const cursor = { x: 1 + 5e-10, y: 0 };
  const full = projectSnapReferences(project).filter(
    (r) => r.point.x === cursor.x && r.point.y === 0,
  );
  assert.ok(full.some((r) => r.kind === "segment-intersection"));
  assert.deepEqual(createLocalSnapSources(project).query(cursor, 100, 0).references, full);
});
test("local points and intersection identities match full enumeration across scales and exclusions", () => {
  const project = fixture(pairs),
    full = projectSnapReferences(project),
    index = createLocalSnapSources(project);
  for (const scale of [0.5, 100, 10000])
    for (const cursor of [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
      { x: 3, y: 2 },
      { x: 0, y: 1 },
      { x: 10, y: 10 },
      { x: 1e7 + 1.5, y: 1e7 + 1.5 },
    ]) {
      for (const excluded of ["none", "l0", "w"]) {
        const allowed = (r: { entityId: string }) => r.entityId !== excluded;
        const expected = full.filter(
          (r) =>
            allowed(r) &&
            (r.dependencies ?? []).every(allowed) &&
            Math.hypot(r.point.x - cursor.x, r.point.y - cursor.y) * scale <= 10,
        );
        assert.deepEqual(index.query(cursor, scale, 10, allowed).references, expected);
      }
    }
  const crossing = index.query({ x: 0, y: 0 }, 100, 1);
  assert.ok(crossing.references.some((r) => r.kind === "segment-intersection"));
  assert.ok(crossing.segments.some((s) => s.start.x === -1000));
});

test("deterministic scattered geometry and boundary radii match full scan", () => {
  let seed = 12345;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32) * 20 - 10;
  const project = fixture(
    Array.from({ length: 80 }, () => [random(), random(), random(), random()]),
  );
  const full = projectSnapReferences(project),
    index = createLocalSnapSources(project);
  for (let i = 0; i < 100; i++) {
    const cursor = { x: random(), y: random() },
      scale = i % 2 ? 50 : 250;
    assert.deepEqual(
      index.query(cursor, scale, 10).references,
      full.filter((r) => Math.hypot(r.point.x - cursor.x, r.point.y - cursor.y) * scale <= 10),
    );
  }
  for (const r of full.slice(0, 20)) {
    assert.deepEqual(
      index.query(r.point, 100, 0).references,
      full.filter((p) => p.point.x === r.point.x && p.point.y === r.point.y),
    );
  }
});

test("snapshot lookup retains distant sources and changes correctly on load/history", () => {
  const h = createHistory(fixture(pairs)),
    original = getLocalSnapSources(h.present);
  const source = projectSnapReferences(h.present).find((r) => r.entityId === "l0")!;
  assert.ok(original.lookup(referenceKey(source)));
  assert.ok(
    !original
      .query({ x: 1e7, y: 1e7 }, 100, 10)
      .references.some((r) => referenceKey(r) === referenceKey(source)),
  );
  assert.equal(getLocalSnapSources(h.present), original);
  const next = commitProject(h, updateWall(h.present, "w", { end: { x: 2, y: 2 } }));
  const changed = getLocalSnapSources(next.present);
  assert.notEqual(changed, original);
  const undo = undoProject(next);
  assert.equal(getLocalSnapSources(undo.present), original);
  assert.equal(getLocalSnapSources(redoProject(undo).present), changed);
  assert.notEqual(getLocalSnapSources(deserializeProject(serializeProject(h.present))), original);
  assert.throws(() => {
    original.lookup(referenceKey(source))!.point.x = 99;
  });
});

test("box index copies bounds, returns touching/zero-size entries and rejects invalid requests", () => {
  const box = { minX: 0, minY: 0, maxX: 1, maxY: 1 };
  const index = createBoxIndex([
    { box, value: 1 },
    { box: { minX: 2, minY: 2, maxX: 2, maxY: 2 }, value: 2 },
  ]);
  box.maxX = 100;
  assert.deepEqual(index.query({ minX: 1, minY: 1, maxX: 2, maxY: 2 }), [1, 2]);
  assert.deepEqual(index.query({ minX: 3, minY: 0, maxX: 4, maxY: 1 }), []);
  assert.throws(() => index.query({ minX: NaN, minY: 0, maxX: 1, maxY: 1 }));
  const sources = createLocalSnapSources(fixture([]));
  assert.throws(() => sources.query({ x: 0, y: 0 }, 0, 10));
  assert.throws(() => sources.query({ x: 0, y: 0 }, 100, -1));
});
