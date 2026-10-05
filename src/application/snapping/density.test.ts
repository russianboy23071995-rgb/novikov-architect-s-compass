import { createStandardLayers } from "../../domain/layers/model.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { advanceSnapDensity, emptySnapDensity } from "./density.ts";
import { createLocalSnapSources, completeLocalQuery } from "./local-sources.ts";
import { createToolSourceQuery, resolveToolSnap } from "../tools/snapping.ts";
import { validateProject } from "../../lib/bim/model.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";

test("density boundaries, hysteresis, interruption and exact return deadline", () => {
  const empty = emptySnapDensity();
  assert.equal(advanceSnapDensity(empty, 32, 0).paused, false);
  const high = advanceSnapDensity(empty, 33, 0);
  assert.equal(high.paused, true);
  assert.equal(advanceSnapDensity(high, 25, 100).lowSince, null);
  const low = advanceSnapDensity(high, 24, 100);
  assert.equal(advanceSnapDensity(low, 24, 349).paused, true);
  assert.equal(advanceSnapDensity(low, 24, 350).paused, false);
  const interrupted = advanceSnapDensity(low, null, 200);
  assert.equal(interrupted.lowSince, null);
  assert.equal(interrupted.paused, true);
  assert.equal(advanceSnapDensity(interrupted, 24, 350).paused, true);
  assert.equal(advanceSnapDensity(low, 33, 200).lowSince, null);
  assert.deepEqual(advanceSnapDensity(emptySnapDensity(), 0, 100), empty);
});
function fixture(n: number) {
  return validateProject({
    schemaVersion: 5,
    bimVisibility: { hiddenLayerIds: [] },
    ...createStandardLayers([]),
    unit: "m",
    id: "dense",
    storey: {
      hatches: [],
      id: "s",
      walls: [],
      windows: [],
      lines: Array.from({ length: n }, (_, i) => ({
        id: "l" + i,
        layerId: "layer:drawing",
        kind: "line",
        points: [
          { x: -10, y: -1 - i * 0.1 },
          { x: 10, y: 1 + i * 0.1 },
        ],
        color: "#334155",
        penWidth: 0.25,
        style: "solid",
      })),
    },
  });
}
test("shared source guard leaves points and remote guides, never materializes dense crossings", () => {
  for (const n of [24, 32, 33, 48]) {
    const model = createLocalSnapSources(fixture(n));
    const query = createToolSourceQuery(model, null);
    const cursor = { x: 0, y: 0 };
    const normal = query(cursor, 100, 10, []);
    assert.equal(
      normal.some((r) => r.kind === "segment-intersection"),
      n <= 32,
    );
    assert.ok(normal.some((r) => r.kind === "midpoint"));
    assert.equal(
      query(cursor, 100, 10, [], true).some((r) => r.kind === "segment-intersection"),
      false,
    );
    const primitive = model.queryPrimitives(cursor, 100, 10);
    const trapped = {
      ...primitive,
      segments: new Proxy(primitive.segments, {
        get(target, key, receiver) {
          if (key === Symbol.iterator || key === "sort")
            throw new Error("pair enumeration forbidden");
          return Reflect.get(target, key, receiver);
        },
      }),
    };
    assert.equal(completeLocalQuery(trapped, true).segmentPairs, 0);
    const active = normal.filter((r) => r.kind === "midpoint").slice(0, 2);
    const refs = query({ x: 100, y: 0 }, 100, 10, active, true);
    assert.ok(
      active.every((r) => refs.some((s) => s.entityId === r.entityId && s.feature === r.feature)),
    );
    const context = {
      references: [],
      sourceQuery: query,
      intersectionsPaused: true,
      activeReferences: active,
      pixelsPerMetre: 100,
      endpointRadiusPx: 10,
      enabled: true,
      gridSpacing: null,
    };
    assert.ok(
      resolveToolSnap(null, { x: 100, y: 0.01 }, context, {
        ortho: false,
        shift: false,
        featureSnap: true,
      }).candidate,
    );
    assert.equal(
      resolveToolSnap(
        null,
        cursor,
        { ...context, enabled: false },
        { ortho: false, shift: false, featureSnap: true },
      ).candidate,
      null,
    );
    assert.ok(
      sameHoverSession(context, { ...context, intersectionsPaused: false, pixelsPerMetre: 500 }),
    );
  }
});
test("source exclusions reduce count before density decision", () => {
  const model = createLocalSnapSources(fixture(48));
  const policy = {
    origin: { entityId: "@test", feature: "origin", point: { x: 3, y: 3 } },
    sources: (refs: readonly import("../../constraints/snapping/engine.ts").SnapReference[]) =>
      refs.filter((r) => Number(r.entityId.slice(1)) < 2),
    resolve: () => ({ point: { x: 0, y: 0 }, candidate: null }),
  };
  const query = createToolSourceQuery(model, policy);
  assert.equal(query.inspect({ x: 0, y: 0 }, 100, 10).segments.length, 2);
  assert.ok(query({ x: 0, y: 0 }, 100, 10, []).some((r) => r.kind === "segment-intersection"));
});
