import test from "node:test";
import assert from "node:assert/strict";
import { intersectSegments } from "../../geometry/intersections/segments.ts";
import { projectSnapReferences } from "../../application/snapping/project-references.ts";
import { editSnapReferences, resolveEditSnap } from "../../application/direct-edit/snapping.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";
import {
  addLine,
  addWall,
  addWindow,
  createProject,
  updateLine,
  serializeProject,
} from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { querySnap } from "./engine.ts";
import type { SnapContext } from "./engine.ts";
import {
  acquisitionReference,
  withConstructionReferences,
} from "../inference/construction-reference.ts";
import { advanceHoverReference, emptyHoverReference } from "../inference/hover-reference.ts";
const p = (x: number, y: number) => ({ x, y });
const line = (id: string, points: ReturnType<typeof p>[]) => ({
  id,
  kind: "line" as const,
  points,
  ...defaultLineAppearance,
});
const model = () =>
  addLine(
    addWall(createProject("p", "s"), {
      id: "wall",
      start: p(0, 0),
      end: p(4, 0),
      thickness: 0.36,
      height: 2.8,
    }),
    line("cross", [p(1, -2), p(1, 1)]),
  );
const ctx = (project = model()): SnapContext => ({
  references: projectSnapReferences(project),
  pixelsPerMetre: 100,
  endpointRadiusPx: 10,
  enabled: true,
  gridSpacing: null,
  orthoOrigin: null,
});

test("finite segment intersections distinguish crossings, endpoint contacts and overlaps", () => {
  assert.deepEqual(intersectSegments(p(0, 0), p(4, 4), p(0, 4), p(4, 0)), p(2, 2));
  assert.deepEqual(intersectSegments(p(0, 0), p(1, 0), p(1, 0), p(1, 2)), p(1, 0));
  assert.deepEqual(intersectSegments(p(0, 0), p(1, 0), p(1, 0), p(2, 0)), p(1, 0));
  assert.equal(intersectSegments(p(0, 0), p(1, 0), p(2, -1), p(2, 1)), null);
  assert.equal(intersectSegments(p(0, 0), p(3, 0), p(1, 0), p(4, 0)), null);
  assert.equal(intersectSegments(p(0, 0), p(1, 0), p(0, 1), p(1, 1)), null);
  assert.equal(intersectSegments(p(0, 0), p(0, 0), p(-1, 0), p(1, 0)), null);
  assert.equal(intersectSegments(p(NaN, 0), p(1, 0), p(0, 1), p(1, 1)), null);
  assert.deepEqual(
    intersectSegments(p(0, 0), p(1e-7, 0), p(5e-8, -1e-7), p(5e-8, 1e-7)),
    p(5e-8, 0),
  );
  assert.equal(intersectSegments(p(0, 0), p(10, 0), p(0, 1), p(10, 1 + 1e-12)), null);
});

test("adapter derives deterministic segment intersections with both geometry snapshots", () => {
  const c = ctx(),
    refs = c.references.filter((r) => r.kind === "segment-intersection");
  assert.equal(refs.length, 1);
  assert.deepEqual(refs[0]!.point, p(1, 0));
  assert.deepEqual(
    refs[0]!.dependencies?.map((r) => r.entityId),
    ["cross", "wall"],
  );
  const updated = updateLine(model(), "cross", { points: [p(1, -3), p(1, 2)] });
  const next = projectSnapReferences(updated).find((r) => r.kind === "segment-intersection")!;
  assert.deepEqual(next.point, refs[0]!.point);
  assert.notEqual(next.feature, refs[0]!.feature);
  assert.equal(
    withConstructionReferences(ctx(updated).references, [refs[0]!]).some(
      (r) => r.feature === refs[0]!.feature,
    ),
    false,
  );
  assert.equal(
    querySnap(p(6, 0), { ...ctx(updated), activeReferences: [refs[0]!] }).candidate,
    null,
  );
});

test("polyline self-crossings and source order retain a deterministic target", () => {
  const poly = addLine(createProject("p", "s"), {
    ...line("poly", [p(0, 0), p(4, 4), p(0, 4), p(4, 0)]),
    kind: "polyline",
  });
  const crossings = projectSnapReferences(poly).filter((r) => r.kind === "segment-intersection");
  assert.ok(crossings.some((r) => r.point.x === 2 && r.point.y === 2));
  const first = addLine(
    addLine(createProject("p", "s"), line("a", [p(0, 0), p(4, 0)])),
    line("b", [p(1, -2), p(1, 1)]),
  );
  const reversed = {
    ...first,
    storey: { ...first.storey, lines: [...first.storey.lines!].reverse() },
  };
  assert.deepEqual(
    projectSnapReferences(first).filter((r) => r.kind === "segment-intersection"),
    projectSnapReferences(reversed).filter((r) => r.kind === "segment-intersection"),
  );
});

test("segment intersection snapping obeys screen radius, endpoint/midpoint priority and constraints", () => {
  for (const pixelsPerMetre of [25, 100, 400]) {
    const c = { ...ctx(), pixelsPerMetre };
    assert.equal(querySnap(p(1, 9 / pixelsPerMetre), c).candidate?.kind, "segment-intersection");
    assert.equal(querySnap(p(1, 11 / pixelsPerMetre), c).candidate, null);
    assert.equal(querySnap(p(1, 0), { ...c, enabled: false }).candidate, null);
    assert.equal(querySnap(p(1, 0), { ...c, orthoOrigin: p(0, 0.02) }).candidate, null);
    assert.equal(
      querySnap(p(1, 0), { ...c, angleOrigin: p(0, 0) }).candidate?.sourceFeature,
      "shift-45",
    );
    for (const kind of [undefined, "midpoint"] as const) {
      const ref = {
        ...(kind ? { kind } : {}),
        entityId: "priority",
        feature: "point",
        point: p(1, 0),
      };
      assert.equal(
        querySnap(p(1, 0), { ...c, references: [...c.references, ref] }).candidate?.kind,
        kind ?? "endpoint",
      );
    }
  }
});

test("intersection hover can activate, guide and release without model history", () => {
  const c = ctx(),
    ref = acquisitionReference(querySnap(p(1, 0), c).candidate, c.references)!;
  let state = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  assert.equal(advanceHoverReference(state, ref, 599, 600).references.length, 0);
  state = advanceHoverReference(state, ref, 600, 600);
  assert.equal(state.references.length, 1);
  assert.ok(querySnap(p(6, 0), { ...c, activeReferences: state.references }).candidate);
  state = advanceHoverReference(state, null, 1000, 600);
  state = advanceHoverReference(state, ref, 1100, 600);
  assert.equal(advanceHoverReference(state, ref, 1700, 600).references.length, 0);
});

test("direct edit excludes intersections involving either the moving element or a window host", () => {
  const project = addWindow(model(), {
    id: "opening",
    wallId: "wall",
    width: 0.5,
    height: 1,
    sillHeight: 1,
    position: 0.5,
  });
  for (const target of [
    { kind: "line" as const, id: "cross" },
    { kind: "wall" as const, id: "wall" },
    { kind: "window" as const, id: "opening" },
  ]) {
    const state = editingReducer(createEditingState(project), {
      type: "begin",
      target,
      action: "move",
      index: null,
    });
    assert.equal(
      editSnapReferences(state.session!, ctx(project).references).some(
        (r) => r.kind === "segment-intersection",
      ),
      false,
    );
    assert.notEqual(
      resolveEditSnap(state.session!, p(1, 0), ctx(project)).candidate?.kind,
      "segment-intersection",
    );
  }
});

test("drawing and free edit at segment intersections preserve preview, undo, redo and JSON", () => {
  const base = model(),
    point = querySnap(p(1.01, 0.01), ctx(base)).point;
  assert.deepEqual(point, p(1, 0));
  const drawing = addLine(base, line("drawn", [point, p(2, 2)]));
  assert.deepEqual(readProjectFile(serializeProject(drawing)), drawing);
  const target = { kind: "line" as const, id: "drawn" };
  const state = editingReducer(createEditingState(drawing), {
    type: "begin",
    target,
    action: "move",
    index: null,
    anchor: p(2, 2),
  });
  const resolved = resolveEditSnap(state.session!, p(1.01, 0.01), ctx(drawing));
  assert.equal(resolved.candidate?.kind, "segment-intersection");
  const preview = previewEdit(state.session!, state.history.present, target, resolved.point);
  const commit = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: resolved.point,
  });
  assert.deepEqual(commit.history.present, preview);
  assert.equal(commit.history.past.length, 1);
  const undone = editingReducer(commit, { type: "undo" });
  assert.deepEqual(undone.history.present, drawing);
  assert.deepEqual(
    readProjectFile(serializeProject(editingReducer(undone, { type: "redo" }).history.present)),
    preview,
  );
});
