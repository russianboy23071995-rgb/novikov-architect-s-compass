import assert from "node:assert/strict";
import os from "node:os";
import { connectionGroupFixture } from "./connection-group-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { connectSnappedT } from "../src/application/walls/t-axis-snap.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { validateProject } from "../src/domain/project/schema.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import { selectionMoveSurfaces } from "../src/rendering/viewport/selection-move-preview.ts";
import type { SnapCandidate } from "../src/constraints/snapping/engine.ts";

const summary = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  return {
    median: sorted[Math.floor(sorted.length / 2)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
  };
};
const canonical = (faces: unknown[]) => faces.map((face) => JSON.stringify(face)).sort();
const candidateFor = (x: number): SnapCandidate => ({
  kind: "endpoint",
  worldPoint: { x, y: 0 },
  sourceEntityId: `host-${x}`,
  sourceFeature: "t-axis",
  distanceOnScreen: 0,
  priority: 0,
});
const runs = [];
for (const foreign of [0, 100, 1000]) {
  const raw = connectionGroupFixture(1, foreign);
  // Start unconnected: a host that is itself an incoming T wall is currently
  // forbidden. Measure a supported new relation, not repeated rejection cost.
  storeyOf(raw).wallTJunctions = [];
  for (const x of [8, 10]) {
    storeyOf(raw).walls.push({
      ...storeyOf(raw).walls[0]!,
      id: `host-${x}`,
      start: { x, y: -3 },
      end: { x, y: 3 },
    });
  }
  const base = validateProject(raw),
    original = structuredClone(base);
  const session: EditSession = {
    base,
    target: { kind: "wall", id: "wall-1" },
    action: "point",
    index: 1,
    anchor: { x: 6, y: 0 },
  };
  const start = performance.now();
  const prepared = prepareDirectEditPreview(session)!;
  const preparationMs = performance.now() - start;
  const solid = buildBuildingSolid(base);
  const samples = [];
  let firstTargetMs = 0;
  for (let i = 0; i < 28; i++) {
    // Fixed target: repeated pointer events can resolve to the same snapped point.
    const candidate = candidateFor(8),
      point = candidate.worldPoint;
    const t = performance.now();
    const patch = prepared.evaluate(base, session.target, point, candidate);
    const a = performance.now();
    if (i === 0) firstTargetMs = a - t;
    const derived = selectionMoveSurfaces(solid, base, patch);
    const b = performance.now();
    const moved = editAtPointer(session, base, point);
    const c = performance.now();
    const full = connectSnappedT(session, moved, point, candidate);
    const d = performance.now();
    // Assertions and full reference extrusion are outside timing intervals.
    const replacements = new Map(storeyOf(patch.geometry).walls.map((w) => [w.id, w]));
    const windows = new Map(storeyOf(patch.geometry).windows.map((w) => [w.id, w]));
    assert.deepEqual(
      storeyOf(base).walls.map((w) => replacements.get(w.id) ?? w),
      storeyOf(full).walls,
    );
    assert.deepEqual(
      storeyOf(base).windows.map((w) => windows.get(w.id) ?? w),
      storeyOf(full).windows,
    );
    assert.deepEqual(storeyOf(patch.geometry).wallTJunctions, storeyOf(full).wallTJunctions);
    assert.deepEqual(canonical(derived.faces), canonical(buildBuildingSolid(full).faces));
    assert.ok(storeyOf(full).wallTJunctions.some((r) => r.hostWallId === "host-8"));
    assert.equal(storeyOf(full).windows.length, 2);
    if (i >= 7)
      samples.push({
        previewMs: a - t,
        compositionMs: b - a,
        fullMoveMs: c - b,
        fullConnectMs: d - c,
        replacedIds: patch.replacedIds.length,
      });
  }
  // Target change and return must not reuse another host's geometry.
  const changedTargetMs = [];
  for (const x of [10, 8]) {
    const candidate = candidateFor(x),
      point = candidate.worldPoint;
    const full = connectSnappedT(session, editAtPointer(session, base, point), point, candidate);
    const before = performance.now();
    const patch = prepared.evaluate(base, session.target, point, candidate);
    changedTargetMs.push(performance.now() - before);
    assert.deepEqual(
      storeyOf(patch.geometry).walls,
      storeyOf(full).walls.filter((w) => patch.replacedIds.includes(w.id)),
    );
    assert.deepEqual(
      canonical(selectionMoveSurfaces(solid, base, patch).faces),
      canonical(buildBuildingSolid(full).faces),
    );
  }
  const invalid = { ...candidateFor(8), sourceEntityId: "missing-host" };
  assert.throws(() =>
    connectSnappedT(
      session,
      editAtPointer(session, base, invalid.worldPoint),
      invalid.worldPoint,
      invalid,
    ),
  );
  assert.throws(() => prepared.evaluate(base, session.target, invalid.worldPoint, invalid));
  assert.throws(() =>
    prepared.evaluate({ ...base }, session.target, { x: 8, y: 0 }, candidateFor(8)),
  );
  const state = editingReducer(createEditingState(base), {
    type: "begin",
    target: session.target,
    action: "point",
    index: 1,
    anchor: session.anchor,
  });
  const point = { x: 8, y: 0 },
    candidate = candidateFor(8);
  const committed = editingReducer(state, {
    type: "confirm",
    session: state.session!,
    selection: session.target,
    point,
    candidate,
  });
  assert.equal(committed.error, "");
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(
    committed.history.present,
    connectSnappedT(session, editAtPointer(session, base, point), point, candidate),
  );
  assert.deepEqual(editingReducer(committed, { type: "undo" }).history.present, base);
  assert.deepEqual(
    editingReducer(editingReducer(committed, { type: "undo" }), { type: "redo" }).history.present,
    committed.history.present,
  );
  assert.deepEqual(base, original);
  runs.push({
    foreign,
    preparationMs,
    firstTargetMs,
    changedTargetMs,
    walls: storeyOf(base).walls.length,
    preview: summary(samples.map((s) => s.previewMs)),
    composition: summary(samples.map((s) => s.compositionMs)),
    fullMove: summary(samples.map((s) => s.fullMoveMs)),
    fullConnect: summary(samples.map((s) => s.fullConnectMs)),
    samples,
    checks:
      "exact project and composed faces; new relation exists; host switch/return; invalid host; stale context; full commit; one Undo/Redo; source unchanged",
  });
}
console.log(
  JSON.stringify(
    {
      node: process.version,
      platform: process.platform,
      cpu: os.cpus()[0]?.model,
      method:
        "7 warm + 21 measured fixed-target calls; prepare separately; preview/composition/full move/full connect sequentially; assertions outside timing; Node CPU only, not native/frame/GPU",
      runs,
    },
    null,
    2,
  ),
);
