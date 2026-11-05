import test from "node:test";
import assert from "node:assert/strict";
import { createProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { addStorey, setStoreyHeight } from "../storeys/actions.ts";
import { selectWorkingStorey } from "../storeys/working-storey.ts";
import { defaultTracingStorey, tracingOutlines, tracingSnap } from "./tracing.ts";

// docs/TRANSPARENZPAUSE.md, S4.
const twoStoreys = () => {
  let p = createProject("p", "eg");
  const eg = p.storeys[0]!.id;
  p = addWall(p, {
    id: "w1",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.3,
    height: 2.8,
  });
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: eg, height: 3 });
  p = addStorey(p, p, { projectId: p.id, storeyId: eg, side: "above", id: "og", height: 3 });
  return { p: selectWorkingStorey(p, p, "og"), eg };
};

test("the trace defaults to the storey below and outlines its walls", () => {
  const { p, eg } = twoStoreys();
  assert.equal(defaultTracingStorey(p), eg);
  assert.equal(defaultTracingStorey(selectWorkingStorey(p, p, eg)), "og");
  const outlines = tracingOutlines(p, eg);
  assert.equal(outlines.walls.length, 1);
  const xs = outlines.walls[0]!.map((q) => q.x),
    ys = outlines.walls[0]!.map((q) => q.y);
  assert.deepEqual(
    [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)],
    [0, 4, -0.15, 0.15],
  );
  assert.deepEqual(tracingOutlines(p, "missing"), { walls: [], columns: [] });
});

test("the trace offers its wall end points to the snap engine", () => {
  const { p, eg } = twoStoreys();
  const trace = tracingSnap(p, eg)!;
  assert.deepEqual([...trace.ids], ["w1"]);
  const hit = trace.sources.query({ x: 4.02, y: 0.01 }, 100, 10);
  assert.ok(hit.references.some((r) => r.entityId === "w1"));
  assert.equal(tracingSnap(p, "missing"), null);
});

test("with the trace the tool snap query offers the lower wall; without it, it does not", async () => {
  const { createTracedToolSourceQuery, createVisibleToolSourceQuery } =
    await import("../tools/snapping.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const { p, eg } = twoStoreys();
  const visibility = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const near = { x: 4.02, y: 0.01 };
  const plain = createVisibleToolSourceQuery(p, visibility, visibility.context, null);
  assert.ok(!plain.inspect(near, 100, 10).references.some((r) => r.entityId === "w1"));
  const traced = createTracedToolSourceQuery(
    p,
    visibility,
    visibility.context,
    null,
    tracingSnap(p, eg)!,
  );
  assert.ok(traced.inspect(near, 100, 10).references.some((r) => r.entityId === "w1"));
});

test("a wall start near the end of a traced wall snaps exactly to the end, not to its axis", async () => {
  const { createTracedToolSourceQuery } = await import("../tools/snapping.ts");
  const { createLayerVisibilityPolicy } = await import("../layers/visibility.ts");
  const { wallStartSnapPolicy } = await import("../tools/adapters.ts");
  const { acceptsTraceCandidate } = await import("./tracing.ts");
  const { p, eg } = twoStoreys();
  const visibility = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const trace = tracingSnap(p, eg)!;
  const sourceQuery = createTracedToolSourceQuery(
    p,
    visibility,
    visibility.context,
    wallStartSnapPolicy,
    trace,
  );
  const context = {
    references: [],
    sourceQuery,
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    includeInteractionTargets: true,
    gridSpacing: null,
    orthoOrigin: null,
  };
  const cursor = { x: 3.97, y: 0.02 };
  // Without the filter the axis foot of the traced wall wins just before its end.
  const plain = wallStartSnapPolicy.resolve!(cursor, context);
  assert.equal(plain.candidate?.sourceFeature, "t-axis");
  const filtered = wallStartSnapPolicy.resolve!(cursor, {
    ...context,
    acceptCandidate: acceptsTraceCandidate(trace.ids),
  });
  assert.deepEqual(filtered.point, { x: 4, y: 0 });
});
