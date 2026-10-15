import { wallBody } from "../src/domain/elements/wall/body.ts";
import { previewEdit } from "../src/application/direct-edit/controller.ts";
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
  anchor: wallBody(storeyOf(base).walls.find((w) => w.id === id)!).corner(index, 1),
});
const canonical = (items: unknown[]) => items.map((i) => JSON.stringify(i)).sort();
function compare(
  p: Project,
  point: Point,
  candidate?: SnapCandidate,
  index: 0 | 1 = 1,
  id = "wall-1",
  anchor?: Point,
) {
  const session = { ...sessionOf(p, index, id), ...(anchor ? { anchor } : {}) },
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
    prepareEndpoint(p, id, index, { anchor: session.anchor, action: "point" }).evaluate(point)
      .project,
    editAtPointer(session, p, point),
    "legacy project preview must retain every stationary relation",
  );
  const materialized = prepared.materialize!(p, target, point);
  assert.deepEqual(materialized, editAtPointer(session, p, point));
  assert.deepEqual(previewEdit(session, p, target, point, candidate), full);
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
test("body point patches match full surfaces, windows and axes across local and full paths", () => {
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
    compare(validateProject(p), { x: 8, y: 0.36 });
    const session = sessionOf(p);
    const evaluate = () =>
      prepareEndpoint(p, "wall-1", 1, { anchor: session.anchor, action: "point" }).evaluate({
        x: 8,
        y: 0.36,
      });
    if (count === 1) assert.equal(evaluate().path, "full");
    else assert.throws(evaluate, /Mehrfachanschluss/);
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
    anchor: wallBody(storeyOf(p).walls[0]!).corner(1, 1),
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

test("body point preserves offset geometry with rotated walls and both side anchors", () => {
  const p = tPairFixture();
  const rotate = (point: Point): Point => ({
    x: point.x * Math.cos(0.7) - point.y * Math.sin(0.7),
    y: point.x * Math.sin(0.7) + point.y * Math.cos(0.7),
  });
  for (const wall of storeyOf(p).walls) {
    wall.start = rotate(wall.start);
    wall.end = rotate(wall.end);
  }
  validateProject(p);
  for (const index of [0, 1] as const) {
    const endpoint = storeyOf(p).walls.find((w) => w.id === "wall-1")![
      index === 0 ? "start" : "end"
    ];
    for (const offset of [0, 0.36]) {
      const anchor = {
        x: endpoint.x - Math.sin(0.7) * offset,
        y: endpoint.y + Math.cos(0.7) * offset,
      };
      for (const distance of [-2, 0, 2]) {
        const delta = rotate({ x: distance, y: 0.3 });
        compare(
          p,
          { x: anchor.x + delta.x, y: anchor.y + delta.y },
          undefined,
          index,
          "wall-1",
          anchor,
        );
      }
    }
  }
});
