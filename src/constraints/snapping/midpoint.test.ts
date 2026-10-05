import test from "node:test";
import assert from "node:assert/strict";
import { segmentMidpoint } from "../../geometry/primitives/segment.ts";
import { projectSnapReferences } from "../../application/snapping/project-references.ts";
import {
  createEditingState,
  editingReducer,
  previewEdit,
} from "../../application/direct-edit/controller.ts";
import { editSnapReferences, resolveEditSnap } from "../../application/direct-edit/snapping.ts";
import {
  addLine,
  addWall,
  createProject,
  serializeProject,
  updateWall,
} from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import {
  commitProject,
  createHistory,
  undoProject,
  redoProject,
  readProjectFile,
} from "../../lib/bim/history.ts";
import { querySnap } from "./engine.ts";
import type { SnapContext } from "./engine.ts";
import {
  acquisitionReference,
  withConstructionReferences,
} from "../inference/construction-reference.ts";
import { advanceHoverReference, emptyHoverReference } from "../inference/hover-reference.ts";

const wallProject = () =>
  addWall(createProject("p", "s"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
const context = (project = wallProject()): SnapContext => ({
  references: projectSnapReferences(project),
  pixelsPerMetre: 100,
  enabled: true,
  endpointRadiusPx: 10,
  gridSpacing: null,
  orthoOrigin: null,
});

test("midpoint geometry supports short and oblique segments without accepting degenerate or nonfinite input", () => {
  assert.deepEqual(segmentMidpoint({ x: 0, y: 0 }, { x: 3, y: 4 }), { x: 1.5, y: 2 });
  assert.deepEqual(segmentMidpoint({ x: 0, y: 0 }, { x: 1e-10, y: 0 }), { x: 5e-11, y: 0 });
  assert.deepEqual(segmentMidpoint({ x: 1e308, y: 0 }, { x: 1e308, y: 2 }), { x: 1e308, y: 1 });
  assert.equal(segmentMidpoint({ x: 2, y: 3 }, { x: 2, y: 3 }), null);
  for (const x of [NaN, Infinity, -Infinity])
    assert.equal(segmentMidpoint({ x, y: 0 }, { x: 1, y: 0 }), null);
});

test("adapter derives wall-axis and each polyline segment midpoint without adding closing edges", () => {
  const project = addLine(wallProject(), {
    id: "poly",
    kind: "polyline",
    points: [
      { x: 0, y: 1 },
      { x: 2, y: 3 },
      { x: 4, y: 3 },
    ],
    ...defaultLineAppearance,
  });
  const refs = projectSnapReferences(project).filter((r) => r.kind === "midpoint");
  assert.deepEqual(
    refs.map((r) => r.point),
    [
      { x: 1.5, y: 0 },
      { x: 1, y: 2 },
      { x: 3, y: 3 },
    ],
  );
  assert.equal(refs[0]!.entityId, "w");
  assert.deepEqual(refs[1]!.directions, [{ x: 2, y: 2 }]);
  assert.notEqual(refs[1]!.feature, refs[2]!.feature);
  const rotated = updateWall(project, "w", { start: { x: 1.5, y: -1.5 }, end: { x: 1.5, y: 1.5 } });
  const replacement = projectSnapReferences(rotated).find(
    (r) => r.kind === "midpoint" && r.entityId === "w",
  )!;
  assert.deepEqual(replacement.point, refs[0]!.point);
  assert.notEqual(replacement.feature, refs[0]!.feature);
  assert.equal(
    querySnap({ x: 6, y: 0 }, { ...context(rotated), activeReferences: [refs[0]!] }).candidate,
    null,
  );
  assert.equal(
    querySnap({ x: 6, y: 0 }, { ...context(createProject("p", "s")), activeReferences: [refs[0]!] })
      .candidate,
    null,
  );
});

test("midpoints use CSS radius, endpoint priority and the existing Shift/Ortho contract", () => {
  for (const pixelsPerMetre of [25, 100, 400]) {
    const c = { ...context(), pixelsPerMetre };
    const inside = querySnap({ x: 1.5, y: 9 / pixelsPerMetre }, c);
    assert.equal(inside.candidate?.kind, "midpoint");
    assert.deepEqual(inside.point, { x: 1.5, y: 0 });
    assert.equal(querySnap({ x: 1.5, y: 11 / pixelsPerMetre }, c).candidate, null);
    assert.equal(querySnap({ x: 1.5, y: 0 }, { ...c, enabled: false }).candidate, null);
    assert.equal(
      querySnap({ x: 1.5, y: 0 }, { ...c, orthoOrigin: { x: 0, y: 0.02 } }).candidate,
      null,
    );
    assert.equal(
      querySnap({ x: 1.5, y: 0 }, { ...c, angleOrigin: { x: 0, y: 0 } }).candidate?.kind,
      "midpoint",
    );
    const endpoint = {
      entityId: "end",
      feature: "end",
      point: { x: 1.5 + 5 / pixelsPerMetre, y: 0 },
    };
    assert.equal(
      querySnap({ x: 1.5, y: 0 }, { ...c, references: [...c.references, endpoint] }).candidate
        ?.kind,
      "endpoint",
    );
  }
  const short = addLine(createProject("p", "s"), {
    id: "short",
    kind: "line",
    points: [
      { x: 0, y: 0 },
      { x: 0.1, y: 0 },
    ],
    ...defaultLineAppearance,
  });
  assert.equal(querySnap({ x: 0.05, y: 0 }, context(short)).candidate?.kind, "endpoint");
  assert.equal(
    querySnap({ x: 0.05, y: 0 }, { ...context(short), pixelsPerMetre: 400 }).candidate?.kind,
    "midpoint",
  );
});

test("midpoint hover activates at 600ms, supplies guides and releases once on a new visit", () => {
  const c = context();
  const ref = acquisitionReference(querySnap({ x: 1.5, y: 0 }, c).candidate, c.references)!;
  assert.equal(ref.kind, "midpoint");
  let state = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  assert.equal(advanceHoverReference(state, ref, 599, 600).references.length, 0);
  state = advanceHoverReference(state, ref, 600, 600);
  assert.equal(state.references.length, 1);
  assert.equal(
    querySnap({ x: 1.51, y: 2 }, { ...c, activeReferences: state.references }).candidate?.kind,
    "perpendicular",
  );
  const other = { entityId: "other", feature: "end", point: { x: 3.5, y: 0 } };
  const intersection = querySnap(
    { x: 2.5, y: 1 },
    { ...c, references: [...c.references, other], activeReferences: [ref, other] },
  );
  assert.equal(intersection.candidate?.kind, "intersection");
  const constructed = acquisitionReference(intersection.candidate, [...c.references, other])!;
  assert.equal(withConstructionReferences([other], [constructed]).length, 1);
  state = advanceHoverReference(state, null, 1000, 600);
  state = advanceHoverReference(state, ref, 1100, 600);
  state = advanceHoverReference(state, ref, 1700, 600);
  assert.equal(state.references.length, 0);
  assert.equal(advanceHoverReference(state, ref, 3000, 600).references.length, 0);
});

test("drawing and direct edit share exact midpoint targets, preview, exclusions, undo and JSON", () => {
  const project = wallProject();
  const start = querySnap({ x: 1.51, y: 0.01 }, context(project)).point;
  const drawn = addLine(project, {
    id: "line",
    kind: "line",
    points: [start, { x: 2, y: 2 }],
    ...defaultLineAppearance,
  });
  const history = commitProject(createHistory(project), drawn);
  assert.deepEqual(drawn.storey.lines![0]!.points[0], { x: 1.5, y: 0 });
  assert.deepEqual(undoProject(history).present, project);
  assert.deepEqual(
    readProjectFile(serializeProject(redoProject(undoProject(history)).present)),
    drawn,
  );
  const target = { kind: "line" as const, id: "line" };
  const state = editingReducer(createEditingState(drawn), {
    type: "begin",
    target,
    action: "move",
    index: null,
    anchor: { x: 2, y: 2 },
  });
  assert.ok(state.session);
  const refs = projectSnapReferences(drawn);
  assert.ok(editSnapReferences(state.session!, refs).every((r) => r.entityId !== "line"));
  const resolved = resolveEditSnap(state.session!, { x: 1.51, y: 0.01 }, context(drawn));
  assert.equal(resolved.candidate?.kind, "midpoint");
  const preview = previewEdit(state.session!, state.history.present, target, resolved.point);
  const committed = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: resolved.point,
  });
  assert.deepEqual(committed.history.present, preview);
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(editingReducer(committed, { type: "undo" }).history.present, drawn);
  assert.deepEqual(readProjectFile(serializeProject(committed.history.present)), preview);
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
  const axial = editingReducer(createEditingState(drawn), {
    type: "begin",
    target,
    action: "x",
    index: null,
    anchor: { x: 2, y: 2 },
  });
  assert.equal(resolveEditSnap(axial.session!, { x: 1.5, y: 0 }, context(drawn)).candidate, null);
});
