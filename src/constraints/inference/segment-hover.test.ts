import test from "node:test";
import assert from "node:assert/strict";
import { hoveredSegment, withParallelDirections } from "./segment-hover.ts";
import { advanceHoverReference, emptyHoverReference } from "./hover-reference.ts";
import { querySnap } from "../snapping/engine.ts";
import type { SnapReference } from "../snapping/engine.ts";
import { advanceGuideDirections } from "../guides/directions.ts";
import { addLine, createProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { projectSnapReferences } from "../../application/snapping/project-references.ts";
import {
  createAffineScreenMetric,
  createIsotropicScreenMetric,
} from "../../geometry/projections/screen-metric.ts";
import {
  sameHoverSession,
  suspendHoverReference,
  previewPointReferences,
} from "./hover-reference.ts";

test("affine segment hover uses CSS proximity with bounded endpoints", () => {
  const metric = createAffineScreenMetric(100, 0, 0, 1);
  const source: SnapReference = {
    entityId: "s",
    feature: "segment",
    point: { x: 1, y: 1 },
    segment: { start: { x: 0, y: 0 }, end: { x: 2, y: 2 } },
  };
  const p = { x: 1, y: 1.5 };
  const projected = metric.projectSegment(p, source.segment!.start, source.segment!.end)!;
  assert.ok(projected.t > 0.49 && projected.t < 0.51);
  assert.equal(hoveredSegment(p, [source], metric), source);
  assert.equal(hoveredSegment(p, [source], 100), null);
  const beyond = metric.projectSegment({ x: 3, y: 3 }, source.segment!.start, source.segment!.end)!;
  assert.deepEqual(beyond.point, source.segment!.end);
  assert.ok(beyond.t > 1);
  assert.equal(hoveredSegment({ x: 3, y: 3 }, [source], metric, 1000), null);
  assert.equal(metric.projectSegment(p, { x: 0, y: 0 }, { x: 0, y: 0 }), null);
});

test("affine hover keeps 600 ms toggle, restarts dwell on source change and protects origin", () => {
  const metric = createAffineScreenMetric(100, 0, 0, 1);
  const sources: SnapReference[] = [0, 30].map((y, i) => ({
    entityId: String(i),
    feature: "segment",
    point: { x: 1, y },
    segment: { start: { x: 0, y }, end: { x: 2, y } },
  }));
  const a = hoveredSegment({ x: 1, y: 5 }, sources, metric)!;
  const b = hoveredSegment({ x: 1, y: 35 }, sources, metric)!;
  let state = advanceHoverReference(emptyHoverReference(), a, 0, 600);
  state = advanceHoverReference(state, b, 500, 600);
  state = advanceHoverReference(state, b, 1099, 600);
  assert.equal(state.references.length, 0);
  state = advanceHoverReference(state, b, 1100, 600);
  assert.equal(state.references.length, 1);
  state = suspendHoverReference(state, true);
  assert.equal(state.references.length, 1);
  state = advanceHoverReference(state, b, 1200, 600);
  state = advanceHoverReference(state, b, 1800, 600);
  assert.equal(state.references.length, 0);
  const pinned = previewPointReferences(state, [a, b], [a])!;
  assert.deepEqual(pinned.value.references, [b]);
  const session = { enabled: true, references: sources, pixelsPerMetre: 100, metric };
  assert.ok(
    sameHoverSession(session, { ...session, metric: createAffineScreenMetric(200, 0, 0, 2) }),
  );
  assert.equal(sameHoverSession(session, { ...session, references: [...sources] }), false);
});

test("isotropic segment projection preserves legacy hover radius arithmetic", () => {
  for (const scale of [0.5, 100, 10000])
    for (const offset of [0, 1e7]) {
      const start = { x: offset, y: offset },
        end = { x: offset + 4, y: offset + 2 };
      for (const p of [
        { x: offset + 1, y: offset + 0.5 },
        { x: offset + 2, y: offset + 1 + 10 / scale },
      ]) {
        const metric = createIsotropicScreenMetric(scale),
          q = metric.projectSegment(p, start, end)!;
        const t = ((p.x - start.x) * 4 + (p.y - start.y) * 2) / 20;
        assert.equal(q.t, t);
        const clamped = Math.max(0, Math.min(1, t));
        assert.equal(
          q.distance,
          Math.hypot(p.x - start.x - clamped * 4, p.y - start.y - clamped * 2) * scale,
        );
      }
    }
});
const project = addLine(createProject("p", "s"), {
  id: "line",
  kind: "line",
  points: [
    { x: 0, y: 2 },
    { x: 4, y: 4 },
  ],
  ...defaultLineAppearance,
});
const refs = projectSnapReferences(project);
test("line interiors acquire once after 600 ms, remain stable along the segment, and toggle on revisit", () => {
  const a = hoveredSegment({ x: 1, y: 2.5 }, refs, 100)!;
  const b = hoveredSegment({ x: 1.1, y: 2.55 }, refs, 100)!;
  assert.ok(a.segment);
  assert.equal(a, b);
  let state = advanceHoverReference(emptyHoverReference(), a, 0, 600);
  state = advanceHoverReference(state, b, 599, 600);
  assert.equal(state.references.length, 0);
  state = advanceHoverReference(state, b, 600, 600);
  assert.equal(state.references.length, 1);
  state = advanceHoverReference(state, b, 1600, 600);
  assert.equal(state.references.length, 1);
  state = advanceHoverReference(state, null, 1700, 600);
  state = advanceHoverReference(state, a, 1800, 600);
  state = advanceHoverReference(state, a, 2400, 600);
  assert.equal(state.references.length, 0);
  for (const scale of [10, 100, 1000]) {
    assert.ok(hoveredSegment({ x: 1, y: 2.5 + 5 / scale }, refs, scale));
    assert.equal(hoveredSegment({ x: 1, y: 2.5 + 20 / scale }, refs, scale), null);
  }
  assert.equal(hoveredSegment({ x: 5, y: 4.5 }, refs, 100), null);
});
test("tracked oblique direction supplies a parallel through another origin with matching snap and overlay", () => {
  const segment = hoveredSegment({ x: 1, y: 2.5 }, refs, 100)!;
  const origin: SnapReference = { entityId: "origin", feature: "start", point: { x: 0, y: 0 } };
  const active = withParallelDirections([origin, segment]);
  const cursor = { x: 1.6, y: 0.82 };
  const guides = advanceGuideDirections(cursor, active);
  const context = {
    enabled: true,
    references: [...refs, origin],
    activeReferences: active,
    guideDirections: guides,
    pixelsPerMetre: 100,
    endpointRadiusPx: 10,
    gridSpacing: null,
    orthoOrigin: null,
  };
  const result = querySnap(cursor, context);
  assert.equal(result.candidate?.kind, "parallel");
  assert.deepEqual(result.candidate?.guideOrigin, origin.point);
  assert.ok(Math.abs(result.point.y - result.point.x / 2) < 1e-10);
  assert.equal(guides[0]!.kind, "parallel");
  const disabled = querySnap(cursor, { ...context, enabled: false });
  assert.deepEqual(disabled.point, cursor);
  const removed = querySnap(cursor, {
    ...context,
    activeReferences: withParallelDirections([origin]),
    guideDirections: [],
  });
  assert.notEqual(removed.candidate?.kind, "parallel");
});
