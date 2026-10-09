import { createStandardLayers } from "../../domain/layers/model.ts";
import test from "node:test";
import assert from "node:assert/strict";
import type { Project } from "../../lib/bim/model.ts";
import { createLocalSnapSources } from "./local-sources.ts";
import { projectSnapReferences, projectSnapPrimitives } from "./project-references.ts";
import { segmentMayMeetBox } from "../../geometry/intersections/segment-box.ts";
import {
  createAffineScreenMetric,
  createIsotropicScreenMetric,
} from "../../geometry/projections/screen-metric.ts";
import { createHorizontalWorkplaneProjection } from "../../rendering/viewport/horizontal-workplane.ts";
import { advanceSnapDensity, emptySnapDensity } from "./density.ts";
import {
  createToolSourceQuery,
  drawingSnapPolicy,
  prepareToolReferences,
  resolveToolSnap,
} from "../tools/snapping.ts";

function fixture(pairs: [number, number, number, number][]): Project {
  return {
    schemaVersion: 12,
    hatchPatterns: [],
    assets: [],
    bimVisibility: { hiddenLayerIds: [] },
    ...createStandardLayers([]),
    unit: "m",
    id: "proximity",
    storey: {
      references: [],
      hatches: [],
      wallJoins: [],
      wallTJunctions: [],
      id: "s",
      walls: [],
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
  };
}

test("affine local query matches full enumeration under rotation, shear and foreshortening", () => {
  const project = fixture([
    [-100, 0, 100, 0],
    [0, -100, 0, 100],
    [-3, -2, 3, 2],
    [-3, 2, 3, -2],
    [1, 0, 2, 0],
    [1 + 5e-10, -1, 1 + 5e-10, 1],
  ]);
  const full = projectSnapReferences(project),
    local = createLocalSnapSources(project);
  for (const matrix of [
    [100, 0, 0, 2],
    [20, 80, -4, 2],
    [-30, 15, 5, 20],
  ]) {
    const metric = createAffineScreenMetric(...(matrix as [number, number, number, number]));
    for (const cursor of [
      { x: 0, y: 0 },
      { x: 1 + 5e-10, y: 0 },
      { x: -2, y: 0.3 },
    ])
      for (const radius of [0, 10, 30])
        assert.deepEqual(
          local.query(cursor, metric, radius).references,
          full.filter((r) => metric.distance(r.point, cursor) <= radius),
        );
  }
});

test("CSS refinement removes false density before pairs, preserving long crossings", () => {
  const project = fixture([
    ...Array.from({ length: 40 }, (_, i): [number, number, number, number] => [
      0.08,
      8 + i * 0.001,
      0.1,
      8 + i * 0.001,
    ]),
    [-1000, 0, 1000, 0],
    [0, -1000, 0, 1000],
  ]);
  const metric = createAffineScreenMetric(100, 0, 0, 1);
  const local = createLocalSnapSources(project).queryPrimitives({ x: 0, y: 0 }, metric, 10);
  assert.equal(local.segments.length, 2);
  assert.equal(local.segmentPairs, 1);
  assert.equal(advanceSnapDensity(emptySnapDensity(), local.segments.length, 0).paused, false);
  assert.ok(
    local.segments.every((s) => Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y) === 2000),
  );
});

test("isotropic adapter preserves exact point-radius arithmetic and numeric API results", () => {
  const local = createLocalSnapSources(
    fixture([
      [-3, 2, 4, 2],
      [0, -4, 0, 4],
    ]),
  );
  for (const scale of [0.5, 100, 10000]) {
    const metric = createIsotropicScreenMetric(scale),
      cursor = { x: 0.1, y: -0.2 };
    assert.equal(
      metric.distance(cursor, { x: 3, y: 4 }),
      Math.hypot(cursor.x - 3, cursor.y - 4) * scale,
    );
    assert.deepEqual(local.query(cursor, metric, 10), local.query(cursor, scale, 10));
  }
  for (const scale of [0, -1, NaN, Infinity])
    assert.throws(() => createIsotropicScreenMetric(scale));
  assert.throws(() => createAffineScreenMetric(1, 2, 2, 4));
  assert.throws(() => createAffineScreenMetric(NaN, 0, 0, 1));
});

test("workplane metric matches CSS distances and contains inverse search-square edges", () => {
  for (const pitch of [0.03, 0.3, 1.2]) {
    const result = createHorizontalWorkplaneProjection(
      { min: [-3, -2, 0], max: [4, 5, 3] },
      { yaw: 0.7, pitch, zoom: 2, panX: 0.1, panY: -0.2 },
      { left: 73, top: 91, width: 801, height: 601 },
      1602 / 1202,
    );
    assert.equal(result.status, "ok");
    if (result.status !== "ok") continue;
    const p = result.value,
      cursor = { x: 1, y: 2 },
      other = { x: -1, y: 3 };
    const a = p.toScreen(cursor),
      b = p.toScreen(other);
    assert.equal(a.status, "ok");
    assert.equal(b.status, "ok");
    if (a.status !== "ok" || b.status !== "ok") continue;
    assert.ok(
      Math.abs(
        p.metric.distance(cursor, other) - Math.hypot(a.value.x - b.value.x, a.value.y - b.value.y),
      ) < 1e-9,
    );
    const box = p.metric.queryBounds(cursor, 10, 1e-6);
    for (const dx of [-10, 0, 10])
      for (const dy of [-10, 0, 10]) {
        const q = p.toPlane({ x: a.value.x + dx, y: a.value.y + dy });
        assert.equal(q.status, "ok");
        if (q.status !== "ok") continue;
        assert.ok(
          q.value.point.x >= box.minX &&
            q.value.point.x <= box.maxX &&
            q.value.point.y >= box.minY &&
            q.value.point.y <= box.maxY,
        );
      }
  }
});

test("overlapping diagonal bounds outside the cursor square produce no pairs", () => {
  const project = fixture(
    Array.from({ length: 500 }, (_, i) => [-100, -98 + i * 0.1, 100, 102 + i * 0.1]),
  );
  const local = createLocalSnapSources(project).query({ x: 0.013, y: 0.009 }, 100, 10);
  assert.equal(local.segments.length, 0);
  assert.equal(local.segmentPairs, 0);
  assert.deepEqual(local.references, []);
});

test("metric segment refinement keeps circle tangencies and tolerance contacts, not square corners", () => {
  const metric = createAffineScreenMetric(100, 0, 0, 1);
  const cursor = { x: 0, y: 0 };
  assert.equal(metric.segmentNear(cursor, { x: -100, y: 10 }, { x: 100, y: 10 }, 10, 0), true);
  assert.equal(
    metric.segmentNear(cursor, { x: -100, y: 10.01 }, { x: 100, y: 10.01 }, 10, 0),
    false,
  );
  assert.equal(metric.segmentNear(cursor, { x: 0.08, y: 8 }, { x: 0.1, y: 8 }, 10, 0), false);
  assert.equal(metric.segmentNear(cursor, { x: 5e-10, y: -1 }, { x: 5e-10, y: 1 }, 0, 1e-6), true);
  const shear = createAffineScreenMetric(100, 50, 0, 1);
  assert.equal(shear.segmentNear(cursor, { x: -5, y: 10 }, { x: 5, y: 10 }, 10, 0), true);
  assert.throws(() => metric.queryBounds(cursor, -1, 0));
  assert.throws(() => metric.queryBounds(cursor, 1, NaN));
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
