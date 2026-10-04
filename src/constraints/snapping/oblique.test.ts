import test from "node:test";
import assert from "node:assert/strict";
import { querySnap } from "./engine.ts";
import type { SnapContext, SnapReference } from "./engine.ts";
import { cursorGuide, advanceGuideDirections } from "../guides/directions.ts";
import { acquisitionReference } from "../inference/construction-reference.ts";
import { advanceHoverReference, emptyHoverReference } from "../inference/hover-reference.ts";
import { createProject, addLine, serializeProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";
import { resolveEditSnap } from "../../application/direct-edit/snapping.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { pointsCompatible } from "../../geometry/tolerances/model.ts";
import {
  createAffineScreenMetric,
  createIsotropicScreenMetric,
} from "../../geometry/projections/screen-metric.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";

test("affine line projection minimizes CSS distance and rejects invalid directions", () => {
  for (const matrix of [
    [100, 0, 0, 1],
    [20, 30, -2, 4],
    [-3, 2, 7, 1],
  ]) {
    const [a, b, c, d] = matrix as [number, number, number, number];
    const metric = createAffineScreenMetric(a, b, c, d),
      p = { x: 2, y: 1 },
      o = { x: 0, y: 0 },
      direction = { x: 1, y: 1 };
    const q = metric.projectLine(p, o, direction)!;
    assert.ok(q);
    assert.equal(q.x, q.y);
    const dot =
      (a * (p.x - q.x) + b * (p.y - q.y)) * (a + b) + (c * (p.x - q.x) + d * (p.y - q.y)) * (c + d);
    assert.ok(Math.abs(dot) < 1e-9);
    for (const t of [-1, -0.01, 0.01, 1])
      assert.ok(metric.distance(p, q) <= metric.distance(p, { x: q.x + t, y: q.y + t }));
    assert.deepEqual(metric.projectLine(p, o, { x: -1, y: -1 }), q);
    assert.equal(metric.projectLine(p, o, { x: 0, y: 0 }), null);
    assert.equal(metric.projectLine({ x: NaN, y: 0 }, o, direction), null);
  }
});

test("shared guide projection uses CSS while direction and Shift remain model based", () => {
  const ref = { entityId: "r", feature: "end", point: { x: 0, y: 0 } };
  const metric = createAffineScreenMetric(100, 0, 0, 1),
    cursor = { x: 2, y: 1.8 };
  const c = { ...context, references: [ref], activeReferences: [ref], metric };
  const result = querySnap(cursor, c);
  assert.equal(result.candidate?.kind, "angle");
  assert.equal(result.candidate?.angleDegrees, 45);
  assert.deepEqual(result.point, metric.projectLine(cursor, ref.point, { x: 1, y: 1 }));
  assert.equal(result.candidate?.distanceOnScreen, metric.distance(cursor, result.point));
  const shift = querySnap(cursor, { ...c, angleOrigin: ref.point });
  assert.deepEqual(shift.point, projectDirection(cursor, ref.point, { x: 1, y: 1 }));
  assert.equal(shift.candidate?.angleDegrees, 45);
  assert.equal(shift.candidate?.distanceOnScreen, metric.distance(cursor, shift.point));
});

test("guide intersections and remote competing guides use CSS radius and stable rank", () => {
  const metric = createAffineScreenMetric(100, 0, 0, 1);
  const hit = querySnap({ x: 2, y: 1.1 }, { ...context, metric });
  assert.equal(hit.candidate?.kind, "intersection");
  assert.ok(pointsCompatible(hit.point, target));
  assert.ok(Math.abs(hit.candidate!.distanceOnScreen - 0.1) < 1e-12);
  const refs = [
    { entityId: "near", feature: "end", point: { x: -100, y: 0 } },
    { entityId: "far", feature: "end", point: { x: -100, y: 2 } },
  ];
  for (const references of [refs, [...refs].reverse()]) {
    const c = { ...context, metric, references, activeReferences: refs };
    assert.equal(querySnap({ x: 10, y: 0.8 }, c).candidate?.sourceEntityId, "near");
    const single = { ...c, references: [refs[0]!], activeReferences: [refs[0]!] };
    assert.equal(querySnap({ x: 10, y: 10 }, single).candidate?.kind, "horizontal");
    assert.equal(querySnap({ x: 10, y: 10.001 }, single).candidate, null);
    const axis = querySnap(
      { x: 10, y: 0.8 },
      { ...single, fixedAxis: { origin: { x: 10, y: 0 }, direction: { x: 0, y: 1 } } },
    );
    assert.equal(axis.candidate?.kind, "axis-intersection");
    assert.deepEqual(axis.point, { x: 10, y: 0 });
  }
});

test("isotropic guide projection preserves old arithmetic and complete resolver results", () => {
  for (const scale of [0.5, 100, 10000]) {
    const metric = createIsotropicScreenMetric(scale);
    for (const cursor of [
      { x: 2, y: 1.01 },
      { x: 3, y: 0.02 },
      { x: -4, y: -2.1 },
    ]) {
      assert.deepEqual(
        metric.projectLine(cursor, a.point, { x: 2, y: 1 }),
        projectDirection(cursor, a.point, { x: 2, y: 1 }),
      );
      assert.deepEqual(
        querySnap(cursor, { ...context, pixelsPerMetre: scale, metric }),
        querySnap(cursor, { ...context, pixelsPerMetre: scale }),
      );
    }
  }
});
const a: SnapReference = {
  entityId: "a",
  feature: "end",
  point: { x: 0, y: 0 },
  directions: [{ x: 2, y: 1 }],
};
const b: SnapReference = {
  entityId: "b",
  feature: "end",
  point: { x: 4, y: 0 },
  directions: [{ x: -2, y: 1 }],
};
const target = { x: 2, y: 1 };
const context: SnapContext = {
  references: [a, b],
  activeReferences: [a, b],
  enabled: true,
  pixelsPerMetre: 100,
  endpointRadiusPx: 10,
  gridSpacing: null,
  orthoOrigin: null,
};

test("oblique extensions and extension/perpendicular intersect exactly near the pointer", () => {
  for (const source of [b, { ...b, directions: [{ x: 1, y: 2 }] }]) {
    const c = { ...context, references: [a, source], activeReferences: [a, source] };
    assert.equal(cursorGuide(target, a).kind, "extension");
    assert.equal(cursorGuide(target, source).kind, source === b ? "extension" : "perpendicular");
    for (const pixelsPerMetre of [25, 100, 400]) {
      const result = querySnap({ x: 2 + 5 / pixelsPerMetre, y: 1 }, { ...c, pixelsPerMetre });
      assert.equal(result.candidate?.kind, "intersection");
      assert.ok(pointsCompatible(result.point, target));
      assert.equal(result.candidate?.sourceReferences?.length, 2);
      assert.notEqual(
        querySnap({ x: 2 + 11 / pixelsPerMetre, y: 1 }, { ...c, pixelsPerMetre }).candidate?.kind,
        "intersection",
      );
    }
  }
});

test("direction ordering, reversed edges and invalid vectors cannot change the selected line", () => {
  const source = {
    ...a,
    directions: [
      { x: NaN, y: 0 },
      { x: 0, y: 0 },
      { x: 2, y: 1 },
      { x: -2, y: -1 },
    ],
  };
  assert.equal(cursorGuide(target, source).kind, "extension");
  assert.deepEqual(
    cursorGuide(target, source).point,
    cursorGuide(target, { ...source, directions: [...source.directions].reverse() }).point,
  );
  const parallel = { ...b, point: { x: 0, y: 1 }, directions: a.directions! };
  assert.notEqual(
    querySnap(
      { x: 4, y: 2.5 },
      { ...context, references: [a, parallel], activeReferences: [a, parallel] },
    ).candidate?.kind,
    "intersection",
  );
  const coincident = { ...b, point: { x: 2, y: 1 }, directions: a.directions! };
  assert.notEqual(
    querySnap(
      { x: 4, y: 2 },
      { ...context, references: [a, coincident], activeReferences: [a, coincident] },
    ).candidate?.kind,
    "intersection",
  );
});

test("adaptive hysteresis permits shallow edges and discards changed edge directions", () => {
  const radians = (5 * Math.PI) / 180;
  const source = { ...a, directions: [{ x: Math.cos(radians), y: Math.sin(radians) }] };
  const horizontal = advanceGuideDirections({ x: 3, y: 0 }, [source]);
  const onEdge = { x: 3 * Math.cos(radians), y: 3 * Math.sin(radians) };
  const next = advanceGuideDirections(onEdge, [source], horizontal);
  assert.equal(next[0]!.kind, "extension");
  assert.ok(pointsCompatible(cursorGuide(onEdge, source, next).point, onEdge));
  const changed = { ...source, directions: [{ x: 1, y: 1 }] };
  assert.equal(cursorGuide(onEdge, changed, next).kind, "horizontal");
  assert.equal(cursorGuide({ x: 3, y: 3 }, a).kind, "angle");
});

test("oblique intersection keeps point priorities, constraints, stale-source protection and hover lifecycle", () => {
  const hit = querySnap(target, context);
  const ref = acquisitionReference(hit.candidate, context.references)!;
  let state = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  assert.equal(advanceHoverReference(state, ref, 599, 600).references.length, 0);
  state = advanceHoverReference(state, ref, 600, 600);
  assert.equal(state.references.length, 1);
  state = advanceHoverReference(state, null, 700, 600);
  state = advanceHoverReference(state, ref, 800, 600);
  assert.equal(advanceHoverReference(state, ref, 1400, 600).references.length, 0);
  assert.equal(
    querySnap(target, { ...context, angleOrigin: a.point }).candidate?.sourceFeature,
    "shift-45",
  );
  assert.notEqual(
    querySnap(target, { ...context, orthoOrigin: a.point }).candidate?.kind,
    "intersection",
  );
  assert.equal(querySnap(target, { ...context, enabled: false }).candidate, null);
  assert.notEqual(
    querySnap(target, { ...context, references: [a] }).candidate?.kind,
    "intersection",
  );
  for (const kind of [undefined, "midpoint", "segment-intersection"] as const) {
    const point = { entityId: "point", feature: "point", point: target, ...(kind ? { kind } : {}) };
    assert.equal(
      querySnap(target, { ...context, references: [a, b, point] }).candidate?.kind,
      kind ?? "endpoint",
    );
  }
});

test("free edit and drawing share oblique guide target and reversible serialized coordinates", () => {
  const point = querySnap(target, context).point;
  const project = addLine(createProject("p", "s"), {
    id: "line",
    kind: "line",
    points: [point, { x: 5, y: 3 }],
    ...defaultLineAppearance,
  });
  assert.ok(pointsCompatible(project.storey.lines![0]!.points[0]!, target));
  const selection = { kind: "line" as const, id: "line" };
  const state = editingReducer(createEditingState(project), {
    type: "begin",
    target: selection,
    action: "move",
    index: null,
    anchor: { x: 5, y: 3 },
  });
  const resolved = resolveEditSnap(state.session!, target, context);
  assert.equal(resolved.candidate?.kind, "intersection");
  const preview = previewEdit(state.session!, state.history.present, selection, resolved.point);
  const commit = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection,
    point: resolved.point,
  });
  assert.deepEqual(commit.history.present, preview);
  assert.equal(commit.history.past.length, 1);
  assert.deepEqual(editingReducer(commit, { type: "undo" }).history.present, project);
  assert.deepEqual(
    readProjectFile(
      serializeProject(
        editingReducer(editingReducer(commit, { type: "undo" }), { type: "redo" }).history.present,
      ),
    ),
    preview,
  );
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
});
