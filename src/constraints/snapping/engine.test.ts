import test from "node:test";
import assert from "node:assert/strict";
import { querySnap } from "./engine.ts";
import { coordinatesCompatible, pointsCompatible } from "../../geometry/tolerances/model.ts";

test("numerical compatibility is finite, bounded and independent of screen scale", () => {
  assert.equal(coordinatesCompatible(0.3, 0.1 + 0.2), true);
  assert.equal(coordinatesCompatible(0, 5e-10), true);
  assert.equal(coordinatesCompatible(0, 2e-9), false);
  assert.equal(coordinatesCompatible(1e7, 1e7 + 1e-8), true);
  assert.equal(coordinatesCompatible(1e7, 1e7 + 0.00001), false);
  assert.equal(coordinatesCompatible(1e12, 1e12 + 0.001), false);
  for (const invalid of [NaN, Infinity, -Infinity])
    assert.equal(coordinatesCompatible(invalid, invalid), false);
  assert.equal(pointsCompatible({ x: 1, y: 2 }, { x: 1, y: 2.001 }), false);
});

test("Ortho endpoint compatibility covers both axes, large offsets and zoom without enlarging snap radius", () => {
  for (const offset of [0, 1e7, -1e7])
    for (const pixelsPerMetre of [10, 100, 1000])
      for (const vertical of [false, true]) {
        const exact = offset + 0.3;
        const computed = offset + 0.1 + 0.2;
        const point = vertical ? { x: exact, y: offset + 3 } : { x: offset + 3, y: exact };
        const origin = vertical ? { x: computed, y: offset } : { x: offset, y: computed };
        const refs = [{ point, entityId: "ref", feature: "end" }];
        const c = {
          ...context,
          references: refs,
          pixelsPerMetre,
          orthoOrigin: origin,
          gridSpacing: null,
        };
        const inside = vertical
          ? { x: exact, y: point.y + 9 / pixelsPerMetre }
          : { x: point.x + 9 / pixelsPerMetre, y: exact };
        assert.deepEqual(querySnap(inside, c).point, point);
        assert.equal(querySnap(inside, c).candidate?.kind, "endpoint");
        const outside = vertical
          ? { x: exact, y: point.y + 11 / pixelsPerMetre }
          : { x: point.x + 11 / pixelsPerMetre, y: exact };
        assert.equal(querySnap(outside, c).candidate, null);
        const offAxis = vertical
          ? { x: computed + 0.00001, y: offset }
          : { x: offset, y: computed + 0.00001 };
        assert.equal(querySnap(inside, { ...c, orthoOrigin: offAxis }).candidate, null);
      }
});

test("guide, intersection and grid retain their exact source coordinates under Ortho roundoff", () => {
  const a = { point: { x: 0, y: 0.3 }, entityId: "a", feature: "end" };
  const b = { point: { x: 3, y: 4 }, entityId: "b", feature: "end" };
  const c = { ...context, references: [a, b], orthoOrigin: { x: -1, y: 0.1 + 0.2 } };
  const guide = querySnap({ x: 2, y: 0.31 }, { ...c, activeReference: a });
  assert.equal(guide.candidate?.kind, "horizontal");
  assert.equal(guide.point.y, a.point.y);
  const intersection = querySnap({ x: 3.01, y: 0.31 }, { ...c, activeReferences: [a, b] });
  assert.equal(intersection.candidate?.kind, "intersection");
  assert.deepEqual(intersection.point, { x: 3, y: 0.3 });
  const grid = querySnap(
    { x: 2, y: 0.31 },
    { ...context, references: [], orthoOrigin: { x: 0, y: 0.3 } },
  );
  assert.equal(grid.candidate?.kind, "grid");
  assert.equal(grid.point.y, 3 * 0.1);
});

test("tiny source moves still invalidate hover references despite geometric compatibility", () => {
  const old = { point: { x: 0, y: 0.3 }, entityId: "a", feature: "end" };
  const moved = { ...old, point: { x: 0, y: 0.3 + 1e-10 } };
  assert.equal(pointsCompatible(old.point, moved.point), true);
  const c = { ...context, references: [moved], gridSpacing: null };
  assert.equal(querySnap({ x: 3, y: 0.3 }, { ...c, activeReference: old }).candidate, null);
  assert.equal(querySnap({ x: 3, y: 0.3 }, { ...c, activeReferences: [old] }).candidate, null);
  const pending = advanceHoverReference(emptyHoverReference(), old, 0, 400);
  assert.equal(advanceHoverReference(pending, moved, 400, 400).active, null);
});

test("Ortho accepts 0.3 endpoint against 0.1 + 0.2 without changing source coordinates", () => {
  const endpoint = { x: 3, y: 0.3 };
  const result = querySnap(
    { x: 3.01, y: 0.3 },
    {
      references: [{ point: endpoint, entityId: "roundoff", feature: "end" }],
      pixelsPerMetre: 100,
      enabled: true,
      endpointRadiusPx: 10,
      gridSpacing: null,
      orthoOrigin: { x: 0, y: 0.1 + 0.2 },
    },
  );
  assert.equal(result.candidate?.kind, "endpoint");
  assert.deepEqual(result.point, endpoint);
});
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
import { sameHoverSession, suspendHoverReference } from "../inference/hover-reference.ts";

test("zoom preserves reference session while model, disable and explicit reset invalidate it", () => {
  const references = [{ entityId: "a", feature: "end", point: { x: 0, y: 0 } }];
  const before = { enabled: true, references, pixelsPerMetre: 100, resetKey: 0 };
  for (const pixelsPerMetre of [25, 200, 500])
    assert.equal(sameHoverSession(before, { ...before, pixelsPerMetre }), true);
  assert.equal(sameHoverSession(before, { ...before, references: [...references] }), false);
  assert.equal(sameHoverSession(before, { ...before, enabled: false }), false);
  assert.equal(sameHoverSession(before, { ...before, resetKey: 1 }), false);
});

test("navigation cancels pending dwell without losing active points or toggling consumed points", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 3, y: 0 } };
  let state = advanceHoverReference(emptyHoverReference(), a, 0, 600);
  state = advanceHoverReference(state, a, 600, 600);
  const zoomed = suspendHoverReference(state, false);
  assert.deepEqual(zoomed.references, [a]);
  assert.equal(advanceHoverReference(zoomed, a, 5000, 600).references.length, 1);
  state = advanceHoverReference(state, b, 700, 600);
  const interrupted = suspendHoverReference(state, true);
  assert.equal(interrupted.pending, null);
  assert.deepEqual(interrupted.references, [a]);
  const fresh = advanceHoverReference(interrupted, b, 5000, 600);
  assert.equal(advanceHoverReference(fresh, b, 5599, 600).references.length, 1);
  assert.equal(advanceHoverReference(fresh, b, 5600, 600).references.length, 2);
  const release = advanceHoverReference(suspendHoverReference(zoomed, true), a, 6000, 600);
  assert.equal(advanceHoverReference(release, a, 6600, 600).references.length, 0);
});

const context: SnapContext = {
  references: [{ point: { x: 1.037, y: 2.013 }, entityId: "wall", feature: "axis-end" }],
  pixelsPerMetre: 100,
  enabled: true,
  endpointRadiusPx: 10,
  gridSpacing: 0.1,
  orthoOrigin: null,
};

test("hover retains four distinct references and toggles a revisited reference off", () => {
  let state = emptyHoverReference();
  for (let i = 0; i < 5; i++) {
    const ref = { point: { x: i, y: i }, entityId: `r${i}`, feature: "end" };
    state = advanceHoverReference(state, ref, i * 1000, 400);
    state = advanceHoverReference(state, ref, i * 1000 + 400, 400);
  }
  assert.deepEqual(
    state.references.map((r) => r.entityId),
    ["r1", "r2", "r3", "r4"],
  );
  state = advanceHoverReference(state, state.references[0]!, 6000, 400);
  state = advanceHoverReference(state, state.references[0]!, 6400, 400);
  assert.equal(state.references.length, 3);
  assert.equal(state.active?.entityId, "r4");
  assert.equal(advanceHoverReference(state, null, 6500, 400).references.length, 3);
  assert.equal(emptyHoverReference().references.length, 0);
});

test("two references yield exact axis intersection with two origins across zoom levels", () => {
  const refs = [
    { point: { x: 0.037, y: 1.013 }, entityId: "a", feature: "end" },
    { point: { x: 3.027, y: 4.019 }, entityId: "b", feature: "end" },
  ];
  for (const pixelsPerMetre of [10, 100, 1000]) {
    const result = querySnap(
      { x: 3.027 + 3 / pixelsPerMetre, y: 1.013 + 4 / pixelsPerMetre },
      { ...context, pixelsPerMetre, references: refs, activeReferences: refs },
    );
    assert.equal(result.candidate?.kind, "intersection");
    assert.deepEqual(result.point, { x: 3.027, y: 1.013 });
    assert.deepEqual(result.candidate?.guideOrigin, refs[0]!.point);
    assert.deepEqual(result.candidate?.secondaryGuideOrigin, refs[1]!.point);
  }
  const stale = querySnap(
    { x: 3.027, y: 1.013 },
    { ...context, references: [refs[0]!], activeReferences: refs },
  );
  assert.notEqual(stale.candidate?.kind, "intersection");
});

test("wall creation consumes shared guide intersection with one undo and JSON roundtrip", () => {
  const refs = [
    { point: { x: 0, y: 1.013 }, entityId: "a", feature: "end" },
    { point: { x: 3.027, y: 4 }, entityId: "b", feature: "end" },
  ];
  const end = querySnap(
    { x: 3.03, y: 1.02 },
    { ...context, references: refs, activeReferences: refs },
  ).point;
  const project = createProject("p", "s");
  const history = commitProject(
    createHistory(project),
    addWall(project, {
      id: "guided-wall",
      start: { x: 0, y: 0 },
      end,
      thickness: 0.36,
      height: 2.8,
    }),
  );
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, project);
  const loaded = readProjectFile(serializeProject(redoProject(undoProject(history)).present));
  assert.deepEqual(loaded.storey.walls[0]!.end, { x: 3.027, y: 1.013 });
});

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
  assert.equal(refs.length, 7);
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
  assert.equal(projectSnapReferences(committed.present).length, 11);
  assert.equal(serializeProject(project), before);
});

test("equidistant guides prefer the newest activated reference, independent of model source order", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: -0.0625 } };
  const z = { entityId: "z", feature: "end", point: { x: 0, y: 0.0625 } };
  for (const references of [
    [a, z],
    [z, a],
  ]) {
    const c = { ...context, references, gridSpacing: null };
    assert.equal(
      querySnap({ x: 4, y: 0 }, { ...c, activeReferences: [a, z] }).candidate?.sourceEntityId,
      "z",
    );
    assert.equal(
      querySnap({ x: 4, y: 0 }, { ...c, activeReferences: [z, a] }).candidate?.sourceEntityId,
      "a",
    );
  }
});

test("endpoint ties use activation before full stable source identity", () => {
  const a = { entityId: "a", feature: "end", point: { x: -0.0625, y: 0 } };
  const z = { entityId: "z", feature: "end", point: { x: 0.0625, y: 0 } };
  for (const references of [
    [a, z],
    [z, a],
  ]) {
    assert.equal(
      querySnap({ x: 0, y: 0 }, { ...context, references }).candidate?.sourceEntityId,
      "a",
    );
    assert.equal(
      querySnap({ x: 0, y: 0 }, { ...context, references, activeReferences: [a, z] }).candidate
        ?.sourceEntityId,
      "z",
    );
  }
});

test("intersection ties account for both activated sources and preserve both origins", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const c = { entityId: "c", feature: "end", point: { x: 4, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 2, y: 3 } };
  for (const references of [
    [a, b, c],
    [c, b, a],
  ]) {
    const result = querySnap(
      { x: 2, y: 0 },
      { ...context, references, activeReferences: [a, c, b] },
    );
    assert.equal(result.candidate?.kind, "intersection");
    assert.deepEqual(result.candidate?.guideOrigin, c.point);
    assert.deepEqual(result.candidate?.secondaryGuideOrigin, b.point);
  }
});

test("duplicate or stale active references cannot generate a self intersection", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const duplicate = { ...a, point: { ...a.point } };
  const stale = { ...a, point: { x: 0, y: 1e-10 } };
  const result = querySnap(
    { x: 2, y: 0.01 },
    { ...context, references: [a], activeReferences: [a, duplicate, stale] },
  );
  assert.equal(result.candidate?.kind, "horizontal");
  assert.deepEqual(result.candidate?.guideOrigin, a.point);
});

import { compareSnapCandidates } from "./ranking.ts";
import type { RankedSnap } from "./ranking.ts";

test("rank compares full source tuples including both intersection roles, without slash collisions", () => {
  const candidate = {
    kind: "intersection" as const,
    worldPoint: { x: 2, y: 0 },
    priority: 0.5,
    distanceOnScreen: 0,
    sourceEntityId: "first",
    sourceFeature: "same",
  };
  const a: RankedSnap = {
    candidate,
    activations: [2, 1],
    sources: [
      ["first", "end"],
      ["a", "b/c"],
    ],
  };
  const b: RankedSnap = {
    candidate,
    activations: [2, 1],
    sources: [
      ["first", "end"],
      ["a/b", "c"],
    ],
  };
  assert.ok(compareSnapCandidates(a, b) < 0);
  assert.ok(compareSnapCandidates(b, a) > 0);
});

test("equal direction candidates have explicit kind then coordinate order", () => {
  const reference = { entityId: "wall", feature: "end", point: { x: 0, y: 0 } };
  const base = { ...context, references: [reference], activeReference: reference };
  for (const directions of [
    [
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 0, y: 1 },
      { x: 1, y: 0 },
    ],
  ]) {
    const source = { ...reference, directions };
    const result = querySnap({ x: 3, y: 0 }, { ...base, references: [source] });
    assert.equal(result.candidate?.kind, "extension");
    assert.deepEqual(result.point, { x: 3, y: 0 });
  }
  const candidate = {
    kind: "extension" as const,
    worldPoint: { x: 1, y: 2 },
    priority: 1,
    distanceOnScreen: 5,
    sourceEntityId: "a",
    sourceFeature: "end",
  };
  const a: RankedSnap = { candidate, activations: [1], sources: [["a", "end"]] };
  const b: RankedSnap = { ...a, candidate: { ...candidate, worldPoint: { x: 2, y: 1 } } };
  assert.ok(compareSnapCandidates(a, b) < 0);
});

test("newer guides cannot defeat closer guides or higher priority endpoints", () => {
  for (const pixelsPerMetre of [25, 100, 400]) {
    const old = { entityId: "old", feature: "end", point: { x: 0, y: 0 } };
    const newer = { entityId: "new", feature: "end", point: { x: 0, y: 8 / pixelsPerMetre } };
    const c = {
      ...context,
      pixelsPerMetre,
      references: [old, newer],
      activeReferences: [old, newer],
    };
    assert.equal(querySnap({ x: 4, y: 1 / pixelsPerMetre }, c).candidate?.sourceEntityId, "old");
    const endpoint = { entityId: "endpoint", feature: "end", point: { x: 4.01, y: 0 } };
    assert.equal(
      querySnap({ x: 4, y: 0 }, { ...c, references: [old, newer, endpoint] }).candidate?.kind,
      "endpoint",
    );
  }
});

test("600 ms hover toggles once per visit, requires a fresh dwell and can reactivate", () => {
  const ref = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  let s = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  s = advanceHoverReference(s, ref, 599, 600);
  assert.equal(s.references.length, 0);
  s = advanceHoverReference(s, ref, 600, 600);
  assert.equal(s.references.length, 1);
  assert.equal(s.pending, null);
  s = advanceHoverReference(s, { ...ref }, 5000, 600);
  assert.equal(s.references.length, 1);
  s = advanceHoverReference(s, null, 5100, 600);
  s = advanceHoverReference(s, ref, 5200, 600);
  s = advanceHoverReference(s, ref, 5799, 600);
  assert.equal(s.references.length, 1);
  s = advanceHoverReference(s, ref, 5800, 600);
  assert.equal(s.references.length, 0);
  assert.equal(s.active, null);
  s = advanceHoverReference(s, ref, 9000, 600);
  assert.equal(s.references.length, 0);
  s = advanceHoverReference(s, null, 9100, 600);
  s = advanceHoverReference(s, ref, 9200, 600);
  s = advanceHoverReference(s, ref, 9800, 600);
  assert.equal(s.references.length, 1);
});

test("interrupted release preserves other references and restarts its dwell", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 3, y: 2 } };
  let s = advanceHoverReference(emptyHoverReference(), a, 0, 600);
  s = advanceHoverReference(s, a, 600, 600);
  s = advanceHoverReference(s, b, 700, 600);
  s = advanceHoverReference(s, b, 1300, 600);
  s = advanceHoverReference(s, a, 1400, 600);
  s = advanceHoverReference(s, null, 1999, 600);
  s = advanceHoverReference(s, a, 2000, 600);
  s = advanceHoverReference(s, a, 2599, 600);
  assert.equal(s.references.length, 2);
  s = advanceHoverReference(s, a, 2600, 600);
  assert.deepEqual(s.references, [b]);
  const c = {
    ...context,
    references: [a, b],
    activeReferences: s.references,
    activeReference: s.active,
    gridSpacing: null,
  };
  assert.notEqual(querySnap({ x: 3, y: 0 }, c).candidate?.kind, "intersection");
});

import { intersectLines } from "../../geometry/intersections/lines.ts";
import { cursorGuide, advanceGuideDirections } from "../guides/directions.ts";
import { resolveEditSnap } from "../../application/direct-edit/snapping.ts";
import { createEditingState, editingReducer } from "../../application/direct-edit/controller.ts";
import {
  acquisitionReference,
  withConstructionReferences,
} from "../inference/construction-reference.ts";

test("drawing at a constructed point commits only model geometry and round-trips through undo and JSON", () => {
  const project = addWall(createProject("p", "s"), {
    id: "wall",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  const references = projectSnapReferences(project);
  const activeReferences = references.filter(
    (r) => r.entityId === "wall" && (r.feature === "axis-start" || r.feature === "axis-end"),
  );
  assert.equal(activeReferences.length, 2);
  const c = { ...context, references, activeReferences, gridSpacing: null };
  const ref = acquisitionReference(querySnap({ x: 2, y: 2 }, c).candidate, references)!;
  assert.ok(ref?.dependencies);
  const start = querySnap(
    { x: 2.01, y: 2.01 },
    { ...c, activeReferences: [...activeReferences, ref] },
  ).point;
  assert.deepEqual(start, { x: 2, y: 2 });
  const history = commitProject(
    createHistory(project),
    addLine(project, {
      id: "constructed-line",
      kind: "line",
      points: [start, { x: 3, y: 3 }],
      ...defaultLineAppearance,
    }),
  );
  assert.equal(history.past.length, 1);
  assert.deepEqual(undoProject(history).present, project);
  const json = serializeProject(redoProject(undoProject(history)).present);
  assert.equal(json.includes("@construction"), false);
  assert.deepEqual(readProjectFile(json), history.present);
});

test("line intersection rejects ambiguous or unstable directions and solves oblique lines", () => {
  assert.deepEqual(
    intersectLines({ x: 0, y: 0 }, { x: 1, y: 1 }, { x: 4, y: 0 }, { x: -1, y: 1 }),
    { x: 2, y: 2 },
  );
  for (const direction of [
    { x: 1, y: 0 },
    { x: 1, y: 1e-12 },
    { x: 0, y: 0 },
    { x: NaN, y: 1 },
  ])
    assert.equal(intersectLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 0 }, direction), null);
  assert.equal(
    intersectLines({ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 2 }, { x: 2, y: 0 }),
    null,
  );
});

test("every active source uses its nearest cursor-following 45-degree direction", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 4, y: 0 } };
  assert.equal(cursorGuide({ x: 2, y: 2 }, a).degrees, 45);
  assert.equal(cursorGuide({ x: 2, y: 2 }, b).degrees, 135);
  assert.equal(cursorGuide({ x: 5, y: 0.1 }, a).degrees, 0);
  assert.equal(cursorGuide({ x: 0.1, y: -5 }, a).degrees, 270);
});

test("diagonal guide intersection is exact, screen bounded, constrained and retains both sources", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 4, y: 0 } };
  for (const pixelsPerMetre of [25, 100, 400]) {
    const c = {
      ...context,
      references: [a, b],
      activeReferences: [a, b],
      pixelsPerMetre,
      gridSpacing: null,
    };
    const r = querySnap({ x: 2 + 5 / pixelsPerMetre, y: 2 }, c);
    assert.equal(r.candidate?.kind, "intersection");
    assert.deepEqual(r.point, { x: 2, y: 2 });
    assert.equal(r.candidate?.sourceReferences?.length, 2);
    assert.notEqual(
      querySnap({ x: 2 + 11 / pixelsPerMetre, y: 2 }, c).candidate?.kind,
      "intersection",
    );
    assert.notEqual(
      querySnap({ x: 2, y: 2 }, { ...c, orthoOrigin: { x: 0, y: 0 } }).candidate?.kind,
      "intersection",
    );
    assert.equal(querySnap({ x: 2, y: 2 }, { ...c, enabled: false }).candidate, null);
    assert.equal(
      querySnap({ x: 2, y: 2 }, { ...c, angleOrigin: { x: 0, y: 0 } }).candidate?.sourceFeature,
      "shift-45",
    );
    const end = { entityId: "end", feature: "point", point: { x: 2, y: 2 } };
    assert.equal(
      querySnap({ x: 2, y: 2 }, { ...c, references: [a, b, end] }).candidate?.kind,
      "endpoint",
    );
  }
});

test("constructed intersection activates at 600ms, generates further guides and toggles off", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 4, y: 0 } };
  const c = { ...context, references: [a, b], activeReferences: [a, b], gridSpacing: null };
  const ref = acquisitionReference(querySnap({ x: 2, y: 2 }, c).candidate, [a, b])!;
  assert.ok(ref.dependencies);
  let state: ReturnType<typeof emptyHoverReference> = {
    ...emptyHoverReference(),
    references: [a, b],
    active: b,
  };
  state = advanceHoverReference(state, ref, 0, 600);
  assert.equal(advanceHoverReference(state, ref, 599, 600).references.length, 2);
  state = advanceHoverReference(state, ref, 600, 600);
  assert.equal(state.references.length, 3);
  assert.equal(advanceHoverReference(state, ref, 2000, 600).references.length, 3);
  const sources = withConstructionReferences([a, b], state.references);
  assert.equal(
    acquisitionReference(
      querySnap(ref.point, { ...c, activeReferences: state.references }).candidate,
      sources,
    )?.feature,
    ref.feature,
  );
  const guide = querySnap({ x: 7, y: 2.01 }, { ...c, activeReferences: [ref] });
  assert.equal(guide.candidate?.kind, "horizontal");
  assert.deepEqual(guide.candidate?.guideOrigin, ref.point);
  state = advanceHoverReference(state, null, 2100, 600);
  state = advanceHoverReference(state, ref, 2200, 600);
  state = advanceHoverReference(state, ref, 2800, 600);
  assert.deepEqual(state.references, [a, b]);
  assert.equal(withConstructionReferences([a, b], state.references).length, 2);
});

test("constructed references flatten dependencies and reject moved, missing or excluded sources", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 4, y: 0 } };
  const c = { entityId: "c", feature: "end", point: { x: 6, y: 2 } };
  const first = acquisitionReference(
    querySnap({ x: 2, y: 2 }, { ...context, references: [a, b], activeReferences: [a, b] })
      .candidate,
    [a, b],
  )!;
  const second = acquisitionReference(
    querySnap({ x: 4, y: 4 }, { ...context, references: [a, b, c], activeReferences: [first, c] })
      .candidate,
    [a, b, c, first],
  )!;
  assert.deepEqual(
    second.dependencies?.map((d) => d.entityId),
    ["a", "b", "c"],
  );
  assert.equal(withConstructionReferences([a, b, c], [second]).length, 4);
  assert.equal(
    withConstructionReferences([a, { ...b, point: { x: 4 + 1e-10, y: 0 } }, c], [second]).length,
    3,
  );
  assert.equal(withConstructionReferences([a, c], [second]).length, 2);
  assert.equal(
    querySnap(
      { x: 4, y: 4 },
      { ...context, references: [a, c], activeReferences: [second], gridSpacing: null },
    ).candidate,
    null,
  );
});

const angularCursor = (degrees: number, radius = 3) => ({
  x: radius * Math.cos((degrees * Math.PI) / 180),
  y: radius * Math.sin((degrees * Math.PI) / 180),
});

test("direction hysteresis resists boundary jitter, switches deliberately and wraps through zero", () => {
  const source = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  for (const origin of [0, 45, 90, 135, 180, 225, 270, 315]) {
    let state = advanceGuideDirections(angularCursor(origin), [source]);
    for (const offset of [22.4, 22.6, 24, 22.4, 27.4]) {
      state = advanceGuideDirections(angularCursor(origin + offset), [source], state);
      assert.equal(state[0]!.degrees, origin);
    }
    state = advanceGuideDirections(angularCursor(origin + 27.6), [source], state);
    assert.equal(state[0]!.degrees, (origin + 45) % 360);
    state = advanceGuideDirections(angularCursor(origin + 22.4), [source], state);
    assert.equal(state[0]!.degrees, (origin + 45) % 360);
    state = advanceGuideDirections(angularCursor(origin + 17.4), [source], state);
    assert.equal(state[0]!.degrees, origin);
    assert.equal(advanceGuideDirections(source.point, [source], state)[0]!.degrees, origin);
  }
});

test("direction memory is independent per source and resets on removal, changed identity or position", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 4, y: 0 } };
  const old = advanceGuideDirections({ x: 2, y: 2 }, [a, b]);
  assert.deepEqual(
    old.map((g) => g.degrees),
    [45, 135],
  );
  assert.deepEqual(
    advanceGuideDirections({ x: 2, y: 2 }, [b, a], old).map((g) => g.degrees),
    [135, 45],
  );
  const held = advanceGuideDirections(angularCursor(0), [a]);
  assert.equal(advanceGuideDirections(angularCursor(24), [a], held)[0]!.degrees, 0);
  for (const changed of [
    { ...a, entityId: "new" },
    { ...a, feature: "new" },
    { ...a, point: { x: 1e-10, y: 0 } },
  ])
    assert.equal(advanceGuideDirections(angularCursor(24), [changed], held)[0]!.degrees, 45);
  const reset = advanceGuideDirections(angularCursor(24), [], held);
  assert.deepEqual(reset, []);
  assert.equal(advanceGuideDirections(angularCursor(24), [a], reset)[0]!.degrees, 45);
});

test("intersection and overlay share held directions without expanding radius or overriding Shift", () => {
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 0.18, y: -1 } };
  const cursor = angularCursor(24, 0.2);
  const guideDirections = advanceGuideDirections({ x: 0.18, y: 0 }, [a, b]);
  const c = {
    ...context,
    references: [a, b],
    activeReferences: [a, b],
    guideDirections,
    gridSpacing: null,
    pixelsPerMetre: 100,
  };
  assert.equal(cursorGuide(cursor, a, guideDirections).degrees, 0);
  assert.deepEqual(querySnap(cursor, c).point, { x: 0.18, y: 0 });
  assert.equal(querySnap(cursor, c).candidate?.kind, "intersection");
  assert.notEqual(querySnap(cursor, { ...c, pixelsPerMetre: 400 }).candidate?.kind, "intersection");
  assert.equal(querySnap(cursor, { ...c, angleOrigin: a.point }).candidate?.angleDegrees, 45);
  assert.equal(querySnap(cursor, { ...c, enabled: false }).candidate, null);
  assert.deepEqual(querySnap(cursor, { ...c, orthoOrigin: a.point }).point, { x: 0.18, y: 0 });
});

test("free direct edit consumes stabilized intersections with one reversible model commit", () => {
  const project = addLine(createProject("p", "s"), {
    id: "line",
    kind: "line",
    points: [
      { x: 2, y: 2 },
      { x: 3, y: 2 },
    ],
    ...defaultLineAppearance,
  });
  const target = { kind: "line" as const, id: "line" };
  const state = editingReducer(createEditingState(project), {
    type: "begin",
    target,
    action: "move",
    index: null,
  });
  const a = { entityId: "a", feature: "end", point: { x: 0, y: 0 } };
  const b = { entityId: "b", feature: "end", point: { x: 0.18, y: -1 } };
  const c = {
    ...context,
    references: [a, b],
    activeReferences: [a, b],
    guideDirections: advanceGuideDirections({ x: 0.18, y: 0 }, [a, b]),
    pixelsPerMetre: 100,
    gridSpacing: null,
  };
  const resolved = resolveEditSnap(state.session!, angularCursor(24, 0.2), c);
  assert.deepEqual(resolved.point, { x: 0.18, y: 0 });
  const committed = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: target,
    point: resolved.point,
  });
  assert.equal(committed.error, "");
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(editingReducer(committed, { type: "undo" }).history.present, project);
  const redone = editingReducer(editingReducer(committed, { type: "undo" }), { type: "redo" });
  assert.deepEqual(
    readProjectFile(serializeProject(redone.history.present)),
    committed.history.present,
  );
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
});
