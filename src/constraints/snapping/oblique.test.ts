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
