import { wallPlanOutlines } from "../../rendering/viewport/wall-plan-outline.ts";
import { deriveTPreview } from "./t-preview.ts";
import { createProjectionFrame } from "../../geometry/projections/orthographic.ts";
import { createProjectionState } from "../../rendering/viewport/projection-state.ts";
import { createWallPreviewContext } from "../../rendering/viewport/wall-preview-context.ts";
import { initialCamera } from "../../lib/bim/geometry.ts";
import { createEditingState, editingReducer, previewEdit } from "../direct-edit/controller.ts";
import { editInteraction } from "../tools/adapters.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import { resolveToolSnap, createToolSourceQuery } from "../tools/snapping.ts";
import { getLocalSnapSources } from "../snapping/local-sources.ts";
import { segmentKey } from "../snapping/reference-selection.ts";
import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  addWindow,
  updateWall,
  updateWindow,
  validateProject,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";
import { previewTConnection, commitTConnection } from "./t-connections.ts";
import { moveElement, moveWindowAlongWall } from "../direct-edit/transforms.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import {
  connectedWallContours,
  connectedWallSolids,
} from "../../domain/elements/wall/connections.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
const relation = { hostWallId: "host", incoming: { wallId: "incoming", endpoint: 1 as const } };
const request = { projectId: "p", kind: "connect" as const, relation };
function pair(offset = 0, reverse = false) {
  let p = createProject("p", "s");
  p = addWall(p, {
    id: "host",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: offset,
  });
  return addWall(p, {
    id: "incoming",
    start: { x: 3, y: reverse ? 0 : -3 },
    end: { x: 3, y: reverse ? -3 : 0 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: offset,
  });
}
const connected = () => {
  const p = pair();
  return previewTConnection(p, p, request);
};

test("persistent T preview, one history commit, disconnect and undo/redo preserve exact IDs", () => {
  let h = createHistory(pair());
  const base = h.present;
  const preview = previewTConnection(base, base, request);
  assert.equal(base.storey.wallTJunctions.length, 0);
  h = commitTConnection(h, base, request);
  assert.deepEqual(h.present, preview);
  assert.equal(h.past.length, 1);
  assert.deepEqual(undoProject(h).present, base);
  assert.deepEqual(redoProject(undoProject(h)).present, preview);
  const detached = commitTConnection(h, h.present, { ...request, kind: "disconnect" });
  assert.equal(detached.present.storey.wallTJunctions.length, 0);
  assert.deepEqual(undoProject(detached).present, preview);
  assert.throws(() => commitTConnection(h, base, request), /geändert/);
  assert.throws(() => previewTConnection(base, base, { ...request, projectId: "other" }));
  assert.throws(() => previewTConnection(base, base, { ...request, kind: "disconnect" }));
});

test("schema 8 roundtrip and strict V7 migration retain geometry without discovering Ts", () => {
  const p = connected();
  assert.deepEqual(deserializeProject(serializeProject(p)), p);
  const { references, wallTJunctions, ...storey } = p.storey;
  const { assets, hatchPatterns, ...legacyRoot } = p;
  const old = { ...legacyRoot, schemaVersion: 7, storey };
  const migrated = loadProjectData(old);
  assert.equal(migrated.schemaVersion, 16);
  assert.deepEqual(migrated.storey, { ...storey, references: [], wallTJunctions: [] });
  assert.throws(() => loadProjectData({ ...p, schemaVersion: 7 }));
  assert.throws(() => loadProjectData({ ...old, schemaVersion: 8 }));
  assert.throws(() => validateProject(old));
  assert.throws(() =>
    loadProjectData({
      ...p,
      storey: { ...p.storey, wallTJunctions: [{ ...wallTJunctions[0], extra: true }] },
    }),
  );
});

test("host resizing preserves world anchor, detaches outside and does not convert T into corner", () => {
  const p = connected();
  const extended = updateWall(p, "host", { start: { x: -2, y: 0 }, end: { x: 8, y: 0 } });
  assert.deepEqual(extended.storey.walls[1], p.storey.walls[1]);
  assert.deepEqual(extended.storey.wallTJunctions, p.storey.wallTJunctions);
  for (const x of [2, 3]) {
    const next = updateWall(p, "host", { end: { x, y: 0 } });
    assert.equal(next.storey.wallTJunctions.length, 0);
    assert.equal(next.storey.wallJoins.length, 0);
    assert.deepEqual(next.storey.walls[1], p.storey.walls[1]);
    const h = commitProject(createHistory(p), next);
    assert.deepEqual(undoProject(h).present, p);
    assert.deepEqual(redoProject(undoProject(h)).present, next);
  }
  const before = serializeProject(p);
  assert.throws(() => updateWall(p, "host", { end: { x: 3.1, y: 0 } }));
  assert.equal(serializeProject(p), before);
});

test("whole wall translation detaches even when translated host still contains anchor", () => {
  const p = connected();
  for (const id of ["host", "incoming"]) {
    const next = moveElement(p, { kind: "wall", id }, { x: 1, y: 0 });
    assert.equal(next.storey.wallTJunctions.length, 0);
    assert.equal(next.storey.wallJoins.length, 0);
    assert.deepEqual(
      next.storey.walls.find((w) => w.id !== id),
      p.storey.walls.find((w) => w.id !== id),
    );
  }
  assert.deepEqual(moveElement(p, { kind: "wall", id: "host" }, { x: 0, y: 0 }), p);
  assert.equal(
    updateWall(p, "incoming", { start: { x: 3, y: -4 } }).storey.wallTJunctions.length,
    1,
  );
  assert.equal(
    updateWall(p, "incoming", { end: { x: 3, y: -0.5 } }).storey.wallTJunctions.length,
    0,
  );
});

test("invalid persisted identities, duplicate incoming relations fail atomically; remote host corner is allowed", () => {
  const p = connected(),
    before = serializeProject(p);
  for (const r of [
    { ...relation, hostWallId: "missing" },
    { ...relation, hostWallId: "incoming" },
    { ...relation, incoming: { wallId: "incoming", endpoint: 2 } },
    { ...relation, incoming: { wallId: "incoming", endpoint: 0 } },
  ])
    assert.throws(() => loadProjectData({ ...p, storey: { ...p.storey, wallTJunctions: [r] } }));
  assert.throws(() => previewTConnection(p, p, request));
  const withCorner = addWall(p, {
    id: "corner",
    start: { x: 0, y: 0 },
    end: { x: 0, y: 3 },
    thickness: 0.36,
    height: 2.8,
  });
  assert.equal(withCorner.storey.wallJoins.length, 1);
  assert.deepEqual(withCorner.storey.wallTJunctions, p.storey.wallTJunctions);
  const third = addWall(p, {
    id: "third",
    start: { x: 4, y: -3 },
    end: { x: 4, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  assert.equal(
    previewTConnection(third, third, {
      ...request,
      relation: { ...relation, incoming: { wallId: "third", endpoint: 1 } },
    }).storey.wallTJunctions.length,
    2,
  );
  for (const changes of [{ thickness: 0.4 }, { height: 3 }, { bodyOffset: 0.5 }])
    assert.throws(() => updateWall(p, "host", changes));
  assert.equal(serializeProject(p), before);
});

test("T windows may cross contacts, including hidden windows, in solid/IFC and roundtrip", async () => {
  let p = connected();
  for (const [wallId, length] of [
    ["host", 6],
    ["incoming", 3],
  ] as const)
    p = addWindow(p, {
      id: "window-" + wallId,
      wallId,
      width: 1,
      height: 1,
      sillHeight: 0.9,
      position: 2.32 / length,
    });
  const solids = connectedWallSolids(p);
  assert.ok(Math.abs(buildSolid(p).volume - 8.17056) < 1e-9);
  for (const solid of solids)
    assert.deepEqual(connectedWallContours(p).get(solid.wallId), solid.contour);
  const restored = deserializeProject(serializeProject(p));
  assert.deepEqual(buildSolid(restored), buildSolid(p));
  const date = new Date("2026-10-06T12:00:00Z");
  assert.equal(await exportIfc(restored, date), await exportIfc(p, date));
  p = validateProject({ ...p, bimVisibility: { hiddenLayerIds: [p.defaultLayerIds.window] } });
  for (const id of ["window-incoming"])
    assert.ok(buildSolid(updateWindow(p, id, { position: 0.8 })).volume > buildSolid(p).volume);
  assert.equal(updateWindow(p, "window-host", { position: 0.5 }).storey.windows[0]!.position, 0.5);
});

for (const offset of [-0.18, 0, 0.18])
  for (const reverse of [false, true])
    test(`T supports axis offset ${offset}, incoming reversal ${reverse}`, () => {
      const base = pair(offset, reverse);
      const p = previewTConnection(base, base, {
        ...request,
        relation: { ...relation, incoming: { wallId: "incoming", endpoint: reverse ? 0 : 1 } },
      });
      assert.deepEqual(deserializeProject(serializeProject(p)), p);
      assert.equal(connectedWallSolids(p).length, 2);
    });

function aiming(project = pair()) {
  const target = { kind: "wall" as const, id: "incoming" };
  let state = editingReducer(createEditingState(project), {
    type: "begin",
    target,
    action: "point",
    index: 1,
    anchor: project.storey.walls[1]!.end,
  });
  const session = state.session!;
  const adapter = editInteraction(
    session,
    state.history.present,
    target,
    (point, candidate) => {
      state = editingReducer(state, {
        type: "confirm",
        session,
        selection: target,
        point,
        candidate,
      });
    },
    () => {
      state = editingReducer(state, { type: "cancel" });
    },
  );
  const context = {
    references: [],
    pixelsPerMetre: 100,
    enabled: true,
    endpointRadiusPx: 10,
    gridSpacing: null,
    sourceQuery: createToolSourceQuery(getLocalSnapSources(session.base), adapter.snapping),
    includeInteractionTargets: true,
  };
  return { adapter, session, target, context, state: () => state };
}
const snapOptions = { ortho: false, shift: false, featureSnap: true };

test("local axis snap carries stable host through preview and shared commit as one undo", () => {
  const a = aiming(updateWall(pair(), "incoming", { end: { x: 3, y: -0.7 } }));
  const result = resolveToolSnap(a.adapter.snapping, { x: 3.03, y: -0.04 }, a.context, snapOptions);
  assert.equal(result.candidate?.sourceFeature, "t-axis");
  assert.equal(result.candidate?.sourceEntityId, "host");
  assert.deepEqual(result.point, { x: 3, y: 0 });
  const preview = previewEdit(a.session, a.session.base, a.target, result.point, result.candidate);
  assert.equal(preview.storey.wallTJunctions.length, 1);
  assert.equal(a.state().history.present.storey.wallTJunctions.length, 0);
  confirmInteraction(a.adapter, result.point, result.candidate);
  assert.deepEqual(a.state().history.present, preview);
  assert.equal(a.state().history.past.length, 1);
  assert.deepEqual(undoProject(a.state().history).present, a.session.base);
  assert.deepEqual(redoProject(undoProject(a.state().history)).present, preview);
});

test("T source query honours screen radius, reference restrictions and Snap off", () => {
  const a = aiming();
  for (const scale of [40, 100, 400]) {
    const near = resolveToolSnap(
      a.adapter.snapping,
      { x: 3, y: 9 / scale },
      { ...a.context, pixelsPerMetre: scale },
      snapOptions,
    );
    assert.equal(near.candidate?.sourceFeature, "t-axis");
    const far = resolveToolSnap(
      a.adapter.snapping,
      { x: 3, y: 11 / scale },
      { ...a.context, pixelsPerMetre: scale },
      snapOptions,
    );
    assert.notEqual(far.candidate?.sourceFeature, "t-axis");
  }
  assert.notEqual(
    resolveToolSnap(a.adapter.snapping, { x: 3, y: 0 }, a.context, {
      ...snapOptions,
      featureSnap: false,
    }).candidate?.sourceFeature,
    "t-axis",
  );
  assert.notEqual(
    resolveToolSnap(
      a.adapter.snapping,
      { x: 3, y: 0 },
      { ...a.context, selectedSegments: new Set<string>() },
      snapOptions,
    ).candidate?.sourceFeature,
    "t-axis",
  );
  assert.notEqual(
    resolveToolSnap(
      a.adapter.snapping,
      { x: 3, y: 0 },
      { ...a.context, includeInteractionTargets: false },
      snapOptions,
    ).candidate?.sourceFeature,
    "t-axis",
  );
});

test("ambiguous local hosts never choose by list order; reference selection disambiguates", () => {
  const project = addWall(pair(), {
    id: "other-host",
    start: { x: 1, y: 0 },
    end: { x: 5, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  const a = aiming(project);
  assert.notEqual(
    resolveToolSnap(a.adapter.snapping, { x: 3, y: 0 }, a.context, snapOptions).candidate
      ?.sourceFeature,
    "t-axis",
  );
  const source = getLocalSnapSources(a.session.base).allSegments.find(
    (s) => s.source.entityId === "host",
  )!.source;
  const result = resolveToolSnap(
    a.adapter.snapping,
    { x: 3, y: 0 },
    { ...a.context, selectedSegments: new Set([segmentKey(source)]) },
    snapOptions,
  );
  assert.equal(result.candidate?.sourceEntityId, "host");
  assert.equal(result.candidate?.sourceFeature, "t-axis");
});

test("plain numeric target never discovers a T; invalid or stale snapped commit leaves model unchanged", () => {
  const a = aiming();
  const result = resolveToolSnap(a.adapter.snapping, { x: 3, y: 0 }, a.context, snapOptions);
  assert.equal(
    previewEdit(a.session, a.session.base, a.target, result.point).storey.wallTJunctions.length,
    0,
  );
  const changed = updateWall(a.session.base, "host", { height: 3 });
  assert.throws(() => previewEdit(a.session, changed, a.target, result.point, result.candidate));
  const invalid = aiming(updateWall(pair(), "host", { height: 3 }));
  const snap = resolveToolSnap(
    invalid.adapter.snapping,
    { x: 3, y: 0 },
    invalid.context,
    snapOptions,
  );
  assert.throws(() => confirmInteraction(invalid.adapter, snap.point, snap.candidate));
  assert.equal(invalid.state().history.past.length, 0);
  a.adapter.cancel();
  assert.equal(a.state().session, null);
  assert.equal(a.state().history.past.length, 0);
});

test("off-midpoint T snap supports edge axes and respects held direction", () => {
  for (const offset of [-0.18, 0, 0.18]) {
    const p = updateWall(pair(offset), "incoming", {
      start: { x: 2, y: -3 },
      end: { x: 2, y: -0.7 },
    });
    const a = aiming(p);
    const hit = resolveToolSnap(a.adapter.snapping, { x: 2.03, y: 0.02 }, a.context, snapOptions);
    assert.equal(hit.candidate?.sourceFeature, "t-axis");
    assert.deepEqual(hit.point, { x: 2, y: 0 });
    confirmInteraction(a.adapter, hit.point, hit.candidate);
    assert.equal(a.state().history.present.storey.wallTJunctions.length, 1);
    const constrained = resolveToolSnap(
      a.adapter.snapping,
      { x: 2.03, y: 0.02 },
      {
        ...a.context,
        angleDirection: { x: 1, y: 0 },
        angleLockOrigin: a.session.anchor,
      },
      { ...snapOptions, shift: true },
    );
    assert.notEqual(constrained.candidate?.sourceFeature, "t-axis");
    assert.equal(constrained.point.y, -0.7);
  }
});

test("3D workplane transports the same T target through preview, commit and undo", () => {
  for (const zoom of [0.6, 1, 2]) {
    const a = aiming(updateWall(pair(0.18), "incoming", { end: { x: 3, y: -0.7 } }));
    const projection = createProjectionState(
      createProjectionFrame(buildSolid(a.session.base)),
      { ...initialCamera, yaw: 0, pitch: 0.5, zoom },
      { left: 0, top: 0, width: 800, height: 600 },
      { width: 800, height: 600 },
    )!;
    const { context } = createWallPreviewContext(
      a.session.base,
      projection,
      true,
      0,
      a.adapter.snapping,
      "incoming",
    );
    const snap = resolveToolSnap(
      a.adapter.snapping,
      { x: 3.001, y: -0.001 },
      { ...context, endpointRadiusPx: 10, gridSpacing: null, includeInteractionTargets: true },
      snapOptions,
    );
    assert.equal(snap.candidate?.sourceFeature, "t-axis");
    assert.deepEqual(snap.point, { x: 3, y: 0 });
    const preview = previewEdit(a.session, a.session.base, a.target, snap.point, snap.candidate);
    confirmInteraction(a.adapter, snap.point, snap.candidate);
    assert.deepEqual(a.state().history.present, preview);
    assert.equal(preview.storey.wallTJunctions.length, 1);
    assert.equal(a.state().history.past.length, 1);
    assert.deepEqual(undoProject(a.state().history).present, a.session.base);
    assert.deepEqual(redoProject(undoProject(a.state().history)).present, preview);
  }
});

test("3D T acquisition rejects hidden axes and unavailable workplanes", () => {
  const a = aiming(updateWall(pair(0.18), "incoming", { end: { x: 3, y: -0.7 } }));
  for (const camera of [
    null,
    { ...initialCamera, yaw: Math.PI, pitch: 0.5 },
    { ...initialCamera, yaw: 0, pitch: 0 },
  ]) {
    const projection =
      camera &&
      createProjectionState(
        createProjectionFrame(buildSolid(a.session.base)),
        camera,
        { left: 0, top: 0, width: 800, height: 600 },
        { width: 800, height: 600 },
      );
    const { context } = createWallPreviewContext(
      a.session.base,
      projection,
      true,
      0,
      a.adapter.snapping,
      "incoming",
    );
    const snap = resolveToolSnap(
      a.adapter.snapping,
      { x: 3, y: 0 },
      { ...context, endpointRadiusPx: 10, gridSpacing: null, includeInteractionTargets: true },
      snapOptions,
    );
    assert.notEqual(snap.candidate?.sourceFeature, "t-axis");
  }
  assert.equal(a.state().history.past.length, 0);
});

test("multiple T branches share a host from both sides and retain independent history/IFC", async () => {
  for (const offset of [-0.18, 0, 0.18]) {
    let p = pair(offset);
    p = previewTConnection(p, p, request);
    for (const [id, x, y] of [
      ["second", 4, -3],
      ["opposite", 3, 3],
    ] as const) {
      p = addWall(p, {
        id,
        start: { x, y },
        end: { x, y: 0 },
        thickness: 0.36,
        height: 2.8,
        bodyOffset: offset,
      });
      assert.ok(deriveTPreview(p, "host", { wallId: id, endpoint: 1 }));
      p = previewTConnection(p, p, {
        ...request,
        relation: { hostWallId: "host", incoming: { wallId: id, endpoint: 1 } },
      });
    }
    assert.equal(p.storey.wallTJunctions.length, 3);
    assert.equal(connectedWallContours(p).size, 4);
    assert.equal(connectedWallSolids(p).length, 4);
    assert.deepEqual(deserializeProject(serializeProject(p)), p);
    assert.equal(((await exportIfc(p)).match(/=IFCWALL\(/g) ?? []).length, 4);
    const h = commitProject(
      createHistory(p),
      moveElement(p, { kind: "wall", id: "second" }, { x: 0.5, y: 0 }),
    );
    assert.equal(h.present.storey.wallTJunctions.length, 2);
    assert.deepEqual(undoProject(h).present, p);
    assert.equal(updateWall(p, "host", { end: { x: 3.5, y: 0 } }).storey.wallTJunctions.length, 2);
    const overlap = addWall(p, {
      id: "overlap",
      start: { x: 3.1, y: -3 },
      end: { x: 3.1, y: 0 },
      thickness: 0.36,
      height: 2.8,
      bodyOffset: offset,
    });
    assert.throws(
      () =>
        previewTConnection(overlap, overlap, {
          ...request,
          relation: { hostWallId: "host", incoming: { wallId: "overlap", endpoint: 1 } },
        }),
      /überschneiden/,
    );
  }
});

test("plan removes only persisted visible contact seams and restores caps when partner hidden", () => {
  const p = connected();
  const visible = new Set(["host", "incoming"]);
  const outlines = wallPlanOutlines(p, visible);
  const perimeter = (map: ReturnType<typeof wallPlanOutlines>) =>
    [...map.values()]
      .flat()
      .reduce((sum, e) => sum + Math.hypot(e.end.x - e.start.x, e.end.y - e.start.y), 0);
  // Host 6 x .36 and incoming 2.82 x .36, minus the shared .36 contact twice.
  assert.ok(Math.abs(perimeter(outlines) - (2 * (6 + 0.36) + 2 * (2.82 + 0.36) - 0.72)) < 1e-9);
  assert.equal(outlines.get("incoming")!.length, 3);
  assert.equal(wallPlanOutlines(p, new Set(["incoming"])).get("incoming")!.length, 4);
  assert.equal(wallPlanOutlines(pair(), visible).get("incoming")!.length, 4);
  const snapshot = serializeProject(p);
  wallPlanOutlines(p, visible);
  assert.equal(serializeProject(p), snapshot);
});

test("opposite T endpoint snap does not create a spurious corner", () => {
  let p = pair(0.18);
  p = previewTConnection(p, p, request);
  p = addWall(p, {
    id: "opposite",
    start: { x: 3, y: 3 },
    end: { x: 3, y: 0.7 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0.18,
  });
  const state = editingReducer(createEditingState(p), {
    type: "begin",
    target: { kind: "wall", id: "opposite" },
    action: "point",
    index: 1,
    anchor: { x: 3, y: 0.7 },
  });
  const session = state.session!;
  const next = previewEdit(
    session,
    session.base,
    { kind: "wall", id: "opposite" },
    { x: 3, y: 0 },
    {
      kind: "endpoint",
      worldPoint: { x: 3, y: 0 },
      sourceEntityId: "host",
      sourceFeature: "t-axis",
      distanceOnScreen: 0,
      priority: 0,
    },
  );
  assert.equal(next.storey.wallTJunctions.length, 2);
  assert.equal(next.storey.wallJoins.length, 0);
});

test("joined corner outline and rotated distant T remove their contact only", () => {
  let p = addWall(createProject("corner", "s"), {
    id: "a",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  p = addWall(p, {
    id: "b",
    start: { x: 3, y: 0 },
    end: { x: 3, y: 3 },
    thickness: 0.36,
    height: 2.8,
  });
  const outlines = wallPlanOutlines(p, new Set(["a", "b"]));
  assert.equal(outlines.get("a")!.length, 3);
  assert.equal(outlines.get("b")!.length, 3);
  const base = connected();
  const transform = (p: { x: number; y: number }) => ({
    x: 1000000 + Math.cos(0.7) * p.x - Math.sin(0.7) * p.y,
    y: -1000000 + Math.sin(0.7) * p.x + Math.cos(0.7) * p.y,
  });
  const rotated = validateProject({
    ...base,
    storey: {
      ...base.storey,
      walls: base.storey.walls.map((w) => ({
        ...w,
        start: transform(w.start),
        end: transform(w.end),
      })),
    },
  });
  assert.equal(wallPlanOutlines(rotated, new Set(["host", "incoming"])).get("incoming")!.length, 3);
});

test("host window travels across both T contacts with stable identity, undo and IFC", async () => {
  let p = connected();
  p = addWall(p, {
    id: "second",
    start: { x: 4.5, y: -3 },
    end: { x: 4.5, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  p = previewTConnection(p, p, {
    ...request,
    relation: { hostWallId: "host", incoming: { wallId: "second", endpoint: 1 } },
  });
  p = addWindow(p, {
    id: "travelling",
    wallId: "host",
    width: 1,
    height: 1,
    sillHeight: 0.9,
    position: 0.2,
  });
  const baseVolume = buildSolid(p).volume;
  for (const position of [0.3, 0.5, 0.6, 0.75, 0.9]) {
    const moved = moveWindowAlongWall(p, "travelling", (position - 0.2) * 6);
    assert.equal(moved.storey.windows[0]!.wallId, "host");
    assert.ok(Math.abs(moved.storey.windows[0]!.position - position) < 1e-10);
    assert.ok(Math.abs(buildSolid(moved).volume - baseVolume) < 1e-8);
    assert.equal(moved.storey.wallTJunctions.length, 2);
    assert.deepEqual(deserializeProject(serializeProject(moved)), moved);
    assert.ok((await exportIfc(moved)).includes("IFCWINDOW("));
    assert.deepEqual(undoProject(commitProject(createHistory(p), moved)).present, p);
  }
});

test("incoming window may cross trimmed T cap while its cut is clipped to its own wall", () => {
  let p = connected();
  p = addWindow(p, {
    id: "near-cap",
    wallId: "incoming",
    width: 1,
    height: 1,
    sillHeight: 0.9,
    position: 2.5 / 3,
  });
  const incoming = connectedWallSolids(p).find((w) => w.wallId === "incoming")!;
  assert.ok(Math.abs(incoming.volume - (2.82 * 0.36 * 2.8 - 0.82 * 0.36)) < 1e-8);
  assert.deepEqual(deserializeProject(serializeProject(p)), p);
});
