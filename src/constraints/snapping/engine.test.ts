import test from "node:test";
import assert from "node:assert/strict";
import { querySnap } from "./engine.ts";
import type { SnapContext } from "./engine.ts";
import { projectSnapReferences } from "../../application/snapping/project-references.ts";
import { createProject, addWall, addLine, serializeProject } from "../../lib/bim/model.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "../../lib/bim/history.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { projectDirection } from "../../geometry/projections/direction.ts";
import { advanceHoverReference, emptyHoverReference } from "../inference/hover-reference.ts";

const context: SnapContext = {
  references: [{ point: { x: 1.037, y: 2.013 }, entityId: "wall", feature: "axis-end" }],
  pixelsPerMetre: 100,
  enabled: true,
  endpointRadiusPx: 10,
  gridSpacing: 0.1,
  orthoOrigin: null,
};

test("Shift locks all eight directions even with grid disabled, and release restores free snapping", () => {
  const origin = { x: 0.037, y: 0.013 };
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI) / 4 + 0.1;
    const cursor = { x: origin.x + 3 * Math.cos(angle), y: origin.y + 3 * Math.sin(angle) };
    const result = querySnap(cursor, { ...context, enabled: false, angleOrigin: origin });
    assert.equal(result.candidate?.angleDegrees, i * 45);
    const dx = result.point.x - origin.x,
      dy = result.point.y - origin.y;
    assert.ok(
      Math.abs(dx * Math.sin((i * Math.PI) / 4) - dy * Math.cos((i * Math.PI) / 4)) < 1e-12,
    );
    assert.deepEqual(querySnap(cursor, { ...context, enabled: false }).point, cursor);
  }
  assert.equal(projectDirection(origin, origin, { x: 0, y: 0 }), null);
});

test("oblique edge guides project exactly onto extension and perpendicular", () => {
  const ref = {
    point: { x: 0, y: 0 },
    entityId: "edge",
    feature: "end",
    directions: [{ x: 3, y: 2 }],
  };
  const c = { ...context, references: [ref], activeReference: ref };
  const extension = querySnap({ x: 6.01, y: 4 }, c);
  assert.equal(extension.candidate?.kind, "extension");
  assert.ok(Math.abs(extension.point.x * 2 - extension.point.y * 3) < 1e-12);
  const perpendicular = querySnap({ x: -4, y: 6.01 }, c);
  assert.equal(perpendicular.candidate?.kind, "perpendicular");
  assert.ok(Math.abs(perpendicular.point.x * 3 + perpendicular.point.y * 2) < 1e-12);
  assert.equal(querySnap({ x: 3.01, y: 3 }, c).candidate?.kind, "angle");
  assert.equal(querySnap({ x: 3, y: 1 }, c).candidate?.kind, "grid");
});

test("wall corners are derived references and carry edge direction", () => {
  const p = addWall(createProject("p", "s"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  const refs = projectSnapReferences(p);
  assert.equal(refs.length, 6);
  const corner = refs.find((r) => r.feature === "corner-1-1")!;
  assert.deepEqual(corner.point, { x: 3, y: 0.18 });
  assert.equal(
    querySnap({ x: 3.01, y: 0.18 }, { ...context, references: refs }).candidate?.sourceFeature,
    corner.feature,
  );
  assert.deepEqual(corner.directions, [{ x: 3, y: 0 }]);
});

test("hover requires continuous dwell and replaces only after a new full dwell", () => {
  const a = context.references[0]!;
  const b = { ...a, entityId: "other" };
  let state = advanceHoverReference(emptyHoverReference(), a, 0, 400);
  state = advanceHoverReference(state, a, 399, 400);
  assert.equal(state.active, null);
  state = advanceHoverReference(state, null, 399, 400);
  state = advanceHoverReference(state, a, 400, 400);
  assert.equal(state.active, null);
  state = advanceHoverReference(state, a, 800, 400);
  assert.deepEqual(state.active, a);
  state = advanceHoverReference(state, b, 900, 400);
  assert.deepEqual(state.active, a);
  state = advanceHoverReference(state, b, 1300, 400);
  assert.deepEqual(state.active, b);
  assert.deepEqual(advanceHoverReference(state, null, 1400, 400).active, b);
  assert.equal(emptyHoverReference().active, null);
  assert.throws(() => advanceHoverReference(state, a, NaN, 400));
  assert.throws(() => advanceHoverReference(state, a, 1500, -1));
});

test("configured dwell and moved reference restart acquisition", () => {
  const a = context.references[0]!;
  let state = advanceHoverReference(emptyHoverReference(), a, 100, 600);
  state = advanceHoverReference(state, a, 699, 600);
  assert.equal(state.active, null);
  const moved = { ...a, point: { x: 4, y: 5 } };
  state = advanceHoverReference(state, moved, 700, 600);
  assert.equal(state.active, null);
  assert.deepEqual(advanceHoverReference(state, moved, 1300, 600).active, moved);
});

test("only the cursor-relevant axis guides snap, before grid, across zoom levels", () => {
  const a = context.references[0]!;
  for (const pixelsPerMetre of [10, 100, 1000]) {
    const c = { ...context, pixelsPerMetre, activeReference: a };
    const h = querySnap(
      { x: a.point.x + 100 / pixelsPerMetre, y: a.point.y + 6 / pixelsPerMetre },
      c,
    );
    assert.equal(h.candidate?.kind, "horizontal");
    assert.equal(h.point.y, a.point.y);
    const v = querySnap(
      { x: a.point.x + 6 / pixelsPerMetre, y: a.point.y + 100 / pixelsPerMetre },
      c,
    );
    assert.equal(v.candidate?.kind, "vertical");
    assert.equal(v.point.x, a.point.x);
    assert.equal(
      querySnap({ x: a.point.x + 100 / pixelsPerMetre, y: a.point.y + 11 / pixelsPerMetre }, c)
        .candidate?.kind,
      "grid",
    );
    assert.equal(querySnap(a.point, c).candidate?.kind, "endpoint");
  }
});

test("guides reject stale references, disabled snapping and incompatible Ortho", () => {
  const a = context.references[0]!;
  const cursor = { x: 4, y: a.point.y + 0.02 };
  assert.equal(querySnap(cursor, context).candidate?.kind, "grid");
  assert.equal(
    querySnap(cursor, { ...context, activeReference: a, references: [] }).candidate?.kind,
    "grid",
  );
  assert.equal(
    querySnap(cursor, { ...context, activeReference: a, enabled: false }).candidate,
    null,
  );
  assert.notEqual(
    querySnap(cursor, { ...context, activeReference: a, orthoOrigin: { x: 0, y: 2.1 } }).candidate
      ?.kind,
    "horizontal",
  );
});

test("guide-derived model coordinates survive commit, undo, redo and JSON", () => {
  const project = createProject("guides", "storey");
  const a = context.references[0]!;
  const result = querySnap({ x: 4, y: a.point.y + 0.02 }, { ...context, activeReference: a });
  const history = commitProject(
    createHistory(project),
    addLine(project, {
      id: "guided-line",
      kind: "line",
      points: [{ x: 0, y: 0 }, result.point],
      ...defaultLineAppearance,
    }),
  );
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, project);
  const restored = readProjectFile(serializeProject(redoProject(undoProject(history)).present));
  assert.equal(restored.storey.lines![0]!.points[1]!.y, a.point.y);
  assert.equal(JSON.stringify(restored).includes("activeReference"), false);
});

test("endpoint wins over grid and retains exact non-grid coordinates", () => {
  const before = JSON.stringify(context);
  const result = querySnap({ x: 1.04, y: 2.01 }, context);
  assert.deepEqual(result.point, { x: 1.037, y: 2.013 });
  assert.equal(result.candidate?.sourceEntityId, "wall");
  assert.equal(result.candidate?.kind, "endpoint");
  assert.equal(JSON.stringify(context), before);
});
test("endpoint radius stays ten CSS pixels across zoom levels", () => {
  for (const pixelsPerMetre of [10, 100, 1000]) {
    const c = { ...context, pixelsPerMetre, gridSpacing: null };
    assert.equal(
      querySnap({ x: 1.037 + 9 / pixelsPerMetre, y: 2.013 }, c).candidate?.kind,
      "endpoint",
    );
    assert.equal(querySnap({ x: 1.037 + 11 / pixelsPerMetre, y: 2.013 }, c).candidate, null);
  }
});
test("equal candidates use deterministic source ordering independent of array order", () => {
  const refs = [
    { point: { x: 0, y: 0 }, entityId: "b", feature: "end" },
    { point: { x: 0, y: 0 }, entityId: "a", feature: "start" },
  ];
  for (const references of [refs, [...refs].reverse()])
    assert.equal(
      querySnap({ x: 0, y: 0 }, { ...context, references }).candidate?.sourceEntityId,
      "a",
    );
});
test("disabled snap, grid fallback and Ortho never mislabel projected endpoints", () => {
  assert.deepEqual(querySnap({ x: 1.04, y: 2.01 }, { ...context, enabled: false }).point, {
    x: 1.04,
    y: 2.01,
  });
  assert.equal(querySnap({ x: 4.04, y: 4.02 }, context).candidate?.kind, "grid");
  const r = querySnap({ x: 1.04, y: 2.01 }, { ...context, orthoOrigin: { x: 0, y: 2.02 } });
  assert.equal(r.point.y, 2.02);
  assert.equal(r.candidate, null);
});
test("invalid numerical contexts reject and invalid references do not poison queries", () => {
  assert.throws(() => querySnap({ x: NaN, y: 0 }, context));
  assert.throws(() => querySnap({ x: 0, y: 0 }, { ...context, pixelsPerMetre: 0 }));
  assert.throws(() => querySnap({ x: 0, y: 0 }, { ...context, gridSpacing: 0 }));
  assert.throws(() =>
    querySnap({ x: 0, y: 0 }, { ...context, orthoOrigin: { x: Infinity, y: 0 } }),
  );
  assert.equal(
    querySnap(
      { x: 0, y: 0 },
      {
        ...context,
        references: [{ point: { x: NaN, y: 0 }, entityId: "bad", feature: "end" }],
        gridSpacing: null,
      },
    ).candidate,
    null,
  );
});
test("model adapter and snapped line workflow preserve exact point, ID, undo and JSON", () => {
  const project = addWall(createProject("p", "s"), {
    id: "wall",
    start: { x: 0.037, y: 0.013 },
    end: { x: 3.037, y: 0.013 },
    thickness: 0.36,
    height: 2.8,
  });
  const before = serializeProject(project);
  const references = projectSnapReferences(project);
  const start = querySnap({ x: 3.04, y: 0.02 }, { ...context, references }).point;
  const history = createHistory(project);
  const line = {
    id: "line",
    kind: "line" as const,
    points: [start, { x: 4, y: 2 }],
    ...defaultLineAppearance,
  };
  const committed = commitProject(history, addLine(history.present, line));
  assert.deepEqual(committed.present.storey.lines![0]!.points[0], project.storey.walls[0]!.end);
  assert.equal(committed.past.length, 1);
  assert.deepEqual(undoProject(committed).present, project);
  assert.deepEqual(
    readProjectFile(serializeProject(redoProject(undoProject(committed)).present)),
    committed.present,
  );
  assert.equal(projectSnapReferences(committed.present).length, 8);
  assert.equal(serializeProject(project), before);
});
