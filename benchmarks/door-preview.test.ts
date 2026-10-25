import test from "node:test";
import assert from "node:assert/strict";
import { derivePlanScene } from "../src/rendering/viewport/plan-scene.ts";
import { prepareDirectEditPreview } from "../src/application/direct-edit/prepared-preview.ts";
import { editAnchor, editAtPointer, type EditSession } from "../src/lib/bim/direct-edit.ts";
import { createProject } from "../src/application/projects/create.ts";
import { addWindow, updateWindow } from "../src/application/windows/actions.ts";
import { addWall } from "../src/application/walls/actions.ts";
import { previewTConnection } from "../src/application/walls/t-connections.ts";
import {
  previewEdit,
  createEditingState,
  editingReducer,
} from "../src/application/direct-edit/controller.ts";
import { numericMoveAxis } from "../src/application/direct-edit/numeric.ts";
import {
  moveOpeningAlongWall,
  moveWindowAlongWall,
} from "../src/application/direct-edit/transforms.ts";
import { boundedWindowPosition } from "../src/domain/elements/wall/window-range.ts";
import { buildBuildingSolid } from "../src/lib/bim/geometry.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../src/rendering/viewport/selection-move-preview.ts";
import { buildingWindowSelectionSurfaces } from "../src/rendering/viewport/window-selection.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import { wallLength } from "../src/domain/project/schema.ts";
import { addDoor } from "../src/application/doors/actions.ts";
import { DOOR_DEFAULTS } from "../src/domain/elements/door/model.ts";
import type { Project } from "../src/domain/project/schema.ts";

/** Host with a door and a window, two connected neighbours (corner or T), and a door on a
 * neighbour: every opening of the dependency scope must keep cutting during a preview. */
function hosted(tee: boolean): Project {
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
    position: 0.75,
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
  });
  p = addDoor(p, { id: "door", wallId: "host", position: 0.25, ...DOOR_DEFAULTS, zOffset: 0.05 });
  return addDoor(p, { id: "neighbour-door", wallId: "other0", position: 0.5, ...DOOR_DEFAULTS });
}
const canonical = (faces: unknown[]) => faces.map((f) => JSON.stringify(f)).sort();
const byId = <T extends { id: string }>(items: T[]) =>
  items.sort((a, b) => a.id.localeCompare(b.id));
const session = (p: Project, kind: "window" | "door", id: string): EditSession => {
  const target = { kind, id };
  return { base: p, target, action: "axis", index: null, anchor: editAnchor(p, target) };
};

test("door and window share one along-wall move; the window result is unchanged", () => {
  const p = hosted(false),
    host = storeyOf(p).walls.find((w) => w.id === "host")!,
    window = storeyOf(p).windows[0]!;
  // Equality with the former window-only rule (position + distance / length, bounded).
  for (const distance of [-100, -0.4, 0, 0.3, 100])
    assert.deepEqual(
      moveWindowAlongWall(p, "window", distance),
      updateWindow(p, "window", {
        position: boundedWindowPosition(
          p,
          host,
          window.width,
          window.position + distance / wallLength(host),
        ),
      }),
    );
  const moved = moveOpeningAlongWall(p, { kind: "door", id: "door" }, 0.6);
  const door = storeyOf(moved).doors!.find((d) => d.id === "door")!;
  assert.ok(Math.abs(door.position - (0.25 + 0.6 / 6)) < 1e-12);
  assert.deepEqual(
    { ...door, position: 0.25 },
    storeyOf(p).doors!.find((d) => d.id === "door"),
  );
  const clamped = moveOpeningAlongWall(p, { kind: "door", id: "door" }, -100);
  assert.ok(storeyOf(clamped).doors![0]!.position * 6 >= DOOR_DEFAULTS.width / 2);
  assert.throws(() => moveOpeningAlongWall(p, { kind: "door", id: "door" }, NaN), /endlicher/);
  assert.throws(() => moveOpeningAlongWall(p, { kind: "door", id: "missing" }, 0), /Tür/);
});

test("a door gesture anchors at its centre and follows only the wall direction", () => {
  const p = hosted(false),
    s = session(p, "door", "door");
  // Centre on the wall reference line, shifted by the wall body offset like windows.
  assert.deepEqual(s.anchor, { x: 1.5, y: 0.18 });
  const along = editAtPointer(s, p, { x: 2.1, y: 0 }),
    across = editAtPointer(s, p, { x: 2.1, y: 7 });
  assert.deepEqual(across, along);
  assert.ok(Math.abs(storeyOf(along).doors![0]!.position - 2.1 / 6) < 1e-12);
});

test("door patch matches full geometry, plan, outlines and caps across corners, T and storeys", () => {
  const oblique = hosted(true);
  for (const wall of storeyOf(oblique).walls)
    for (const point of [wall.start, wall.end]) {
      const x = point.x,
        y = point.y;
      point.x = x * Math.cos(0.7) - y * Math.sin(0.7);
      point.y = x * Math.sin(0.7) + y * Math.cos(0.7);
    }
  for (const p of [hosted(false), hosted(true), oblique])
    for (const [kind, id] of [
      ["door", "door"],
      ["door", "neighbour-door"],
      ["window", "window"],
    ] as const) {
      const s = session(p, kind, id),
        target = s.target;
      const prepared = prepareDirectEditPreview(s);
      assert.ok(prepared?.materialize, "opening-axis capability must be registered");
      const solid = buildBuildingSolid(p),
        openings = buildingWindowSelectionSurfaces(p, () => true);
      for (const dx of [-100, -1, 0, 1, 100]) {
        const point = { x: s.anchor.x + dx, y: s.anchor.y + 9 };
        const full = editAtPointer(s, p, point),
          patch = prepared.evaluate(p, target, point);
        const materialized: Project = prepared.materialize(p, target, point);
        assert.deepEqual(materialized, full);
        assert.deepEqual(previewEdit(s, p, target, point), full);
        assert.deepEqual(
          derivePlanScene(materialized, () => true),
          derivePlanScene(full, () => true),
        );
        assert.deepEqual(
          canonical(selectionMoveSurfaces(solid, p, patch).faces),
          canonical(buildBuildingSolid(full).faces),
        );
        assert.deepEqual(
          byId(selectionMoveWindows(openings, p, patch, () => true)),
          byId(buildingWindowSelectionSurfaces(full, () => true)),
        );
      }
      assert.throws(() => prepared.evaluate({ ...p }, target, s.anchor));
      assert.throws(() =>
        prepared.evaluate(p, { kind: kind === "door" ? "window" : "door", id }, s.anchor),
      );
      assert.throws(() => prepared.evaluate(p, target, { x: Infinity, y: 0 }));
    }
});

test("door preview never commits; confirmation validates the whole project and is one Undo", () => {
  let state = createEditingState(hosted(true));
  const target = { kind: "door" as const, id: "door" };
  state = editingReducer(state, { type: "begin", target, action: "axis", index: null });
  const s = state.session!,
    base = state.history.present;
  // Like windows: no free numeric axis, the mouse gesture stays bound to the host wall.
  assert.equal(numericMoveAxis(s), null);
  prepareDirectEditPreview(s)!.evaluate(base, target, { x: 3, y: 0 });
  assert.equal(state.history.present, base);
  state = editingReducer(state, {
    type: "confirm",
    session: s,
    selection: target,
    point: { x: 3, y: 0 },
  });
  assert.equal(state.error, "");
  assert.ok(Math.abs(storeyOf(state.history.present).doors![0]!.position - 0.5) < 1e-12);
  state = editingReducer(state, { type: "undo" });
  assert.equal(state.history.present, base);
});
