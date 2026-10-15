import test from "node:test";
import assert from "node:assert/strict";
import { selectionZInteraction } from "./z-interaction.ts";
import { beginSelectionMove } from "./move.ts";
import { createProject, addWall, addWindow } from "../../lib/bim/model.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { ALL_LAYERS_VISIBLE, createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import { selectionMoveSurfaces } from "../../rendering/viewport/selection-move-preview.ts";
import { validateProject } from "../../domain/project/schema.ts";

test("Z input adapter preserves connected group/windows, detaches external neighbour, and commits one undo", () => {
  let p = createProject("z-input", "eg");
  for (const [id, start, end] of [
    ["host", { x: 0, y: 0 }, { x: 10, y: 0 }],
    ["branch", { x: 3, y: -3 }, { x: 3, y: 0 }],
    ["stationary", { x: 7, y: -3 }, { x: 7, y: 0 }],
  ] as const)
    p = addWall(p, { id, start, end, height: 2.8, thickness: 0.36 });
  p = addWindow(p, {
    id: "opening",
    wallId: "host",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  p = validateProject({
    ...p,
    storeys: p.storeys.map((s) => ({
      ...s,
      wallTJunctions: [
        { hostWallId: "host", incoming: { wallId: "branch", endpoint: 1 } },
        { hostWallId: "host", incoming: { wallId: "stationary", endpoint: 1 } },
      ],
    })),
  });
  let history = createHistory(p);
  p = history.present;
  const targets = [
    { kind: "wall", id: "host" },
    { kind: "wall", id: "branch" },
  ] as const;
  const visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const session = beginSelectionMove(p, targets, { x: 3, y: 0 }, visibility);
  let commits = 0,
    cancelled = false;
  const adapter = selectionZInteraction(
    session,
    visibility,
    (next) => {
      history = commitProject(history, next);
      commits++;
    },
    () => {
      cancelled = true;
    },
  );
  assert.throws(() => adapter.preview("", "NaN", null));
  assert.throws(() => adapter.preview("", "Infinity", null));
  const value = adapter.preview("", "-0,5", null);
  const patch = adapter.geometryPreview!.evaluate(value.point);
  assert.equal(commits, 0);
  confirmInteraction(adapter, value.point);
  assert.equal(commits, 1);
  assert.deepEqual(
    selectionMoveSurfaces(buildBuildingSolid(p), p, patch).faces,
    buildBuildingSolid(history.present).faces,
  );
  assert.equal(history.present.storeys[0]!.walls[0]!.baseOffset, -0.5);
  assert.equal(history.present.storeys[0]!.walls[1]!.baseOffset, -0.5);
  assert.deepEqual(history.present.storeys[0]!.walls[2], p.storeys[0]!.walls[2]);
  assert.deepEqual(history.present.storeys[0]!.windows, p.storeys[0]!.windows);
  assert.equal(history.present.storeys[0]!.wallTJunctions.length, 1);
  assert.deepEqual(undoProject(history).present, p);
  assert.deepEqual(redoProject(undoProject(history)).present, history.present);
  adapter.cancel();
  assert.equal(cancelled, true);
  assert.equal(commits, 1);
});
