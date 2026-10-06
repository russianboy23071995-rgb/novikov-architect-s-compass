import type { ToolSnapPolicy } from "./snapping.ts";
import { querySnap } from "../../constraints/snapping/engine.ts";
import { createShiftSnapLock } from "./shift-lock.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { prepareToolReferences, resolveToolSnap, drawingSnapPolicy } from "./snapping.ts";
import { createToolSourceQuery } from "./snapping.ts";
import { createVisibleToolSourceQuery } from "./snapping.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { referenceKey } from "../../constraints/inference/construction-reference.ts";

test("visibility filters before density/pairs and preserves all-visible compatibility", () => {
  const p = addLine(base, {
    id: "cross",
    kind: "line",
    points: [
      { x: 0, y: -1 },
      { x: 3, y: 1 },
    ],
    ...defaultLineAppearance,
  });
  const all = createLayerVisibilityPolicy(p, {
    scope: { kind: "drawing-document", documentId: "d" },
    hiddenLayerIds: [],
  });
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.defaultLayerIds.line],
  });
  const full = createVisibleToolSourceQuery(p, all, all.context, null, 1);
  const filtered = createVisibleToolSourceQuery(p, hidden, hidden.context, null, 1);
  const cursor = { x: 1.5, y: 0 };
  assert.equal(full.inspect(cursor, 100, 10).segmentPairs, 1);
  assert.equal(filtered.inspect(cursor, 100, 10).segmentPairs, 0);
  assert.equal(filtered.inspect(cursor, 100, 10).segments.length, 1);
  assert.ok(filtered(cursor, 100, 10, []).every((r) => r.entityId === "w"));
  const legacy = createToolSourceQuery(getLocalSnapSources(p), null);
  const visible = createVisibleToolSourceQuery(p, all, all.context, null);
  assert.deepEqual(visible(cursor, 100, 10, []), legacy(cursor, 100, 10, []));
  assert.ok(visible(cursor, 100, 10, []).some((r) => r.kind === "segment-intersection"));
  assert.equal(getLocalSnapSources(p), getLocalSnapSources(p));
});

test("hidden remote tracked segments and dependent construction points cannot provide guides", () => {
  const index = getLocalSnapSources(base);
  const refs = index.query({ x: 5, y: 0 }, 100, 10).references;
  const endpoint = refs.find((r) => r.entityId === "l" && r.feature === "vertex-0")!;
  const segment = index.allSegments.find((s) => s.source.entityId === "l")!.source;
  const construction = {
    entityId: "@construction",
    feature: "test",
    point: { x: 10, y: 10 },
    dependencies: [endpoint, segment],
  };
  const tracked = { ...segment, parallelDirections: [{ x: 1, y: 2 }] };
  const all = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const hidden = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [base.defaultLayerIds.line],
  });
  const visibleQuery = createVisibleToolSourceQuery(base, all, all.context, null);
  const hiddenQuery = createVisibleToolSourceQuery(base, hidden, hidden.context, null);
  const active = [endpoint, tracked, construction];
  const cursor = { x: 100, y: 100 };
  const visible = visibleQuery(cursor, 100, 10, active);
  for (const r of active) assert.ok(visible.some((s) => referenceKey(s) === referenceKey(r)));
  assert.deepEqual(hiddenQuery(cursor, 100, 10, active), []);
  const result = resolveToolSnap(
    null,
    { x: 5, y: 30 },
    {
      references: [],
      sourceQuery: hiddenQuery,
      activeReferences: [endpoint],
      pixelsPerMetre: 100,
      endpointRadiusPx: 10,
      enabled: true,
      gridSpacing: null,
    },
    { ortho: false, shift: false, featureSnap: true },
  );
  assert.equal(result.candidate, null);
});

test("context mismatch and stale models fail closed, including pinned origins", () => {
  const all = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const other = createLayerVisibilityPolicy(base, {
    scope: { kind: "drawing-document", documentId: "d" },
    hiddenLayerIds: [],
  });
  const drawing = drawingSnapPolicy({ x: 20, y: 20 });
  for (const query of [
    createVisibleToolSourceQuery(base, all, other.context, drawing),
    createVisibleToolSourceQuery(updateWall(base, "w", { height: 3 }), all, all.context, drawing),
  ]) {
    assert.equal(query.inspect({ x: 0, y: 0 }, 100, 10).segments.length, 0);
    assert.deepEqual(query({ x: 0, y: 0 }, 100, 10, [drawing.origin]), []);
  }
  const valid = createVisibleToolSourceQuery(base, all, all.context, drawing);
  assert.ok(
    valid({ x: 100, y: 100 }, 100, 10, [drawing.origin]).some(
      (r) => referenceKey(r) === referenceKey(drawing.origin),
    ),
  );
});
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

import { parseGridSpacing, gridSpacing } from "../snapping/grid-settings.ts";
test("grid spacing accepts metre decimals and rejects invalid input", () => {
  assert.equal(parseGridSpacing("0,25"), 0.25);
  assert.equal(parseGridSpacing(" .05 "), 0.05);
  for (const text of ["", "0", "-1", "NaN", "Infinity", "1,2,3", "0x10", "1m"])
    assert.throws(() => parseGridSpacing(text));
  for (const spacing of [0, -1, NaN, Infinity])
    assert.throws(() => gridSpacing({ enabled: true, spacing }));
});
test("shared grid settings affect drawing and movement without disabling feature snapping", () => {
  const session = {
    base,
    target: { kind: "wall" as const, id: "w" },
    action: "move" as const,
    index: 1,
    anchor: { x: 3, y: 0 },
  };
  const cursor = { x: 10.13, y: 8.37 };
  for (const policy of [
    drawingSnapPolicy({ x: 0, y: 0 }),
    editInteraction(session, base, session.target, noop, noop).snapping,
  ]) {
    for (const spacing of [0.25, 0.5]) {
      const context = {
        references: [],
        pixelsPerMetre: 100,
        endpointRadiusPx: 10,
        enabled: true,
        gridSpacing: gridSpacing({ enabled: true, spacing }),
      };
      const options = { ortho: false, shift: false, featureSnap: true };
      const snapped = resolveToolSnap(policy, cursor, context, options);
      assert.deepEqual(snapped.point, {
        x: Math.round(cursor.x / spacing) * spacing,
        y: Math.round(cursor.y / spacing) * spacing,
      });
      assert.equal(snapped.candidate?.kind, "grid");
      assert.deepEqual(
        resolveToolSnap(policy, cursor, { ...context, enabled: false }, options).point,
        cursor,
      );
      const free = { ...context, gridSpacing: gridSpacing({ enabled: false, spacing }) };
      assert.deepEqual(resolveToolSnap(policy, cursor, free, options).point, cursor);
      const endpoint = { entityId: "other", feature: "end", point: { x: 10.15, y: 8.4 } };
      const exact = resolveToolSnap(policy, cursor, { ...free, references: [endpoint] }, options);
      assert.equal(exact.candidate?.kind, "endpoint");
      assert.deepEqual(exact.point, endpoint.point);
    }
  }
});

test("grid targets survive contour/wall preview, history and zoom metrics", async () => {
  const { createDrawing, defaultHatchFill } = await import("../drawing/actions.ts");
  const { editAtPointer } = await import("../../lib/bim/direct-edit.ts");
  const ring = [
    { x: -3, y: 2 },
    { x: -1, y: 2 },
    { x: -1, y: 1 },
    { x: -3, y: 1 },
  ];
  const hatch = createDrawing(base, base, "h-grid", {
    kind: "hatch",
    points: ring,
    fill: defaultHatchFill,
  });
  const polygon = addLine(base, {
    id: "p-grid",
    kind: "polyline",
    points: [...ring, ring[0]!],
    ...defaultLineAppearance,
  });
  for (const session of [
    {
      base: hatch,
      target: { kind: "hatch" as const, id: "h-grid" },
      action: "edge" as const,
      index: 1,
      anchor: { x: -1, y: 1.5 },
    },
    {
      base: polygon,
      target: { kind: "line" as const, id: "p-grid" },
      action: "edge" as const,
      index: 1,
      anchor: { x: -1, y: 1.5 },
    },
    {
      base,
      target: { kind: "wall" as const, id: "w" },
      action: "move" as const,
      index: 0,
      anchor: { x: 0, y: 0.18 },
    },
  ]) {
    for (const zoom of [25, 100, 500]) {
      const policy = editInteraction(session, session.base, session.target, noop, noop).snapping;
      const result = resolveToolSnap(
        policy,
        { x: 3.38, y: -2.42 },
        {
          references: [],
          enabled: true,
          pixelsPerMetre: zoom,
          endpointRadiusPx: 10,
          metric: createAffineScreenMetric(zoom, zoom / 3, 0, zoom / 2),
          gridSpacing: gridSpacing({ enabled: true, spacing: 0.25 }),
        },
        { ortho: false, shift: false, featureSnap: true },
      );
      assert.deepEqual(
        result.point,
        session.action === "edge" ? { x: 3.5, y: 1.5 } : { x: 3.5, y: -2.5 },
      );
      const initial = serializeProject(session.base);
      const preview = editAtPointer(session, session.base, result.point);
      assert.equal(serializeProject(session.base), initial, "preview/cancel leaves base untouched");
      if (session.target.kind === "wall") {
        assert.equal(
          preview.storey.walls[0]!.start.y,
          -2.68,
          "chosen corner is on grid, axis remains offset by half thickness",
        );
        assert.deepEqual(preview.storey.windows, session.base.storey.windows);
      } else {
        const points =
          session.target.kind === "hatch"
            ? preview.storey.hatches[0]!.points
            : preview.storey.lines!.find((l) => l.id === "p-grid")!.points;
        assert.equal(points[1]!.x, 3.5);
        assert.equal(points[2]!.x, 3.5);
      }
      const history = commitProject(createHistory(session.base), preview);
      assert.equal(history.past.length, 1);
      assert.equal(serializeProject(undoProject(history).present), initial);
      assert.deepEqual(redoProject(undoProject(history)).present, preview);
      assert.deepEqual(deserializeProject(serializeProject(preview)), preview);
    }
  }
});

test("held Shift retains angle across distant sectors, release recalibrates and instances reset", () => {
  const lock = createShiftSnapLock();
  const policy = drawingSnapPolicy({ x: 0, y: 0 });
  const context = {
    references: [],
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
  };
  const options = { ortho: false, shift: true, featureSnap: true };
  assert.deepEqual(lock.resolve(policy, { x: 3, y: 0.1 }, context, options).point, { x: 3, y: 0 });
  for (const cursor of [
    { x: 2, y: 100 },
    { x: -5, y: -100 },
    { x: 0, y: 10 },
  ])
    assert.equal(lock.resolve(policy, cursor, context, options).point.y, 0);
  lock.release();
  assert.deepEqual(lock.resolve(policy, { x: 0.1, y: 4 }, context, options).point, { x: 0, y: 4 });
  assert.equal(lock.resolve(policy, { x: 100, y: 2 }, context, options).point.x, 0);
  const diagonal = createShiftSnapLock().resolve(policy, { x: 3, y: 3 }, context, options).point;
  assert.ok(Math.abs(diagonal.x - 3) < 1e-12 && diagonal.x === diagonal.y);
  lock.resolve(policy, { x: 2, y: 0 }, context, { ...options, shift: false });
  lock.press();
  assert.equal(lock.resolve(policy, { x: 4, y: 20 }, context, options).point.y, 0);
});

test("held Shift preserves an oblique construction extension and exact on-axis targets", () => {
  const lock = createShiftSnapLock();
  const policy = drawingSnapPolicy({ x: 0, y: 0 });
  const reference = { ...policy.origin, directions: [{ x: 2, y: 1 }] };
  const context = {
    references: [reference],
    activeReferences: [reference],
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
  };
  const options = { ortho: false, shift: true, featureSnap: true };
  const initial = lock.resolve(policy, { x: 2, y: 1 }, context, options);
  assert.ok(Math.abs(initial.point.x - 2 * initial.point.y) < 1e-9);
  const far = lock.resolve(policy, { x: -20, y: 100 }, context, options);
  assert.ok(Math.abs(far.point.x - 2 * far.point.y) < 1e-9);
  const exact = lock.resolve(
    policy,
    { x: 4.03, y: 2.02 },
    {
      ...context,
      references: [
        ...context.references,
        { entityId: "target", feature: "end", point: { x: 4, y: 2 } },
      ],
    },
    options,
  );
  assert.deepEqual(exact.point, { x: 4, y: 2 });
  assert.equal(exact.candidate?.kind, "endpoint");
});

test("Shift at the origin waits for a direction; disabled snapping drops the held axis", () => {
  const lock = createShiftSnapLock();
  const policy = drawingSnapPolicy({ x: 0, y: 0 });
  const context = {
    references: [],
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
  };
  const options = { ortho: false, shift: true, featureSnap: true };
  lock.resolve(policy, { x: 0, y: 0 }, context, options);
  assert.equal(lock.resolve(policy, { x: 0, y: 3 }, context, options).point.x, 0);
  lock.resolve(policy, { x: 5, y: 0 }, context, { ...options, featureSnap: false });
  assert.equal(lock.resolve(policy, { x: 5, y: 0 }, context, options).point.y, 0);
});

test("held idle origin survives changed references and camera scale; explicit tool axes win", () => {
  const lock = createShiftSnapLock();
  const origin = { entityId: "a", feature: "end", point: { x: 0, y: 1 } };
  const context = {
    references: [],
    activeReferences: [origin],
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
  };
  const options = { ortho: false, shift: true, featureSnap: true };
  lock.resolve(null, { x: 3, y: 1 }, context, options);
  const result = lock.resolve(
    null,
    { x: 30, y: 80 },
    { ...context, pixelsPerMetre: 400, activeReferences: [{ ...origin, point: { x: 20, y: 20 } }] },
    options,
  );
  assert.deepEqual(result.point, { x: 30, y: 1 });
  const axisPolicy = {
    ...drawingSnapPolicy({ x: 0, y: 0 }),
    resolve: (cursor, ctx) =>
      querySnap(cursor, {
        ...ctx,
        fixedAxis: { origin: { x: 0, y: 0 }, direction: { x: 0, y: 1 } },
      }),
  } satisfies ToolSnapPolicy;
  assert.equal(
    createShiftSnapLock().resolve(axisPolicy, { x: 10, y: 2 }, context, options).point.x,
    0,
  );
});
