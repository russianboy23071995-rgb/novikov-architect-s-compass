import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
import { hatchPointFixture } from "./hatch-point-fixture.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { tamperedState } from "./tampered-state.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
function prepareWindowAxisPreview(session: EditSession) {
  const prepared = prepareDirectEditPreview(session);
  assert.ok(prepared, "window-axis capability must be registered in the common entry");
  return prepared;
}
import {
  editAnchor,
  editAtPointer,
  type EditSession,
} from "../src/application/direct-edit/session.ts";
import { createProject } from "../src/application/projects/create.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { previewTConnection } from "../src/application/walls/t-connections.ts";
import {
  previewEdit,
  createEditingState,
  editingReducer,
} from "../src/application/direct-edit/controller.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../src/rendering/viewport/selection-move-preview.ts";
import { buildingWindowSelectionSurfaces } from "../src/rendering/viewport/window-selection.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { buildingViewFixture } from "./building-view-fixture.ts";

function joined(tee: boolean) {
  let p = addWall(createProject("p", "s"), {
    id: "host",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    height: 2.8,
    thickness: 0.36,
    bodyOffset: 0.18,
  });
  for (let i = 0; i < 2; i++) {
    const id = `other${i}`,
      x = tee ? 2 + i * 2 : i * 6;
    p = addWall(p, {
      id,
      start: { x, y: 0 },
      end: { x, y: 3 },
      height: 2.8,
      thickness: 0.36,
      bodyOffset: 0.18,
    });
    if (tee)
      p = previewTConnection(p, p, {
        projectId: p.id,
        kind: "connect",
        relation: { hostWallId: "host", incoming: { wallId: id, endpoint: 0 } },
      });
  }
  p = addWindow(p, {
    id: "window",
    wallId: "host",
    position: 0.5,
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
  });
  p = addWindow(p, {
    id: "neighbour-window",
    wallId: "other0",
    position: 0.5,
    width: 0.6,
    height: 1,
    sillHeight: 0.8,
  });
  return p;
}
const canonical = (faces: unknown[]) => faces.map((f) => JSON.stringify(f)).sort();

test("reused window basis stays unchanged across patches and refreshes from model/visibility", () => {
  const base = joined(true);
  const target = { kind: "window" as const, id: "window" };
  const session: EditSession = {
    base,
    target,
    action: "axis",
    index: null,
    anchor: editAnchor(base, target),
  };
  const prepared = prepareWindowAxisPreview(session);
  const basis = buildingWindowSelectionSurfaces(base, () => true);
  const original = structuredClone(basis);
  for (const x of [2, 3, 4, 2]) {
    const point = { x, y: 0 };
    const patch = prepared.evaluate(base, target, point);
    const shown = selectionMoveWindows(basis, base, patch, () => true);
    const full = editAtPointer(session, base, point);
    assert.deepEqual(
      canonical(shown),
      canonical(buildingWindowSelectionSurfaces(full, () => true)),
    );
    assert.deepEqual(basis, original); // Cancel can return the exact committed basis.
    // Connected neighbours can belong to the patch closure; compare their
    // geometry above, rather than requiring stationary object identity.
  }
  const changed = editAtPointer(session, base, { x: 4, y: 0 });
  assert.notDeepEqual(
    buildingWindowSelectionSurfaces(changed, () => true),
    basis,
  );
  const hiddenHost = buildingWindowSelectionSurfaces(changed, (id) => id !== "host");
  assert.deepEqual(
    hiddenHost.map((w) => w.id),
    ["neighbour-window"],
  );
  const hiddenWindow = buildingWindowSelectionSurfaces(changed, (id) => id !== "window");
  assert.deepEqual(
    hiddenWindow.map((w) => w.id),
    ["neighbour-window"],
  );
});
test("window patch matches full geometry, outlines and caps across corners, double T and storeys", () => {
  const multi = buildingViewFixture(2);
  multi.workingStoreyId = "s2";
  multi.storeys[2]!.walls[0]!.baseOffset = 0.4;
  const oblique = joined(true);
  for (const wall of storeyOf(oblique).walls)
    for (const point of [wall.start, wall.end]) {
      const x = point.x,
        y = point.y;
      point.x = x * Math.cos(0.7) - y * Math.sin(0.7);
      point.y = x * Math.sin(0.7) + y * Math.cos(0.7);
    }
  for (const p of [joined(false), joined(true), multi, oblique]) {
    const id = storeyOf(p).windows[0]!.id,
      target = { kind: "window" as const, id };
    const session: EditSession = {
      base: p,
      target,
      action: "axis",
      index: null,
      anchor: editAnchor(p, target),
    };
    const prepared = prepareWindowAxisPreview(session),
      solid = buildBuildingSolid(p),
      windows = buildingWindowSelectionSurfaces(p, () => true);
    for (const dx of [-100, -1, 0, 1, 100]) {
      const point = { x: session.anchor.x + dx, y: session.anchor.y + 9 };
      const full = editAtPointer(session, p, point),
        patch = prepared.evaluate(p, target, point);
      const materialized = prepared.materialize!(p, target, point);
      assert.deepEqual(materialized, full);
      assert.deepEqual(previewEdit(session, p, target, point), full);
      assert.deepEqual(
        derivePlanScene(materialized, () => true),
        derivePlanScene(full, () => true),
      );
      const derived = selectionMoveSurfaces(solid, p, patch);
      assert.deepEqual(canonical(derived.faces), canonical(buildBuildingSolid(full).faces));
      assert.deepEqual(
        selectionMoveWindows(windows, p, patch, () => true).sort((a, b) =>
          a.id.localeCompare(b.id),
        ),
        buildingWindowSelectionSurfaces(full, () => true).sort((a, b) => a.id.localeCompare(b.id)),
      );
      const unchanged = solid.faces.find((f) => !patch.replacedIds.includes(f.wallId));
      if (unchanged) assert.ok(derived.faces.includes(unchanged));
    }
    assert.throws(() => prepared.evaluate({ ...p }, target, session.anchor));
    assert.throws(() => prepared.evaluate(p, null, session.anchor));
    assert.throws(() => prepared.evaluate(p, target, { x: Infinity, y: 0 }));
  }
});
test("window preview never commits; confirmation validates whole project and creates one Undo", () => {
  let state = createEditingState(joined(true));
  const target = { kind: "window" as const, id: "window" };
  state = editingReducer(state, { type: "begin", target, action: "axis", index: null });
  const session = state.session!,
    base = state.history.present,
    prepared = prepareWindowAxisPreview(session);
  const point = { x: 4, y: 0 };
  prepared.evaluate(base, target, point);
  assert.deepEqual(prepared.materialize!(base, target, point), editAtPointer(session, base, point));
  assert.equal(editingReducer(state, { type: "cancel" }).history.present, base);
  assert.equal(state.history.past.length, 0);
  const committed = editingReducer(state, { type: "confirm", session, selection: target, point });
  assert.equal(committed.error, "");
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(committed.history.present, editAtPointer(session, base, point));
  assert.deepEqual(editingReducer(committed, { type: "undo" }).history.present, base);
  assert.throws(() => (storeyOf(base).walls[0]!.height = -1), TypeError);
  const tampered = tamperedState(state, (p) => (storeyOf(p).walls[0]!.height = -1));
  assert.notEqual(
    editingReducer(tampered.state, {
      type: "confirm",
      session: tampered.session,
      selection: target,
      point,
    }).error,
    "",
  );
});

test("common preview entry explicitly leaves unmigrated wall operations on the legacy path", () => {
  const base = joined(true);
  const target = { kind: "wall" as const, id: "host" };
  assert.equal(
    prepareDirectEditPreview({
      base,
      target,
      action: "move",
      index: null,
      anchor: editAnchor(base, target),
    }),
    null,
  );
  assert.throws(() =>
    prepareDirectEditPreview({
      base,
      target: { kind: "window", id: "missing" },
      action: "axis",
      index: null,
      anchor: { x: 0, y: 0 },
    }),
  );
});

test("window 2D materialization preserves foreign contents and snapshot ownership", () => {
  const base = joined(true),
    foreign = hatchPointFixture(2, 4);
  base.hatchPatterns = foreign.hatchPatterns;
  storeyOf(base).hatches = storeyOf(foreign).hatches;
  const target = { kind: "window" as const, id: "window" };
  const session: EditSession = {
    base,
    target,
    action: "axis",
    index: null,
    anchor: editAnchor(base, target),
  };
  const prepared = prepareWindowAxisPreview(session),
    point = { x: 4, y: 0 };
  const full = editAtPointer(session, base, point);
  assert.deepEqual(prepared.materialize!(base, target, point), full);
  assert.deepEqual(
    derivePlanScene(prepared.materialize!(base, target, point), () => true, base.hatchPatterns),
    derivePlanScene(full, () => true, base.hatchPatterns),
  );
  assert.throws(() => prepared.materialize!({ ...base }, target, point));
  assert.throws(() =>
    prepared.materialize!(base, { kind: "window", id: "neighbour-window" }, point),
  );
  assert.throws(() => prepared.materialize!(base, target, { x: NaN, y: 0 }));
  const output = prepared.materialize!(base, target, point);
  assert.throws(() => {
    storeyOf(output).windows[0]!.position = 0;
  });
  storeyOf(base).hatches[0]!.points[0]!.x = NaN;
  assert.deepEqual(prepared.materialize!(base, target, point), full);
});
