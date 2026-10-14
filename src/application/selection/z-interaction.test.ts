import test from "node:test";
import assert from "node:assert/strict";
import { zMoveInteraction } from "./z-interaction.ts";
import { createProject, addWall } from "../../lib/bim/model.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import { createHistory, commitProject, undoProject } from "../../lib/bim/history.ts";
import { axisPointerDistance } from "../../rendering/viewport/axis-pointer.ts";
import { createProjectionState } from "../../rendering/viewport/projection-state.ts";

test("Z mouse and signed precision input share the action and one undo", () => {
  const p = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 3, y: 0 },
    thickness: 0.36,
    height: 2.8,
  });
  let history = createHistory(p),
    cancelled = false;
  const adapter = zMoveInteraction(
    p,
    [{ kind: "wall", id: "w" }],
    createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    (next) => {
      history = commitProject(history, next);
    },
    () => {
      cancelled = true;
    },
  );
  assert.equal(adapter.preview("", "-0,5", null).point.x, -0.5);
  assert.equal(adapter.preview("", "", { x: 0.75, y: 0 }).metres, 0.75);
  assert.throws(() => adapter.preview("", "Infinity", null));
  assert.throws(() => confirmInteraction(adapter, { x: 1, y: 1 }));
  adapter.cancel();
  assert.equal(cancelled, true);
  assert.deepEqual(history.present, p);
  confirmInteraction(adapter, adapter.preview("", "-0,5", null).point);
  assert.equal(history.present.storeys[0]!.walls[0]!.baseOffset, -0.5);
  assert.deepEqual(undoProject(history).present, p);
});
test("Axis projection preserves sign, ignores transverse mouse distance, rejects view alignment", () => {
  for (const pitch of [-0.6, 0, 0.7]) {
    const p = createProjectionState(
      { center: [0, 0, 0], radius: 5 },
      { yaw: 0.7, pitch, zoom: 1, panX: 0, panY: 0 },
      { left: 10, top: 20, width: 800, height: 600 },
      { width: 800, height: 600 },
    )!;
    const origin = [2, 3, 7] as const;
    for (const delta of [-2, 0, 3]) {
      const point = p.project([2, 3, 7 + delta]);
      const client = { x: 10 + (point[0] + 1) * 400 + 100, y: 20 + (1 - point[1]) * 300 };
      assert.ok(Math.abs(axisPointerDistance(p, origin, [0, 0, 1], client)! - delta) < 1e-10);
    }
  }
  const top = createProjectionState(
    { center: [0, 0, 0], radius: 5 },
    { yaw: 0, pitch: Math.PI / 2, zoom: 1, panX: 0, panY: 0 },
    { left: 0, top: 0, width: 800, height: 600 },
    { width: 800, height: 600 },
  )!;
  assert.equal(axisPointerDistance(top, [0, 0, 0], [0, 0, 1], { x: 100, y: 200 }), null);
});
