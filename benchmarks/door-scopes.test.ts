import test from "node:test";
import assert from "node:assert/strict";
import { prepareEndpoint } from "./prepared-endpoint.ts";
import { boundHeightFixture } from "./bound-height-fixture.ts";
import { fullSelectionMove } from "./selection-move-oracle.ts";
import { createProject } from "../src/application/projects/create.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { addWall, updateWall } from "../src/application/walls/actions.ts";
import { createHistory, undoProject } from "../src/application/history/project-history.ts";
import { previewTConnection } from "../src/application/walls/t-connections.ts";
import { prepareSelectionTranslation } from "../src/application/selection/storey-translation.ts";
import { prepareZTranslation } from "../src/application/selection/z-translation.ts";
import { addDoor } from "../src/application/doors/actions.ts";
import { DOOR_DEFAULTS } from "../src/domain/elements/door/model.ts";
import { sameProjectContent } from "../src/domain/project/model-equality.ts";
import { buildBuildingSolid } from "../src/rendering/viewport/building-solid.ts";
import { buildPreviewSolid } from "../src/rendering/viewport/storey-solid.ts";
import {
  selectionMoveSurfaces,
  selectionMoveWindows,
} from "../src/rendering/viewport/selection-move-preview.ts";
import { buildingWindowSelectionSurfaces } from "../src/rendering/viewport/window-selection.ts";
import { storeyOf } from "../src/domain/storeys/access.ts";
import type { Project } from "../src/domain/project/schema.ts";

/** Host with a door and a window, two neighbours (free or T-connected), a neighbour door. */
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
      x = tee ? 2 + i * 2 : i * 8 - 1;
    p = addWall(p, {
      id,
      start: { x, y: tee ? 0 : 1 },
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
  p = addDoor(p, { id: "door", wallId: "host", position: 0.15, ...DOOR_DEFAULTS, zOffset: 0.05 });
  return addDoor(p, { id: "neighbour-door", wallId: "other0", position: 0.6, ...DOOR_DEFAULTS });
}
const canonical = (faces: unknown[]) => faces.map((f) => JSON.stringify(f)).sort();
const byId = <T extends { id: string }>(items: T[]) =>
  items.sort((a, b) => a.id.localeCompare(b.id));
const openings = (p: Project) => byId(buildingWindowSelectionSurfaces(p, () => true));

test("wall endpoint preview keeps door openings of the dependency scope (local and full path)", () => {
  for (const [p, id] of [
    [hosted(true), "other0"],
    [hosted(true), "host"],
    [hosted(false), "host"],
  ] as const) {
    const pilot = prepareEndpoint(p, id),
      wall = storeyOf(p).walls.find((w) => w.id === id)!;
    const scope = new Set(pilot.evaluateGeometry(wall.end).patch.replacedIds);
    for (const door of storeyOf(p).doors!)
      assert.equal(scope.has(door.id), scope.has(door.wallId), door.id);
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const along = (d: number) => ({
      x: wall.end.x + ((wall.end.x - wall.start.x) / length) * d,
      y: wall.end.y + ((wall.end.y - wall.start.y) / length) * d,
    });
    // Axial stretch keeps T connections rectangular; both directions, including shortening.
    for (const point of [along(0.5), along(-0.4)]) {
      const full = updateWall(p, id, { end: point });
      const result = pilot.evaluateGeometry(point);
      const ids = new Set(result.patch.replacedIds);
      assert.deepEqual(
        canonical(buildPreviewSolid(result.patch.geometry, 0).faces),
        canonical(buildPreviewSolid(full, 0).faces.filter((f) => ids.has(f.wallId))),
      );
      assert.deepEqual(
        byId(
          selectionMoveWindows(
            buildingWindowSelectionSurfaces(p, () => true),
            p,
            result.patch,
            () => true,
          ),
        ),
        openings(full),
      );
      assert.deepEqual(pilot.evaluate(point).project, full);
      assert.deepEqual(pilot.confirm(point), full);
    }
  }
});

test("XY selection move preview carries hosted doors and equals the full move", () => {
  const p = hosted(false);
  for (const ids of [["host"], ["host", "other0"], ["other0", "other1"]]) {
    const action = prepareSelectionTranslation(p, ids),
      delta = { x: 0.5, y: -0.2 };
    const next = action.materialize(p, delta);
    const oracle = fullSelectionMove(
      p,
      ids.map((id) => ({ kind: "wall" as const, id })),
      delta,
    );
    assert.equal(sameProjectContent(next, oracle), true);
    const preview = action.evaluate(delta);
    for (const door of storeyOf(p).doors!)
      assert.equal(preview.replacedIds.includes(door.id), ids.includes(door.wallId), door.id);
    assert.deepEqual(
      canonical(selectionMoveSurfaces(buildBuildingSolid(p), p, preview).faces),
      canonical(buildBuildingSolid(next).faces),
    );
    assert.deepEqual(
      byId(
        selectionMoveWindows(
          buildingWindowSelectionSurfaces(p, () => true),
          p,
          preview,
          () => true,
        ),
      ),
      openings(next),
    );
  }
});

test("Z move takes doors along: z offset follows the wall base, preview equals commit", () => {
  const h = createHistory(hosted(true)),
    p = h.present;
  const targets = [
    { kind: "wall", id: "host" },
    { kind: "wall", id: "other0" },
    { kind: "wall", id: "other1" },
  ] as const;
  const action = prepareZTranslation(p, targets);
  for (const dz of [-0.4, 0, 0.7]) {
    const preview = action.evaluate(p, targets, dz),
      next = action.materialize(p, targets, dz);
    for (const door of storeyOf(next).doors!) {
      const before = storeyOf(p).doors!.find((d) => d.id === door.id)!;
      assert.ok(Math.abs(door.zOffset - (before.zOffset + dz)) < 1e-12, door.id);
    }
    assert.deepEqual(
      canonical(selectionMoveSurfaces(buildBuildingSolid(p), p, preview).faces),
      canonical(buildBuildingSolid(next).faces),
    );
    assert.deepEqual(
      byId(
        selectionMoveWindows(
          buildingWindowSelectionSurfaces(p, () => true),
          p,
          preview,
          () => true,
        ),
      ),
      openings(next),
    );
  }
  const committed = action.commit(h, targets, 0.7);
  assert.equal(committed.past.length, 1);
  assert.equal(undoProject(committed).present, p);
});

test("Z move leaves doors of stationary walls unchanged", () => {
  const p = hosted(false),
    host = [{ kind: "wall", id: "host" }] as const;
  const next = prepareZTranslation(p, host).materialize(p, host, 0.3);
  assert.deepEqual(
    storeyOf(next).doors!.find((d) => d.id === "neighbour-door"),
    storeyOf(p).doors!.find((d) => d.id === "neighbour-door"),
  );
  assert.ok(Math.abs(storeyOf(next).doors!.find((d) => d.id === "door")!.zOffset - 0.35) < 1e-12);
});

test("Z move of a slab-bound wall takes its door along on every storey", () => {
  let p = boundHeightFixture();
  for (const floor of ["eg", "og"])
    p = addDoor(
      { ...p, workingStoreyId: floor },
      { id: floor + "-door", wallId: floor + "-b", position: 0.5, ...DOOR_DEFAULTS, height: 2.5 },
    );
  const targets = [
    { kind: "wall", id: "eg-a" },
    { kind: "wall", id: "eg-b" },
    { kind: "wall", id: "og-a" },
    { kind: "wall", id: "og-b" },
  ] as const;
  const action = prepareZTranslation(p, targets);
  for (const dz of [-0.2, 0.15]) {
    const preview = action.evaluate(p, targets, dz),
      next = action.materialize(p, targets, dz);
    assert.equal(preview.storeyPatches!.length, 2);
    for (const floor of ["eg", "og"]) {
      const door = next.storeys.find((s) => s.id === floor)!.doors![0]!;
      assert.ok(Math.abs(door.zOffset - dz) < 1e-12, floor);
    }
    assert.deepEqual(
      canonical(selectionMoveSurfaces(buildBuildingSolid(p), p, preview).faces),
      canonical(buildBuildingSolid(next).faces),
    );
  }
});
