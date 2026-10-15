import test from "node:test";
import assert from "node:assert/strict";
import { prepareWindowAxisPreview } from "../src/application/direct-edit/prepared-window.ts";
import { editAnchor, editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { createProject, addWall, addWindow } from "../src/lib/bim/model.ts";
import { previewTConnection } from "../src/application/walls/t-connections.ts";
import { createEditingState, editingReducer } from "../src/application/direct-edit/controller.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
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
test("window patch matches full geometry, outlines and caps across corners, double T and storeys", () => {
  const multi = buildingViewFixture(2);
  multi.workingStoreyId = "s2";
  multi.storeys[2]!.walls[0]!.baseOffset = 0.4;
  for (const p of [joined(false), joined(true), multi]) {
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
  assert.equal(state.history.past.length, 0);
  const committed = editingReducer(state, { type: "confirm", session, selection: target, point });
  assert.equal(committed.error, "");
  assert.equal(committed.history.past.length, 1);
  assert.deepEqual(committed.history.present, editAtPointer(session, base, point));
  assert.deepEqual(editingReducer(committed, { type: "undo" }).history.present, base);
  storeyOf(base).walls[0]!.height = -1;
  assert.notEqual(
    editingReducer(state, { type: "confirm", session, selection: target, point }).error,
    "",
  );
});
