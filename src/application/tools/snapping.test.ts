import test from "node:test";
import assert from "node:assert/strict";
import { prepareToolReferences, resolveToolSnap, drawingSnapPolicy } from "./snapping.ts";
import { createToolSourceQuery } from "./snapping.ts";
import { getLocalSnapSources } from "../snapping/local-sources.ts";
import {
  advanceHoverReference,
  emptyHoverReference,
} from "../../constraints/inference/hover-reference.ts";
import { acquisitionReference } from "../../constraints/inference/construction-reference.ts";
import { editInteraction } from "./adapters.ts";
import { resolveEditSnap } from "../direct-edit/snapping.ts";
import { projectSnapReferences, getProjectSnapReferences } from "../snapping/project-references.ts";
import {
  validateProject,
  updateLine,
  updateWall,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { addWall, addWindow, addLine, createProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { sameHoverSession } from "../../constraints/inference/hover-reference.ts";
import { createAffineScreenMetric } from "../../geometry/projections/screen-metric.ts";

test("shared source query and point ranking use the same affine metric", () => {
  const metric = createAffineScreenMetric(100, 0, 0, 1);
  const sourceQuery = createToolSourceQuery(getLocalSnapSources(base), null);
  const c = {
    references: projectSnapReferences(base),
    pixelsPerMetre: 100,
    metric,
    endpointRadiusPx: 10,
    enabled: true,
    gridSpacing: null,
  };
  const options = { ortho: false, shift: false, featureSnap: true };
  for (const cursor of [
    { x: 5, y: 5 },
    { x: 6, y: 9 },
    { x: 0, y: 4 },
  ]) {
    const local = resolveToolSnap(null, cursor, { ...c, sourceQuery }, options);
    assert.deepEqual(local, resolveToolSnap(null, cursor, c, options));
    assert.ok(local.candidate);
    assert.ok(local.candidate.distanceOnScreen <= 10);
  }
});
const base = addLine(
  addWindow(
    addWall(createProject("p", "s"), {
      id: "w",
      start: { x: 0, y: 0 },
      end: { x: 3, y: 0 },
      thickness: 0.36,
      height: 2.8,
    }),
    { id: "o", wallId: "w", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.5 },
  ),
  {
    id: "l",
    kind: "line",
    points: [
      { x: 5, y: 0 },
      { x: 6, y: 2 },
    ],
    ...defaultLineAppearance,
  },
);
const noop = () => {};

test("local shared resolver matches full source path for all edit axes, drawing and modifiers", () => {
  for (const action of ["point", "move", "stretch", "axis", "x", "y"] as const) {
    const session = {
      base,
      target: { kind: "wall" as const, id: "w" },
      action,
      index: 1,
      anchor: { x: 3, y: 0 },
    };
    for (const policy of [
      null,
      drawingSnapPolicy({ x: 0, y: 0 }),
      editInteraction(session, base, session.target, noop, noop).snapping,
    ]) {
      const refs = prepareToolReferences(policy, projectSnapReferences(base));
      const sourceQuery = createToolSourceQuery(getLocalSnapSources(base), policy);
      const active = refs.filter((r) => r.entityId === "l").slice(0, 2);
      for (const cursor of [
        { x: 5.02, y: 0.01 },
        { x: 5.5, y: 1 },
        { x: 6, y: 2 },
        { x: 10, y: 2.01 },
      ])
        for (const enabled of [true, false])
          for (const ortho of [true, false])
            for (const shift of [true, false])
              for (const featureSnap of [true, false]) {
                const context = {
                  references: refs,
                  pixelsPerMetre: 100,
                  endpointRadiusPx: 10,
                  gridSpacing: 0.1,
                  enabled,
                  activeReferences: active,
                };
                const options = { ortho, shift, featureSnap };
                assert.deepEqual(
                  resolveToolSnap(
                    policy,
                    cursor,
                    { ...context, references: [], sourceQuery },
                    options,
                  ),
                  resolveToolSnap(policy, cursor, context, options),
                );
              }
    }
  }
});

test("remote guides survive local query motion and zoom; stale sources are rejected", () => {
  const refs = projectSnapReferences(base);
  const active = refs.filter((r) => r.entityId === "l").slice(0, 2);
  const sourceQuery = createToolSourceQuery(getLocalSnapSources(base), null);
  const context = {
    references: [],
    sourceQuery,
    pixelsPerMetre: 100,
    endpointRadiusPx: 10,
    gridSpacing: null,
    enabled: true,
    activeReferences: active,
  };
  const options = { ortho: false, shift: false, featureSnap: true };
  const result = resolveToolSnap(null, { x: 100, y: 2.01 }, context, options);
  assert.ok(result.candidate);
  assert.deepEqual(
    result,
    resolveToolSnap(
      null,
      { x: 100, y: 2.01 },
      { ...context, references: refs, sourceQuery: undefined },
      options,
    ),
  );
  const identity = {
    references: context.references,
    sourceQuery,
    enabled: true,
    pixelsPerMetre: 100,
  };
  assert.ok(sameHoverSession(identity, { ...identity, pixelsPerMetre: 500 }));
  assert.ok(
    !sameHoverSession(identity, {
      ...identity,
      sourceQuery: createToolSourceQuery(
        getLocalSnapSources(deserializeProject(serializeProject(base))),
        null,
      ),
    }),
  );
  const stale = { ...active[0]!, point: { x: active[0]!.point.x + 1, y: 0 } };
  assert.equal(
    resolveToolSnap(null, { x: 100, y: 0.01 }, { ...context, activeReferences: [stale] }, options)
      .candidate,
    null,
  );
});

test("local segment intersection is immediate and can be acquired at exactly 600ms", () => {
  const project = addLine(base, {
    id: "cross",
    kind: "line",
    points: [
      { x: 4, y: 0.8 },
      { x: 8, y: 0.8 },
    ],
    ...defaultLineAppearance,
  });
  const sourceQuery = createToolSourceQuery(getLocalSnapSources(project), null);
  const point = { x: 5.4, y: 0.8 };
  const sources = sourceQuery(point, 100, 10, []);
  const result = resolveToolSnap(
    null,
    point,
    {
      references: [],
      sourceQuery,
      pixelsPerMetre: 100,
      endpointRadiusPx: 10,
      gridSpacing: null,
      enabled: true,
    },
    { ortho: false, shift: false, featureSnap: true },
  );
  assert.equal(result.candidate?.kind, "segment-intersection");
  const ref = acquisitionReference(result.candidate, sources)!;
  assert.ok(ref);
  const pending = advanceHoverReference(emptyHoverReference(), ref, 0, 600);
  assert.equal(advanceHoverReference(pending, ref, 599, 600).references.length, 0);
  const acquired = advanceHoverReference(pending, ref, 600, 600);
  assert.equal(acquired.references.length, 1);
  assert.ok(
    sourceQuery({ x: 100, y: 100 }, 100, 10, acquired.references).some(
      (r) => r.entityId === ref.entityId && r.feature === ref.feature,
    ),
  );
});

test("model references survive tool and polyline-origin changes without retaining tool exclusions", () => {
  const sources = getProjectSnapReferences(base);
  for (const point of [
    { x: 0, y: 0 },
    { x: 2, y: 3 },
    { x: -1, y: 4 },
  ]) {
    const refs = prepareToolReferences(drawingSnapPolicy(point), getProjectSnapReferences(base));
    assert.equal(getProjectSnapReferences(base), sources);
    assert.equal(refs.at(-1)!.point, point);
    assert.ok(refs.some((r) => r.entityId === "w"));
  }
  const session = {
    base,
    target: { kind: "wall" as const, id: "w" },
    action: "point" as const,
    index: 1,
    anchor: { x: 3, y: 0 },
  };
  const edit = editInteraction(session, base, session.target, noop, noop).snapping;
  assert.ok(!prepareToolReferences(edit, sources).some((r) => r.entityId === "w"));
  assert.ok(
    prepareToolReferences(null, getProjectSnapReferences(base)).some((r) => r.entityId === "w"),
  );
  assert.ok(
    !sources.some((r) => r.entityId === "@edit-origin" || r.entityId === "@drawing-origin"),
  );
});

test("model revision, undo/redo and loaded same-ID projects use matching reference snapshots", () => {
  const history = createHistory(base);
  const original = history.present;
  const before = getProjectSnapReferences(original);
  const changed = updateWall(original, "w", { end: { x: 6, y: 2 } });
  const next = commitProject(history, changed);
  const after = getProjectSnapReferences(next.present);
  assert.notEqual(after, before);
  assert.deepEqual(after, projectSnapReferences(next.present));
  assert.deepEqual(before, projectSnapReferences(original));
  const undone = undoProject(next);
  assert.equal(getProjectSnapReferences(undone.present), before);
  assert.equal(getProjectSnapReferences(redoProject(undone).present), after);
  const loaded = deserializeProject(serializeProject(changed));
  assert.notEqual(getProjectSnapReferences(loaded), after);
  assert.deepEqual(getProjectSnapReferences(loaded), projectSnapReferences(loaded));
});
test("one snap entry preserves every edit constraint including hosted windows", () => {
  for (const target of [
    { kind: "wall", id: "w" },
    { kind: "line", id: "l" },
    { kind: "window", id: "o" },
  ] as const)
    for (const action of (target.kind === "window"
      ? ["move"]
      : ["point", "move", "stretch", "axis", "x", "y"]) as Array<
      "point" | "move" | "stretch" | "axis" | "x" | "y"
    >) {
      const state = editingReducer(createEditingState(base), {
        type: "begin",
        target,
        action,
        index: target.kind === "window" ? null : 1,
      });
      const session = state.session!,
        policy = editInteraction(session, state.history.present, target, noop, noop).snapping;
      const refs = prepareToolReferences(policy, projectSnapReferences(base));
      assert.equal(
        refs.some((r) => r.entityId === target.id),
        false,
      );
      if (target.kind === "window")
        assert.equal(
          refs.some((r) => r.entityId === "w"),
          false,
        );
      assert.deepEqual(policy.origin.point, session.anchor);
      for (const enabled of [true, false])
        for (const shift of [true, false]) {
          const context = {
            references: refs,
            pixelsPerMetre: 100,
            enabled,
            endpointRadiusPx: 10,
            gridSpacing: 0.1,
            activeReferences: [policy.origin],
          };
          const cursor = { x: 4.03, y: 1.12 };
          const actual = resolveToolSnap(policy, cursor, context, {
            ortho: true,
            shift,
            featureSnap: true,
          });
          const expected = resolveEditSnap(session, cursor, {
            ...context,
            orthoOrigin: session.anchor,
            angleOrigin: shift ? session.anchor : null,
          });
          assert.deepEqual(actual, expected);
        }
    }
});
test("view-only changes preserve policy and reference identity; new interaction replaces it", () => {
  const state = editingReducer(createEditingState(base), {
    type: "begin",
    target: { kind: "wall", id: "w" },
    action: "point",
    index: 1,
  });
  const session = state.session!;
  const a = editInteraction(session, state.history.present, session.target, noop, noop).snapping;
  const b = editInteraction(session, state.history.present, session.target, noop, noop).snapping;
  assert.equal(a, b);
  const refs = prepareToolReferences(a, projectSnapReferences(base));
  assert.ok(
    sameHoverSession(
      { enabled: true, references: refs, pixelsPerMetre: 50 },
      { enabled: true, references: refs, pixelsPerMetre: 200 },
    ),
  );
  const origin = { x: 1, y: 2 },
    draw = drawingSnapPolicy(origin);
  assert.equal(draw, drawingSnapPolicy(origin));
  assert.notEqual(draw, drawingSnapPolicy({ ...origin }));
  assert.equal(
    prepareToolReferences(null, projectSnapReferences(base)).some(
      (r) => r.entityId === "@edit-origin",
    ),
    false,
  );
});
test("drawing and idle hover use same resolver with Shift origin and Snap off respected", () => {
  const origin = { x: 1, y: 2 },
    policy = drawingSnapPolicy(origin),
    refs = prepareToolReferences(policy, []);
  const context = {
    references: refs,
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
    activeReferences: [policy.origin],
  };
  const result = resolveToolSnap(policy, { x: 3, y: 3.9 }, context, {
    ortho: false,
    shift: true,
    featureSnap: true,
  });
  assert.equal(result.candidate?.kind, "angle");
  assert.ok(Math.abs(result.point.x - 1 - (result.point.y - 2)) < 1e-10);
  const disabled = resolveToolSnap(
    policy,
    { x: 3, y: 3.9 },
    { ...context, enabled: false },
    { ortho: false, shift: false, featureSnap: true },
  );
  assert.deepEqual(disabled.point, { x: 3, y: 3.9 });
  const idle = resolveToolSnap(null, origin, context, {
    ortho: false,
    shift: false,
    featureSnap: true,
  });
  assert.deepEqual(idle.point, origin);
});

test("dense diagonal boxes and crossings preserve full resolver ranking at multiple scales", () => {
  for (const crossing of [false, true]) {
    const project = validateProject({
      ...base,
      storey: {
        ...base.storey,
        lines: Array.from({ length: 80 }, (_, i) => {
          const slope = crossing ? 0.2 + i * 0.02 : 1;
          const offset = crossing ? 0.001 * (i % 7) : 2 + i * 0.1;
          return {
            id: "dense-" + i,
            layerId: base.defaultLayerIds.line,
            kind: "line",
            points: [
              { x: -100, y: -100 * slope + offset },
              { x: 100, y: 100 * slope + offset },
            ],
            ...defaultLineAppearance,
          };
        }),
      },
    });
    const model = getLocalSnapSources(project);
    const full = projectSnapReferences(project);
    const policy = drawingSnapPolicy({ x: -2, y: -2 });
    const references = prepareToolReferences(policy, full);
    const sourceQuery = createToolSourceQuery(model, policy, Infinity); // Differential oracle without density guard.
    const activeReferences = [
      policy.origin,
      ...full.filter((r) => r.kind === "midpoint").slice(1, 4),
    ];
    for (const pixelsPerMetre of [25, 100, 500])
      for (const cursor of [
        { x: 0.013, y: 0.009 },
        { x: 1, y: 1 },
        { x: 50, y: 50 },
        { x: -99.99, y: -99.98 },
      ]) {
        const context = {
          references,
          activeReferences,
          enabled: true,
          pixelsPerMetre,
          endpointRadiusPx: 10,
          gridSpacing: null,
        };
        assert.deepEqual(
          resolveToolSnap(
            policy,
            cursor,
            { ...context, references: [], sourceQuery },
            { ortho: false, shift: false, featureSnap: true },
          ),
          resolveToolSnap(policy, cursor, context, {
            ortho: false,
            shift: false,
            featureSnap: true,
          }),
        );
      }
    const local = model.query({ x: 0, y: 0 }, 100, 10, (r) => r.entityId.startsWith("dense-"));
    assert.equal(local.segments.length, crossing ? 80 : 0);
    assert.equal(local.segmentPairs, crossing ? 3160 : 0);
    if (!crossing) assert.equal(local.references.length, 0);
  }
});

test("moving window excludes host and itself before intersections and active guides", () => {
  const project = addLine(base, {
    id: "through-host",
    kind: "line",
    points: [
      { x: 0, y: -2 },
      { x: 0, y: 2 },
    ],
    ...defaultLineAppearance,
  });
  const session = editingReducer(createEditingState(project), {
    type: "begin",
    target: { kind: "window", id: "o" },
    action: "move",
    index: null,
  }).session!;
  const policy = editInteraction(session, project, session.target, noop, noop).snapping;
  const full = projectSnapReferences(project);
  const sourceQuery = createToolSourceQuery(getLocalSnapSources(project), policy);
  const forbidden = full.filter((r) => r.entityId === "w" || r.entityId === "o");
  for (const cursor of [
    { x: 0, y: 0 },
    { x: 1.5, y: 0 },
    { x: 3, y: 0 },
    { x: 100, y: 0.01 },
  ]) {
    const actualSources = sourceQuery(cursor, 100, 10, forbidden);
    assert.ok(
      actualSources.every((r) =>
        [r, ...(r.dependencies ?? [])].every((d) => d.entityId !== "w" && d.entityId !== "o"),
      ),
    );
    const context = {
      references: prepareToolReferences(policy, full),
      activeReferences: forbidden,
      pixelsPerMetre: 100,
      enabled: true,
      endpointRadiusPx: 10,
      gridSpacing: null,
    };
    assert.deepEqual(
      resolveToolSnap(
        policy,
        cursor,
        { ...context, references: [], sourceQuery },
        { ortho: false, shift: false, featureSnap: true },
      ),
      resolveToolSnap(policy, cursor, context, { ortho: false, shift: false, featureSnap: true }),
    );
  }
});

test("constructed reference drops after a source moves; matching undo snapshot restores eligibility", () => {
  const full = projectSnapReferences(base);
  const leaves = full.filter((r) => r.entityId === "l" && !r.kind).slice(0, 2);
  assert.equal(leaves.length, 2);
  const constructed = acquisitionReference(
    {
      kind: "intersection",
      worldPoint: { x: 10, y: 10 },
      distanceOnScreen: 0,
      sourceEntityId: "l",
      sourceFeature: "test",
      sourceReferences: leaves,
      priority: 0,
    },
    full,
  )!;
  assert.ok(constructed?.dependencies?.length);
  const cursor = { x: 100, y: 100 };
  const contains = (project: typeof base) =>
    createToolSourceQuery(getLocalSnapSources(project), null)(cursor, 100, 10, [constructed]).some(
      (r) => r.entityId === constructed.entityId && r.feature === constructed.feature,
    );
  assert.ok(contains(base));
  const changed = updateLine(base, "l", {
    points: [
      { x: 5, y: 0 },
      { x: 7, y: 2 },
    ],
  });
  assert.equal(contains(changed), false);
  const history = commitProject(createHistory(base), changed);
  assert.ok(contains(undoProject(history).present));
  assert.equal(contains(redoProject(undoProject(history)).present), false);
});
