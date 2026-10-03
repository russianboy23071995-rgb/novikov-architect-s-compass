import test from "node:test";
import assert from "node:assert/strict";
import type { Project } from "../../lib/bim/model.ts";
import { createLocalSnapSources } from "./local-sources.ts";
import { projectSnapReferences, projectSnapPrimitives } from "./project-references.ts";
import { segmentMayMeetBox } from "../../geometry/intersections/segment-box.ts";
import {
  createToolSourceQuery,
  drawingSnapPolicy,
  prepareToolReferences,
  resolveToolSnap,
} from "../tools/snapping.ts";

function fixture(pairs: [number, number, number, number][]): Project {
  return {
    schemaVersion: 1,
    unit: "m",
    id: "proximity",
    storey: {
      id: "s",
      walls: [],
      windows: [],
      lines: pairs.map(([x, y, a, b], i) => ({
        id: `l${i}`,
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
  };
}

test("overlapping diagonal bounds outside the cursor square produce no pairs", () => {
  const project = fixture(
    Array.from({ length: 500 }, (_, i) => [-100, -98 + i * 0.1, 100, 102 + i * 0.1]),
  );
  const local = createLocalSnapSources(project).query({ x: 0.013, y: 0.009 }, 100, 10);
  assert.equal(local.segments.length, 0);
  assert.equal(local.segmentPairs, 0);
  assert.deepEqual(local.references, []);
});

test("segment square test preserves corner contacts, reversals and degeneracy", () => {
  const box = { minX: -1, minY: -1, maxX: 1, maxY: 1 };
  for (const [a, b, expected] of [
    [{ x: -10, y: -8 }, { x: 10, y: 12 }, true],
    [{ x: -10, y: -7 }, { x: 10, y: 13 }, false],
    [{ x: -100, y: 0 }, { x: 100, y: 0 }, true],
    [{ x: 1, y: 1 }, { x: 1, y: 1 }, true],
    [{ x: 2, y: 2 }, { x: 2, y: 2 }, false],
  ] as const) {
    assert.equal(segmentMayMeetBox(a, b, box), expected);
    assert.equal(segmentMayMeetBox(b, a, box), expected);
  }
});

test("dense real crossings retain every source identity and full original segment", () => {
  const project = fixture(Array.from({ length: 80 }, (_, i) => [-100, -20 - i, 100, 20 + i]));
  const local = createLocalSnapSources(project).query({ x: 0, y: 0 }, 100, 0);
  assert.equal(local.segments.length, 80);
  assert.equal(local.segmentPairs, (80 * 79) / 2);
  assert.ok(local.segments.every((s) => s.start.x === -100 && s.end.x === 100));
  assert.deepEqual(
    local.references,
    projectSnapReferences(project).filter((r) => r.point.x === 0 && r.point.y === 0),
  );
});

test("tolerance contacts, radius boundaries and large offsets match full enumeration", () => {
  for (const offset of [0, -100, 1e7]) {
    const project = fixture([
      [offset, offset, offset + 1, offset],
      [offset + 1 + 5e-10, offset - 1, offset + 1 + 5e-10, offset + 1],
      [offset - 100, offset - 100, offset + 100, offset + 100],
      [offset - 100, offset + 100, offset + 100, offset - 100],
      [offset + 1, offset + 1, offset + 2, offset + 2],
    ]);
    const full = projectSnapReferences(project),
      index = createLocalSnapSources(project);
    for (const scale of [0.5, 100, 10000])
      for (const cursor of [
        { x: offset, y: offset },
        { x: offset + 1 + 5e-10, y: offset },
      ])
        for (const radius of [0, 10, 100]) {
          assert.deepEqual(
            index.query(cursor, scale, radius).references,
            full.filter(
              (r) => Math.hypot(r.point.x - cursor.x, r.point.y - cursor.y) * scale <= radius,
            ),
          );
        }
  }
});

test("deterministic random queries and exclusions preserve exact reference order", () => {
  let seed = 76139;
  const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32) * 200 - 100;
  const project = fixture(
    Array.from({ length: 100 }, () => [random(), random(), random(), random()]),
  );
  const full = projectSnapReferences(project),
    index = createLocalSnapSources(project);
  for (let i = 0; i < 250; i++) {
    const cursor = { x: random(), y: random() },
      scale = [0.5, 100, 10000][i % 3]!;
    const allowed = (r: { entityId: string }) => r.entityId !== `l${i % 100}`;
    assert.deepEqual(
      index.query(cursor, scale, 10, allowed).references,
      full.filter(
        (r) =>
          allowed(r) &&
          (r.dependencies ?? []).every(allowed) &&
          Math.hypot(r.point.x - cursor.x, r.point.y - cursor.y) * scale <= 10,
      ),
    );
  }
  for (const reference of full.filter((r) => r.kind === "segment-intersection").slice(0, 100)) {
    assert.deepEqual(
      index.query(reference.point, 100, 0).references,
      full.filter((r) => r.point.x === reference.point.x && r.point.y === reference.point.y),
    );
  }
});

test("complete resolver preserves remote active guides after local segment rejection", () => {
  const project = fixture([
    [-100, -98, 100, 102],
    [-100, -96, 100, 104],
    [-1, -1, 1, 1],
    [-1, 1, 1, -1],
  ]);
  const index = createLocalSnapSources(project),
    policy = drawingSnapPolicy({ x: -2, y: -2 });
  const activeReferences = [
    policy.origin,
    ...projectSnapPrimitives(project)
      .references.filter((r) => r.kind === "midpoint")
      .slice(0, 2),
  ];
  const sourceQuery = createToolSourceQuery(index, policy);
  const context = {
    references: [],
    sourceQuery,
    activeReferences,
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
  };
  for (const cursor of [
    { x: 0.013, y: 0.009 },
    { x: 4, y: 6 },
    { x: 8, y: 10 },
  ])
    for (const ortho of [false, true])
      for (const shift of [false, true]) {
        const options = { ortho, shift, featureSnap: true };
        assert.deepEqual(
          resolveToolSnap(policy, cursor, context, options),
          resolveToolSnap(
            policy,
            cursor,
            {
              ...context,
              sourceQuery: undefined,
              references: prepareToolReferences(policy, projectSnapReferences(project)),
            },
            options,
          ),
        );
      }
});
