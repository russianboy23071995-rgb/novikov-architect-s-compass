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
