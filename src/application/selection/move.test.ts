import test from "node:test";
import assert from "node:assert/strict";
import {
  createProject,
  addWall,
  addWindow,
  serializeProject,
  deserializeProject,
} from "../../lib/bim/model.ts";
import { createDrawing, defaultHatchFill } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { beginSelectionMove, previewSelectionMove, selectionMoveInteraction } from "./move.ts";
import { selectionIndex } from "./state.ts";
import { previewTConnection } from "../walls/t-connections.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
import { confirmInteraction } from "../tools/interaction.ts";
import { connectedWallContours } from "../../domain/elements/wall/connections.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
const origin = { x: 0, y: 0 },
  target = { x: 2, y: -1 };
function fixture() {
  let p = createProject("p", "s");
  for (const [id, start, end] of [
    ["H", { x: 0, y: 0 }, { x: 6, y: 0 }],
    ["E", { x: 0, y: 0 }, { x: 0, y: 3 }],
    ["N", { x: 3, y: -3 }, { x: 3, y: 0 }],
  ] as const)
    p = addWall(p, { id, start, end, thickness: 0.36, height: 2.8, bodyOffset: 0.18 });
  p = previewTConnection(p, p, {
    projectId: p.id,
    kind: "connect",
    relation: { hostWallId: "H", incoming: { wallId: "N", endpoint: 1 } },
  });
  p = addWindow(p, {
    id: "F",
    wallId: "H",
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
    position: 0.5,
  });
  p = createDrawing(p, p, "L", {
    kind: "line",
    lineKind: "polyline",
    points: [
      { x: 0, y: 4 },
      { x: 2, y: 4 },
      { x: 2, y: 5 },
      { x: 0, y: 4 },
    ],
    appearance: defaultLineAppearance,
  });
  return createDrawing(p, p, "S", {
    kind: "hatch",
    points: [
      { x: 3, y: 4 },
      { x: 4, y: 4 },
      { x: 4, y: 5 },
    ],
    fill: defaultHatchFill,
  });
}
test("atomic mixed translation keeps internal corner/T, host window parameters and source snapshot", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()],
    before = serializeProject(p);
  const session = beginSelectionMove(p, targets, origin);
  const moved = previewSelectionMove(session, p, [...targets].reverse(), target);
  assert.deepEqual(moved.storey.wallJoins, p.storey.wallJoins);
  assert.deepEqual(moved.storey.wallTJunctions, p.storey.wallTJunctions);
  assert.deepEqual(moved.storey.windows, p.storey.windows);
  for (const wall of moved.storey.walls) {
    const old = p.storey.walls.find((w) => w.id === wall.id)!;
    assert.deepEqual(wall.start, { x: old.start.x + 2, y: old.start.y - 1 });
    assert.deepEqual(wall.end, { x: old.end.x + 2, y: old.end.y - 1 });
  }
  assert.deepEqual(moved.storey.lines![0]!.points[0], { x: 2, y: 3 });
  assert.deepEqual(moved.storey.hatches[0]!.points[0], { x: 5, y: 3 });
  const contours = connectedWallContours(moved);
  for (const [id, points] of connectedWallContours(p))
    points.forEach((point, i) => {
      assert.ok(Math.abs(contours.get(id)![i]!.x - point.x - 2) < 1e-9);
      assert.ok(Math.abs(contours.get(id)![i]!.y - point.y + 1) < 1e-9);
    });
  assert.equal(serializeProject(p), before);
});
test("only external relationships detach; unselected host windows follow exactly once", () => {
  const p = fixture(),
    all = [...selectionIndex(p).values()];
  for (const [ids, corners, tees] of [
    [["H", "E"], 1, 0],
    [["H", "N"], 0, 1],
    [["L", "S"], 1, 1],
  ] as const) {
    const targets = all.filter((t) => (ids as readonly string[]).includes(t.id));
    const next = previewSelectionMove(beginSelectionMove(p, targets, origin), p, targets, target);
    assert.equal(next.storey.wallJoins.length, corners);
    assert.equal(next.storey.wallTJunctions.length, tees);
    assert.deepEqual(next.storey.windows, p.storey.windows);
    for (const wall of p.storey.walls.filter((w) => !(ids as readonly string[]).includes(w.id)))
      assert.deepEqual(
        next.storey.walls.find((w) => w.id === wall.id),
        wall,
      );
  }
});
test("unsupported window mixtures, invalid IDs, duplicate IDs, stale selection/model and hidden layers fail atomically", () => {
  const p = fixture(),
    all = [...selectionIndex(p).values()],
    before = serializeProject(p);
  assert.throws(
    () =>
      beginSelectionMove(
        p,
        all.filter((t) => t.id === "F" || t.id === "L"),
        origin,
      ),
    /Fenster/,
  );
  assert.throws(() => beginSelectionMove(p, [{ kind: "wall", id: "missing" }], origin));
  assert.throws(() => beginSelectionMove(p, [all[0]!, all[0]!], origin));
  assert.throws(() => beginSelectionMove(p, [], origin));
  assert.throws(() => beginSelectionMove(p, all, { x: NaN, y: 0 }));
  const session = beginSelectionMove(p, all, origin);
  assert.throws(() => previewSelectionMove(session, { ...p }, all, target));
  assert.throws(() => previewSelectionMove(session, p, all.slice(1), target));
  assert.throws(() => previewSelectionMove(session, p, all, { x: Infinity, y: 0 }));
  assert.throws(() =>
    previewSelectionMove(
      session,
      p,
      all,
      target,
      createLayerVisibilityPolicy(p, {
        scope: { kind: "bim-project" },
        hiddenLayerIds: [p.storey.hatches[0]!.layerId],
      }),
    ),
  );
  assert.equal(serializeProject(p), before);
  assert.equal(previewSelectionMove(session, p, all, origin), p);
});
test("group snap policy excludes all moving geometry and host dependencies but pins common origin", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()].filter((t) => ["H", "E"].includes(t.id));
  const s = beginSelectionMove(p, targets, origin);
  const refs = ["H", "E", "F", "N", "L"].map((entityId) => ({
    entityId,
    feature: "start",
    point: origin,
  }));
  assert.deepEqual(
    s.snapping.sources(refs).map((r) => r.entityId),
    ["N", "L"],
  );
  assert.equal(
    s.snapping.sources([
      {
        entityId: "intersection",
        feature: "point",
        point: origin,
        dependencies: [refs[0]!, refs[3]!],
      },
    ]).length,
    0,
  );
  assert.deepEqual(s.snapping.origin.point, origin);
});
test("shared input and click produce same snapshot, one undo/redo, zero displacement has no history", async () => {
  const history = createHistory(fixture()),
    p = history.present,
    targets = [...selectionIndex(p).values()];
  const session = beginSelectionMove(p, targets, origin);
  let result = p;
  const adapter = selectionMoveInteraction(
    session,
    p,
    targets,
    createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    (next) => {
      result = next;
    },
    () => {},
  );
  const numeric = adapter.preview("90", "2", null);
  confirmInteraction(adapter, numeric.point);
  assert.deepEqual(result, previewSelectionMove(session, p, targets, numeric.point));
  const committed = commitProject(history, result);
  assert.equal(committed.past.length, 1);
  assert.deepEqual(undoProject(committed).present, p);
  assert.deepEqual(redoProject(undoProject(committed)).present, result);
  assert.equal(commitProject(history, previewSelectionMove(session, p, targets, origin)), history);
  const restored = deserializeProject(serializeProject(result));
  assert.deepEqual(buildSolid(restored), buildSolid(result));
  const stamp = new Date("2026-10-06T12:00:00Z");
  assert.equal(await exportIfc(restored, stamp), await exportIfc(result, stamp));
});
