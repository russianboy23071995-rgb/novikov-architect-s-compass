import test from "node:test";
import assert from "node:assert/strict";
import { createProject, serializeProject } from "../../lib/bim/model.ts";
import { drawingInteraction } from "../tools/adapters.ts";
import {
  drawingSnapPolicy,
  toolPinnedReferences,
  createVisibleToolSourceQuery,
  resolveToolSnap,
} from "../tools/snapping.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { createDrawing, defaultHatchFill } from "./actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { advanceGuideDirections } from "../../constraints/guides/directions.ts";
import { acquisitionReference } from "../../constraints/inference/construction-reference.ts";
import {
  advanceHoverReference,
  emptyHoverReference,
} from "../../constraints/inference/hover-reference.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
const transform =
  (degrees: number) =>
  ({ x, y }: { x: number; y: number }) => {
    const a = (degrees * Math.PI) / 180;
    return { x: 12 + x * Math.cos(a) - y * Math.sin(a), y: -7 + x * Math.sin(a) + y * Math.cos(a) };
  };
const p = createProject("p", "s");
const path = [
  { x: 0, y: 0 },
  { x: 3, y: 0 },
  { x: 3, y: 2 },
];
function setup(points: typeof path) {
  const adapter = drawingInteraction(
    p,
    p,
    points.at(-1)!,
    () => {},
    () => {},
    points,
  );
  const policy = adapter.snapping;
  const pinned = toolPinnedReferences(policy);
  const visibility = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: p.layers.map((l) => l.id),
  });
  const sources = createVisibleToolSourceQuery(p, visibility, visibility.context, policy);
  const resolve = (cursor: { x: number; y: number }, scale: number, snap = true, shift = false) =>
    resolveToolSnap(
      policy,
      cursor,
      {
        enabled: snap,
        pixelsPerMetre: scale,
        endpointRadiusPx: 10,
        gridSpacing: null,
        references: [],
        sourceQuery: sources,
        activeReferences: pinned,
        guideDirections: advanceGuideDirections(cursor, pinned, []),
      },
      { ortho: false, shift, featureSnap: true },
    );
  return { policy, pinned, sources, resolve };
}

test("first and third draft corners jointly predict the fourth corner at several zoom levels and rotations", () => {
  for (const degrees of [0, 27, 45, 90, -33])
    for (const scale of [20, 100, 600]) {
      const t = transform(degrees),
        points = path.map(t),
        desired = t({ x: 0, y: 2 });
      const { resolve, pinned } = setup(points);
      const result = resolve({ x: desired.x + 2 / scale, y: desired.y + 1 / scale }, scale);
      assert.equal(pinned.length, 2);
      assert.equal(result.candidate?.kind, "intersection", `${degrees} deg, ${scale} px/m`);
      assert.ok(pointsCompatible(result.point, desired));
      assert.equal(result.candidate?.sourceReferences?.length, 2);
      assert.ok(
        pinned.every((r) =>
          result.candidate?.sourceReferences?.some((s) => pointsCompatible(s.point, r.point)),
        ),
      );
    }
});

test("both polyline and hatch commit the shared predicted corner without rectangle-specific geometry", () => {
  const before = serializeProject(p),
    { resolve } = setup(path);
  const result = resolve({ x: 0.02, y: 2.01 }, 100);
  const complete = [...path, result.point];
  const hatch = createDrawing(p, p, "h", {
    kind: "hatch",
    points: complete,
    fill: defaultHatchFill,
  });
  const line = createDrawing(p, p, "l", {
    kind: "line",
    lineKind: "polyline",
    points: complete,
    appearance: defaultLineAppearance,
  });
  assert.deepEqual(hatch.storey.hatches[0]!.points.at(-1), { x: 0, y: 2 });
  assert.deepEqual(line.storey.lines![0]!.points.at(-1), { x: 0, y: 2 });
  assert.equal(serializeProject(p), before);
});

test("draft pins survive navigation identity but do not leak into another contour or canceled drawing", () => {
  const { policy, pinned, sources } = setup(path);
  assert.equal(drawingSnapPolicy(path.at(-1)!, path), policy);
  for (const r of pinned) assert.ok(sources.accepts(r));
  const derived = acquisitionReference(
    setup(path).resolve({ x: 0.02, y: 2.01 }, 100).candidate,
    sources({ x: 0, y: 2 }, 100, 10, pinned),
  );
  assert.ok(derived && sources.accepts(derived));
  const next = setup(path.map(transform(27)));
  for (const r of pinned) assert.equal(next.sources.accepts(r), false);
  assert.equal(next.sources.accepts(derived!), false);
  const visibility = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const canceled = createVisibleToolSourceQuery(p, visibility, visibility.context, null);
  assert.equal(canceled.accepts(derived!), false);
  assert.deepEqual(canceled({ x: 0, y: 2 }, 100, 10, pinned), []);
});

test("ordinary hover still needs 600ms; Snap off and distant cursor do not force rectangle completion", () => {
  const { resolve, pinned, sources } = setup(path);
  const cursor = { x: 0.02, y: 2.01 };
  const result = resolve(cursor, 100);
  const ref = acquisitionReference(result.candidate, sources(cursor, 100, 10, pinned))!;
  let state = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  assert.equal(advanceHoverReference(state, ref, 599, 600).references.length, 0);
  state = advanceHoverReference(state, ref, 600, 600);
  assert.equal(state.references.length, 1);
  assert.deepEqual(resolve(cursor, 100, false).point, cursor);
  assert.ok(!pointsCompatible(resolve({ x: 0.5, y: 2.5 }, 100).point, { x: 0, y: 2 }));
  const shift = resolve(cursor, 100, true, true);
  assert.ok(["intersection", "axis-intersection"].includes(shift.candidate!.kind));
  assert.ok(pointsCompatible(shift.point, { x: 0, y: 2 }));
});

test("Shift closes rectangles exactly throughout the snap circle for both drawing consumers", () => {
  for (const degrees of [0, 45, 90, 180, -45])
    for (const scale of [20, 100, 600]) {
      const t = transform(degrees),
        draft = path.map(t),
        desired = t({ x: 0, y: 2 });
      const { resolve } = setup(draft);
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const cursor = {
          x: desired.x + (4 * Math.cos(angle)) / scale,
          y: desired.y + (4 * Math.sin(angle)) / scale,
        };
        const snapped = resolve(cursor, scale, true, true);
        assert.ok(pointsCompatible(snapped.point, desired), `${degrees}/${scale}/${i}`);
        assert.ok(["intersection", "axis-intersection"].includes(snapped.candidate!.kind));
        for (const kind of ["line", "hatch"] as const) {
          const points = [...draft, snapped.point];
          const next = createDrawing(
            p,
            p,
            "shape",
            kind === "hatch"
              ? { kind, points, fill: defaultHatchFill }
              : { kind, points, lineKind: "polyline", appearance: defaultLineAppearance },
          );
          const saved =
            kind === "hatch" ? next.storey.hatches[0]!.points : next.storey.lines![0]!.points;
          const a = saved[2]!,
            b = saved[3]!,
            c = saved[0]!;
          assert.ok(Math.abs((a.x - b.x) * (c.x - b.x) + (a.y - b.y) * (c.y - b.y)) < 1e-9);
        }
      }
    }
});
