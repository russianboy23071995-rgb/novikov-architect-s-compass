import test from "node:test";
import assert from "node:assert/strict";
import { wallPatchFixture } from "./wall-patch-fixture.ts";
import { tPairFixture } from "./t-pair-fixture.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { prepareEndpoint } from "../src/application/direct-edit/prepared-endpoint.ts";
import { editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { connectSnappedT } from "../src/application/walls/t-axis-snap.ts";
import { addWall, validateProject } from "../src/lib/bim/model.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { buildBuildingSolid, initialCamera } from "../src/lib/bim/geometry.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../src/rendering/viewport/selection-move-preview.ts";
import { buildingWindowSelectionSurfaces } from "../src/rendering/viewport/window-selection.ts";
import { selectedWallAxis } from "../src/rendering/viewport/wall-axis.ts";
import { createProjectionFrame } from "../src/geometry/projections/orthographic.ts";
import { createProjectionState } from "../src/rendering/viewport/projection-state.ts";
import type { Project, Point } from "../src/lib/bim/model.ts";
import type { SnapCandidate } from "../src/constraints/snapping/engine.ts";
const target = { kind: "wall" as const, id: "wall-1" };
const sessionOf = (base: Project, index: 0 | 1 = 1, id = "wall-1"): EditSession => ({
  base,
  target: { kind: "wall", id },
  action: "point",
  index,
  anchor: { ...storeyOf(base).walls.find((w) => w.id === id)![index === 0 ? "start" : "end"] },
});
const canonical = (items: unknown[]) => items.map((i) => JSON.stringify(i)).sort();
function compare(
  p: Project,
  point: Point,
  candidate?: SnapCandidate,
  index: 0 | 1 = 1,
  id = "wall-1",
) {
  const session = sessionOf(p, index, id),
    target = session.target,
    prepared = prepareDirectEditPreview(session)!;
  assert.ok(prepared);
  let full: Project;
  try {
    full = connectSnappedT(session, editAtPointer(session, p, point), point, candidate);
  } catch {
    assert.throws(() => prepared.evaluate(p, target, point, candidate));
    return;
  }
  assert.deepEqual(
    prepareEndpoint(p, id, index).evaluate(point).project,
    editAtPointer(session, p, point),
    "legacy project preview must retain every stationary relation",
  );
  const base = buildBuildingSolid(p),
    patch = prepared.evaluate(p, target, point, candidate);
  const derived = selectionMoveSurfaces(base, p, patch);
  assert.deepEqual(canonical(derived.faces), canonical(buildBuildingSolid(full).faces));
  assert.deepEqual(
    canonical(
      selectionMoveWindows(
        buildingWindowSelectionSurfaces(p, () => true),
        p,
        patch,
        () => true,
      ),
    ),
    canonical(buildingWindowSelectionSurfaces(full, () => true)),
  );
  for (const yaw of [0, 0.8]) {
    const view = createProjectionState(
      createProjectionFrame(base),
      { ...initialCamera, yaw },
      { left: 0, top: 0, width: 600, height: 400 },
      { width: 600, height: 400 },
    )!;
    assert.deepEqual(
      selectedWallAxis(p, target, () => true, view, patch),
      selectedWallAxis(full, target, () => true, view),
    );
  }
  const unchanged = base.faces.find((f) => !patch.replacedIds.includes(f.wallId));
  if (unchanged) assert.ok(derived.faces.includes(unchanged));
}
test("wall patches match full surfaces, windows and axes across local and full paths", () => {
  for (const p of [tPairFixture(), wallPatchFixture()]) {
    const anchor = sessionOf(p).anchor;
    for (const [dx, dy] of [
      [0, 0],
      [0.1, 0],
      [3, 0],
      [-4, 0],
      [2, 1],
      [-6, 0],
      [NaN, 0],
    ])
      compare(p, { x: anchor.x + dx!, y: anchor.y + dy! });
    const r = prepareEndpoint(p, target.id).evaluateGeometry({ x: anchor.x + 2, y: anchor.y });
    assert.equal(r.path, "local");
    assert.equal(storeyOf(r.patch.geometry).walls.length, 2);
    assert.equal(r.patch.replacedIds.length, 4);
  }
});
test("foreign endpoints, occupied nodes and snapped T targets retain full validation", () => {
  for (const count of [1, 2]) {
    const p = tPairFixture(),
      s = storeyOf(p);
    for (let i = 0; i < count; i++)
      s.walls.push({
        ...s.walls[0]!,
        id: `foreign${i}`,
        start: { x: 8, y: 0 },
        end: { x: 8, y: 3 + i },
      });
    compare(validateProject(p), { x: 8, y: 0 });
  }
  const p = tPairFixture(),
    s = storeyOf(p);
  s.walls.push({ ...s.walls[0]!, id: "new-host", start: { x: 8, y: -3 }, end: { x: 8, y: 3 } });
  compare(
    validateProject(p),
    { x: 8, y: 0 },
    {
      kind: "endpoint",
      worldPoint: { x: 8, y: 0 },
      sourceEntityId: "new-host",
      sourceFeature: "t-axis",
      distanceOnScreen: 0,
      priority: 0,
    },
  );
});
test("wall preview rejects stale context; cancel publishes nothing and commit remains full with one Undo", () => {
  const p = tPairFixture(),
    original = structuredClone(p);
  const state = editingReducer(createEditingState(p), {
    type: "begin",
    target,
    action: "point",
    index: 1,
    anchor: { x: 6, y: 0 },
  });
  const session = state.session!,
    base = state.history.present,
    prepared = prepareDirectEditPreview(session)!;
  const point = { x: 8, y: 0 };
  prepared.evaluate(base, target, point);
  assert.deepEqual(p, original);
  assert.throws(() => prepared.evaluate({ ...base }, target, point));
  assert.throws(() => prepared.evaluate(base, null, point));
  const cancelled = editingReducer(state, { type: "cancel" });
  assert.equal(cancelled.history, state.history);
  const committed = editingReducer(state, { type: "confirm", session, selection: target, point });
  assert.equal(committed.error, "");
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(committed.history.present, editAtPointer(session, base, point));
  assert.deepEqual(editingReducer(committed, { type: "undo" }).history.present, base);
  storeyOf(base).windows[0]!.width = 100;
  assert.notEqual(
    editingReducer(state, { type: "confirm", session, selection: target, point }).error,
    "",
  );
});

test("corner dependencies and double T retain stationary partner contours", () => {
  const corner = addWall(tPairFixture(), {
    id: "corner",
    start: { x: 6, y: 0 },
    end: { x: 6, y: 3 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0.18,
  });
  const doubleT = tPairFixture(),
    level = storeyOf(doubleT);
  level.walls.push({
    ...level.walls[1]!,
    id: "third",
    start: { x: 1, y: -3 },
    end: { x: 1, y: 0 },
  });
  level.wallTJunctions.push({ hostWallId: "wall-1", incoming: { wallId: "third", endpoint: 1 } });
  for (const p of [corner, validateProject(doubleT)])
    for (const point of [
      { x: 8, y: 0 },
      { x: 2, y: 0 },
      { x: 8, y: 1 },
    ])
      compare(p, point);
  assert.equal(prepareEndpoint(corner, "wall-1").evaluateGeometry({ x: 8, y: 0 }).path, "local");
});

test("both axis ends share local preview for shortening, oblique motion and detached neighbours", () => {
  for (const p of [tPairFixture(), wallPatchFixture()])
    for (const id of ["wall-1", "wall-2"])
      for (const index of [0, 1] as const) {
        const anchor = sessionOf(p, index, id).anchor;
        for (const [dx, dy] of [
          [-2, 0],
          [1.25, 0.45],
          [0, -1],
          [0.125, 0.875],
        ]) {
          const point = { x: anchor.x + dx!, y: anchor.y + dy! };
          compare(p, point, undefined, index, id);
        }
      }
  const p = tPairFixture();
  const shortened = prepareEndpoint(p, "wall-1").evaluateGeometry({ x: 2, y: 0 });
  assert.equal(shortened.path, "local");
  assert.equal(storeyOf(shortened.patch.geometry).wallTJunctions.length, 0);
  assert.ok(shortened.patch.replacedIds.includes("wall-2"));
  assert.equal(prepareEndpoint(p, "wall-1", 0).evaluateGeometry({ x: -2, y: 1 }).path, "local");
});

test("materialized relations preserve order across separate connected components", () => {
  const p = tPairFixture(),
    s = storeyOf(p);
  for (const w of [...s.walls])
    s.walls.push({
      ...w,
      id: `copy-${w.id}`,
      start: { x: w.start.x + 20, y: w.start.y },
      end: { x: w.end.x + 20, y: w.end.y },
    });
  s.wallTJunctions.push({
    hostWallId: "copy-wall-1",
    incoming: { wallId: "copy-wall-2", endpoint: 1 },
  });
  const valid = validateProject(p);
  compare(valid, { x: 8, y: 0 });
  compare(valid, { x: 2, y: 0 });
  compare(valid, { x: -2, y: 1 }, undefined, 0);
});

test("unconnected walls also use the shared axis endpoint capability", () => {
  const p = tPairFixture();
  storeyOf(p).wallTJunctions = [];
  for (const index of [0, 1] as const) {
    compare(p, { x: index === 0 ? -0.7 : 7.3, y: 0.9 }, undefined, index);
    assert.equal(
      prepareEndpoint(p, "wall-1", index).evaluateGeometry({ x: index === 0 ? -1 : 7, y: 0.5 })
        .path,
      "local",
    );
  }
});

function tTargetFixture() {
  const p = tPairFixture(),
    s = storeyOf(p);
  s.wallTJunctions = [];
  for (const x of [8, 10])
    s.walls.push({ ...s.walls[0]!, id: `host-${x}`, start: { x, y: -3 }, end: { x, y: 3 } });
  return validateProject(p);
}
const tCandidate = (x = 8): SnapCandidate => ({
  kind: "endpoint",
  worldPoint: { x, y: 0 },
  sourceEntityId: `host-${x}`,
  sourceFeature: "t-axis",
  distanceOnScreen: 0,
  priority: 0,
});

test("T target reuse is semantic, immutable and checked against the pinned context", () => {
  const p = tTargetFixture(),
    original = structuredClone(p),
    session = sessionOf(p);
  const preview = prepareDirectEditPreview(session)!;
  const first = preview.evaluate(p, target, { x: 8, y: 0 }, tCandidate());
  assert.equal(
    preview.evaluate(p, { ...target }, { x: 8, y: 0 }, { ...tCandidate(), priority: 9 }),
    first,
  );
  assert.throws(() => {
    storeyOf(first.geometry).walls[0]!.end.x = 100;
  });
  assert.throws(() => {
    (first.replacedIds as string[]).push("fake");
  });
  assert.throws(() => {
    first.geometry = { storey: storeyOf(p), assets: [] };
  });
  assert.ok(Object.isFrozen(first.storeyPatches));
  assert.ok(Object.isFrozen(first.storeyPatches![0]));
  assert.throws(() => preview.evaluate({ ...p }, target, { x: 8, y: 0 }, tCandidate()));
  assert.throws(() => preview.evaluate(p, null, { x: 8, y: 0 }, tCandidate()));
  assert.throws(() =>
    preview.evaluate(p, { kind: "window", id: target.id }, { x: 8, y: 0 }, tCandidate()),
  );
  assert.deepEqual(p, original);
  compare(p, { x: 8, y: 0 }, tCandidate());
});

test("T target cache retains at most one result and never masks invalid candidates", () => {
  const p = tTargetFixture(),
    preview = prepareDirectEditPreview(sessionOf(p))!;
  const run = (x = 8) => preview.evaluate(p, target, { x, y: 0 }, tCandidate(x));
  const first = run();
  const other = run(10);
  assert.notEqual(other, first);
  assert.equal(storeyOf(other.geometry).wallTJunctions[0]!.hostWallId, "host-10");
  const returned = run();
  assert.notEqual(returned, first);
  assert.deepEqual(returned, first);
  for (const candidate of [
    { ...tCandidate(), sourceEntityId: "missing" },
    { ...tCandidate(), sourceEntityId: null },
    { ...tCandidate(), worldPoint: { x: 10, y: 0 } },
  ]) {
    assert.throws(() => preview.evaluate(p, target, { x: 8, y: 0 }, candidate));
    assert.notEqual(run(), returned);
  }
  assert.throws(() => preview.evaluate(p, target, { x: 8, y: 1 }, tCandidate()));
  const warm = run();
  preview.evaluate(p, target, { x: 7, y: 0 });
  assert.notEqual(run(), warm, "leaving T snapping drops the result");
});

test("warm T preview cannot bypass full confirmation and cancellation owns no history", () => {
  const p = tTargetFixture();
  const state = editingReducer(createEditingState(p), {
    type: "begin",
    target,
    action: "point",
    index: 1,
    anchor: { x: 6, y: 0 },
  });
  const session = state.session!,
    base = state.history.present;
  const preview = prepareDirectEditPreview(session)!;
  const point = { x: 8, y: 0 },
    candidate = tCandidate();
  const patch = preview.evaluate(base, target, point, candidate);
  assert.equal(preview.evaluate(base, target, point, tCandidate()), patch);
  assert.equal(editingReducer(state, { type: "cancel" }).history, state.history);
  assert.notEqual(
    prepareDirectEditPreview(session)!.evaluate(base, target, point, candidate),
    patch,
  );
  const confirmed = editingReducer(state, {
    type: "confirm",
    session,
    selection: target,
    point,
    candidate,
  });
  assert.equal(confirmed.error, "");
  assert.equal(confirmed.history.past.length, 1);
  assert.deepEqual(
    confirmed.history.present,
    connectSnappedT(session, editAtPointer(session, base, point), point, candidate),
  );
  assert.deepEqual(editingReducer(confirmed, { type: "undo" }).history.present, base);
  assert.deepEqual(
    editingReducer(editingReducer(confirmed, { type: "undo" }), { type: "redo" }).history.present,
    confirmed.history.present,
  );
  storeyOf(base).windows[0]!.width = 100;
  const rejected = editingReducer(state, {
    type: "confirm",
    session,
    selection: target,
    point,
    candidate,
  });
  assert.notEqual(rejected.error, "");
  assert.equal(rejected.history, state.history);
});
