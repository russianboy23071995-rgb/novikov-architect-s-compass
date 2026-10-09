import { createStandardLayers } from "../../domain/layers/model.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyReferenceSelection,
  reduceReferenceSelection,
  segmentKey,
} from "./reference-selection.ts";
import { createLocalSnapSources } from "./local-sources.ts";
import { createToolSourceQuery } from "../tools/snapping.ts";
import { pickReferenceSegments } from "../../rendering/viewport/reference-picking.ts";
import { validateProject } from "../../lib/bim/model.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";
import {
  createAffineScreenMetric,
  createIsotropicScreenMetric,
} from "../../geometry/projections/screen-metric.ts";

test("affine reference picking ranks CSS hits, clips endpoints and preserves ties", () => {
  const metric = createAffineScreenMetric(100, 0, 0, 1);
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 4 } };
  const b = { entityId: "b", feature: "end", point: { x: 0.09, y: 0 } };
  assert.deepEqual(pickReferencePoints([b, a], { x: 0, y: 0 }, metric), [a, b]);
  assert.deepEqual(pickReferencePoints([a], { x: 0, y: 14 }, metric), [a]);
  assert.deepEqual(pickReferencePoints([a], { x: 0, y: 14.001 }, metric), []);
  const segment = { start: { x: 0, y: 0 }, end: { x: 2, y: 2 }, source: a };
  assert.deepEqual(pickReferenceSegments([segment], { x: 1, y: 1.5 }, metric), [a]);
  assert.deepEqual(pickReferenceSegments([segment], { x: 2.01, y: 2.01 }, metric), [a]);
  assert.deepEqual(pickReferenceSegments([segment], { x: 3, y: 3 }, metric), []);
  const twin = { ...segment, source: b };
  assert.deepEqual(
    pickReferenceSegments([twin, segment], { x: 1, y: 1 }, metric),
    pickReferenceSegments([segment, twin], { x: 1, y: 1 }, metric),
  );
  assert.deepEqual(
    pickReferenceSegments([{ start: a.point, end: a.point, source: a }], a.point, metric),
    [a],
  );
});

test("explicit isotropic picking matches numeric API across zoom and excludes invalid hits", () => {
  const local = createLocalSnapSources(fixture());
  for (const scale of [0.5, 100, 10000]) {
    const metric = createIsotropicScreenMetric(scale);
    for (const point of [
      { x: 0, y: 0 },
      { x: 10, y: 1 },
      { x: -9, y: 0.1 },
    ]) {
      assert.deepEqual(
        pickReferenceSegments(local.allSegments, point, metric),
        pickReferenceSegments(local.allSegments, point, scale),
      );
      const refs = local.queryPrimitives(point, scale, 10).references;
      assert.deepEqual(
        pickReferencePoints(refs, point, metric),
        pickReferencePoints(refs, point, scale),
      );
    }
  }
  assert.deepEqual(pickReferenceSegments(local.allSegments, { x: NaN, y: 0 }, 100), []);
});

test("reference selection draft, cancel, validation and clear never change committed selection early", () => {
  let s = reduceReferenceSelection(emptyReferenceSelection(), { type: "begin" });
  assert.deepEqual(reduceReferenceSelection(s, { type: "apply", allowed: new Set() }), s);
  s = reduceReferenceSelection(s, { type: "toggle", key: "one" });
  assert.equal(s.confirmed, null);
  s = reduceReferenceSelection(s, { type: "apply", allowed: new Set(["one"]) });
  assert.deepEqual(s.confirmed, ["one"]);
  assert.equal(s.draft, null);
  let draft = reduceReferenceSelection(s, { type: "begin" });
  draft = reduceReferenceSelection(draft, { type: "toggle", key: "two" });
  assert.deepEqual(reduceReferenceSelection(draft, { type: "cancel" }), s);
  assert.deepEqual(
    reduceReferenceSelection(draft, { type: "apply", allowed: new Set(["one"]) }).confirmed,
    ["one"],
  );
  assert.deepEqual(reduceReferenceSelection(s, { type: "clear" }), emptyReferenceSelection());
});
function fixture() {
  return validateProject({
    schemaVersion: 14,
    hatchPatterns: [],
    assets: [],
    bimVisibility: { hiddenLayerIds: [] },
    ...createStandardLayers([]),
    unit: "m",
    id: "refs",
    storey: {
      references: [],
      hatches: [],
      wallJoins: [],
      wallTJunctions: [],
      id: "s",
      walls: [],
      windows: [],
      lines: Array.from({ length: 48 }, (_, i) => ({
        id: "l" + i,
        layerId: "layer:drawing",
        kind: "polyline",
        points: [
          { x: -10, y: -i - 1 },
          { x: 10, y: i + 1 },
          { x: 20, y: i + 1 },
        ],
        color: "#334155",
        penWidth: 0.25,
        style: "solid",
      })),
    },
  });
}
test("selected segment pairs before density guard; unrelated points and remote guides remain", () => {
  const model = createLocalSnapSources(fixture());
  const query = createToolSourceQuery(model, null);
  const all = model.queryPrimitives({ x: 0, y: 0 }, 100, 10);
  const selected = new Set(all.segments.slice(0, 2).map((s) => segmentKey(s.source)));
  assert.equal(query.inspect({ x: 0, y: 0 }, 100, 10).segments.length, 48);
  assert.equal(query.inspect({ x: 0, y: 0 }, 100, 10, selected).segmentPairs, 1);
  const refs = query({ x: 0, y: 0 }, 100, 10, [], false, selected);
  assert.equal(refs.filter((r) => r.kind === "segment-intersection").length, 1);
  assert.equal(refs.filter((r) => r.kind === "midpoint").length, 48);
  assert.equal(
    query({ x: 0, y: 0 }, 100, 10, [], false, new Set()).some(
      (r) => r.kind === "segment-intersection",
    ),
    false,
  );
  const active = all.segments[10]!.source;
  assert.ok(
    query({ x: 100, y: 0 }, 100, 10, [active], false, selected).some(
      (r) => r.entityId === active.entityId,
    ),
  );
  assert.equal(query.inspect({ x: 15, y: 1 }, 100, 10, selected).segments.length, 0);
  const context = { enabled: true, references: [], sourceQuery: query, pixelsPerMetre: 100 };
  assert.ok(sameHoverSession(context, { ...context, selectedSegments: selected, suspended: true }));
});
test("ambiguous picking uses actual segments and deterministic order, with per-segment identity", () => {
  const segments = createLocalSnapSources(fixture()).allSegments;
  const hits = pickReferenceSegments(segments, { x: 0, y: 0 }, 100);
  assert.equal(hits.length, 48);
  assert.deepEqual(hits, pickReferenceSegments([...segments].reverse(), { x: 0, y: 0 }, 100));
  assert.equal(pickReferenceSegments(segments, { x: 0, y: 1000 }, 100).length, 0);
  assert.equal(
    pickReferenceSegments(segments, { x: 15, y: 1 }, 100)[0]?.feature,
    "segment-1-midpoint:[10,1,20,1]",
  );
});
import {
  emptyHoverReference,
  previewPointReferences,
  advanceHoverReference,
  HOVER_REFERENCE_CAPACITY,
} from "../../constraints/inference/hover-reference.ts";
import { pickReferencePoints } from "../../rendering/viewport/reference-picking.ts";
const pointRef = (n: number) => ({ entityId: "p" + n, feature: "endpoint", point: { x: n, y: 0 } });
test("explicit points preview exact oldest replacement without mutation; hover shares capacity", () => {
  let state = emptyHoverReference();
  for (let n = 0; n < 4; n++) state = advanceHoverReference(state, pointRef(n), n, 0);
  const original = structuredClone(state);
  const preview = previewPointReferences(state, [pointRef(4), pointRef(5)])!;
  assert.deepEqual(state, original);
  assert.deepEqual(
    preview.replaced.map((r) => r.entityId),
    ["p0", "p1"],
  );
  assert.deepEqual(
    preview.value.references.map((r) => r.entityId),
    ["p2", "p3", "p4", "p5"],
  );
  const hover = advanceHoverReference(preview.value, pointRef(6), 100, 0);
  assert.equal(hover.references.length, HOVER_REFERENCE_CAPACITY);
  assert.deepEqual(
    hover.references.map((r) => r.entityId),
    ["p3", "p4", "p5", "p6"],
  );
});
test("explicit points protect pinned origin, deduplicate and reject overflow atomically", () => {
  const state = emptyHoverReference();
  const origin = pointRef(0);
  const preview = previewPointReferences(state, [origin, pointRef(1), pointRef(1)], [origin])!;
  assert.deepEqual(preview.value.references, [pointRef(1)]);
  assert.equal(
    previewPointReferences(
      state,
      Array.from({ length: 5 }, (_, i) => pointRef(i)),
    ),
    null,
  );
  assert.deepEqual(state, emptyHoverReference());
  const existing = { ...state, references: [pointRef(1), pointRef(2), pointRef(3), pointRef(4)] };
  assert.deepEqual(previewPointReferences(existing, [pointRef(1), pointRef(5)])!.replaced, [
    pointRef(2),
  ]);
});
test("point picking uses CSS distance, exact source identity, and excludes computed intersections", () => {
  const p = pointRef(0),
    midpoint = { ...pointRef(1), kind: "midpoint" as const };
  const refs = [p, midpoint, { ...pointRef(2), kind: "segment-intersection" as const }];
  assert.deepEqual(pickReferencePoints(refs, { x: 0.09, y: 0 }, 100), [p]);
  assert.deepEqual(pickReferencePoints(refs, { x: 0.11, y: 0 }, 100), []);
  assert.deepEqual(pickReferencePoints(refs, { x: 1, y: 0 }, 100), [midpoint]);
  assert.deepEqual(pickReferencePoints(refs, { x: 2, y: 0 }, 100), []);
  assert.deepEqual(pickReferencePoints(refs, { x: 0.18, y: 0 }, 50), [p]);
});
test("point candidates obey host exclusions and snapshot invalidation without pair calculation", () => {
  const model = createLocalSnapSources(fixture());
  const query = createToolSourceQuery(model, {
    origin: pointRef(999),
    sources: (rs) => rs.filter((r) => r.entityId !== "l0"),
    resolve: querySnap,
  });
  const local = query.inspect({ x: 0, y: 0 }, 100, 10);
  assert.ok(
    pickReferencePoints(local.references, { x: 0, y: 0 }, 100).every((r) => r.entityId !== "l0"),
  );
  const old = local.references[0]!;
  const changed = fixture();
  changed.storey.lines![1]!.points[0]!.x += 1;
  const next = createLocalSnapSources(changed);
  assert.equal(next.lookup(referenceKey(old)), undefined);
});
import { suspendHoverReference } from "../../constraints/inference/hover-reference.ts";
import { drawingSnapPolicy } from "../tools/snapping.ts";
test("one drawing session preserves references across origin and source-adapter changes", () => {
  const model = createLocalSnapSources(fixture());
  const sessionKey = {};
  const first = drawingSnapPolicy({ x: 0, y: 0 }),
    next = drawingSnapPolicy({ x: 1, y: 1 });
  const a = {
    enabled: true,
    references: [first.origin],
    sourceQuery: createToolSourceQuery(model, first),
    pixelsPerMetre: 100,
    sessionKey,
  };
  const b = { ...a, references: [next.origin], sourceQuery: createToolSourceQuery(model, next) };
  assert.ok(sameHoverSession(a, b));
  const acquired = previewPointReferences(emptyHoverReference(), [
    model.allSegments[0]!.source,
  ])!.value;
  assert.equal(suspendHoverReference(acquired, true).references, acquired.references);
  assert.ok(
    b
      .sourceQuery({ x: 100, y: 100 }, 100, 10, acquired.references)
      .some((r) => r.entityId === acquired.references[0]!.entityId),
  );
});
test("viewport, model/history and operation scopes cannot revive old reference sessions", () => {
  const initial = {
    enabled: true,
    references: [],
    pixelsPerMetre: 100,
    sessionKey: {},
    resetKey: 0,
  };
  for (const reason of ["viewport", "layout", "model", "undo", "redo", "cancel"]) {
    assert.equal(sameHoverSession(initial, { ...initial, sessionKey: { reason } }), false);
  }
  assert.equal(sameHoverSession(initial, { ...initial, enabled: false }), false);
  assert.equal(sameHoverSession(initial, { ...initial, resetKey: 1 }), false);
  assert.ok(sameHoverSession(initial, { ...initial, pixelsPerMetre: 500, suspended: true }));
});
test("pan suspension retains acquired points but cancels pending dwell", () => {
  const active = previewPointReferences(emptyHoverReference(), [pointRef(1)])!.value;
  const pending = advanceHoverReference(active, pointRef(2), 100, 600);
  const suspended = suspendHoverReference(pending, true);
  assert.deepEqual(suspended.references, [pointRef(1)]);
  assert.equal(suspended.pending, null);
  assert.equal(suspended.consumed, null);
  const resumed = advanceHoverReference(suspended, pointRef(2), 1000, 600);
  assert.equal(resumed.references.length, 1);
  assert.equal(advanceHoverReference(resumed, pointRef(2), 1599, 600).references.length, 1);
  assert.equal(advanceHoverReference(resumed, pointRef(2), 1600, 600).references.length, 2);
});

// Boundary selection uses the same screen metric for hatches and closed polylines.
test("closed contour edge picking uses pixel tolerance, exact projection and closing edge", async () => {
  const { pickContourEdge } = await import("../../rendering/viewport/reference-picking.ts");
  const ring = [
    { x: 0, y: 0 },
    { x: 4, y: 0 },
    { x: 4, y: 3 },
    { x: 0, y: 3 },
  ];
  for (const zoom of [10, 100, 1000]) {
    const hit = pickContourEdge(ring, { x: 1, y: -5 / zoom }, zoom);
    assert.equal(hit?.index, 0);
    assert.deepEqual(hit?.point, { x: 1, y: 0 });
    assert.equal(pickContourEdge(ring, { x: 1, y: -7 / zoom }, zoom), null);
    assert.equal(pickContourEdge(ring, { x: -5 / zoom, y: 1 }, zoom)?.index, 3);
    assert.equal(pickContourEdge(ring, { x: 2, y: 1.5 }, zoom), null);
  }
  assert.equal(pickContourEdge([], { x: 0, y: 0 }, 100), null);
});
