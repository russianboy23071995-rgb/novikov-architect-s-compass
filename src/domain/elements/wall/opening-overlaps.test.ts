import test from "node:test";
import assert from "node:assert/strict";
import { addWindow } from "../../../application/windows/actions.ts";
import { createProject } from "../../../application/projects/create.ts";
import { addWall, updateWall } from "../../../application/walls/actions.ts";
import { addDoor, updateDoor } from "../../../application/doors/actions.ts";
import { DOOR_DEFAULTS, type Door } from "../door/model.ts";
import { storeyOf } from "../../storeys/access.ts";
import { openingOverlaps } from "./opening-overlaps.ts";
import {
  openingOverlapHintFor,
  patchOverlapHint,
  previewOverlapHint,
} from "../../../application/openings/overlap-hint.ts";
import { previewSelectionCommand } from "../../../application/commands/selection-command.ts";
import { createLayerVisibilityPolicy } from "../../../application/layers/visibility.ts";
import { prepareDirectEditPreview } from "../../../application/direct-edit/prepared-preview.ts";
import { editAnchor } from "../../../lib/bim/direct-edit.ts";
import { derivePlanScene } from "../../../rendering/viewport/plan-scene.ts";
import type { Project } from "../../project/schema.ts";

/** 6 m wall: window 2.4–3.6 m at 0.9–2.1 m height; a second 6 m wall without openings. */
function base(): Project {
  let p = createProject("p", "eg");
  for (const [id, y] of [
    ["w", 0],
    ["v", 3],
  ] as const)
    p = addWall(p, {
      id,
      start: { x: 0, y },
      end: { x: 6, y },
      thickness: 0.24,
      height: 2.8,
    });
  return addWindow(p, {
    id: "f",
    wallId: "w",
    position: 0.5,
    width: 1.2,
    height: 1.2,
    sillHeight: 0.9,
  });
}
const door = (
  p: Project,
  centre: number,
  changes: Partial<Pick<Door, "width" | "height" | "zOffset">> = {},
  wallId = "w",
) => addDoor(p, { id: "d", wallId, position: centre / 6, ...DOOR_DEFAULTS, ...changes });

test("openings overlap only when they intersect along the wall and in height", () => {
  // Door 2.0–3.01 m from the floor to 2.135 m overlaps the window.
  assert.deepEqual(openingOverlaps(storeyOf(door(base(), 2.505))), [
    { wallId: "w", first: "f", second: "d" },
  ]);
  // Touching edge at 2.4 m: no overlap.
  assert.deepEqual(openingOverlaps(storeyOf(door(base(), 2.4 - 1.01 / 2))), []);
  // Same position on another wall: no overlap.
  assert.deepEqual(openingOverlaps(storeyOf(door(base(), 3, {}, "v"))), []);
  // Transom: window above a low door at the same position does not overlap.
  assert.deepEqual(openingOverlaps(storeyOf(door(base(), 3, { height: 0.9 }))), []);
  // Two windows overlap as well; overlaps stay valid models (no rejection).
  const twoWindows = addWindow(base(), {
    id: "g",
    wallId: "w",
    position: 0.55,
    width: 1,
    height: 1,
    sillHeight: 1,
  });
  assert.deepEqual(openingOverlaps(storeyOf(twoWindows)), [
    { wallId: "w", first: "f", second: "g" },
  ]);
});

test("door heights are compared above the wall foot, including z offset and raised walls", () => {
  const raised = updateWall(base(), "w", { baseOffset: 0.3 });
  // Door 0.3 above the storey on a wall raised by 0.3 starts at the wall foot: overlaps.
  assert.equal(openingOverlaps(storeyOf(door(raised, 3, { zOffset: 0.3, height: 1 }))).length, 1);
  // A low door below the window sill (0.3–1.2 above the storey = 0–0.9 above the foot): none.
  assert.equal(openingOverlaps(storeyOf(door(raised, 3, { zOffset: 0.3, height: 0.9 }))).length, 0);
});

test("preview hints name only new or changed openings and never alter the result", () => {
  const p = base(),
    placed = door(p, 2.505);
  assert.equal(previewOverlapHint(p, placed), "Hinweis: Fenster f überlappt Tür d");
  assert.equal(previewOverlapHint(placed, placed), "");
  assert.equal(openingOverlapHintFor(placed, "d"), "Hinweis: Fenster f überlappt Tür d");
  assert.equal(openingOverlapHintFor(placed, "f"), "Hinweis: Fenster f überlappt Tür d");
  // An unrelated change keeps the existing overlap out of the preview hint.
  const widened = updateWall(placed, "v", { thickness: 0.3 });
  assert.equal(previewOverlapHint(placed, widened), "");
  // Moving the door away clears the hint.
  assert.equal(previewOverlapHint(placed, updateDoor(placed, "d", { position: 0.2 })), "");
});

test("command summary, opening-axis patch and plan carry the hint", () => {
  const placed = door(base(), 1.5);
  const visibility = createLayerVisibilityPolicy(placed, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const target = { kind: "door" as const, id: "d" };
  const preview = previewSelectionCommand(placed, [target], visibility, "Türbreite auf 2 m");
  assert.match(preview.summary, /Türbreite: 1,01 → 2 m · Hinweis: Fenster f überlappt Tür d$/);
  const plain = previewSelectionCommand(placed, [target], visibility, "Türbreite auf 1 m");
  assert.doesNotMatch(plain.summary, /Hinweis/);
  const session = {
    base: placed,
    target,
    action: "axis" as const,
    index: null,
    anchor: editAnchor(placed, target),
  };
  const patch = prepareDirectEditPreview(session)!.evaluate(placed, target, {
    x: 2.6,
    y: session.anchor.y,
  });
  assert.equal(patchOverlapHint(placed, patch), "Hinweis: Fenster f überlappt Tür d");
  assert.deepEqual([...derivePlanScene(placed, () => true).overlapping], []);
  assert.deepEqual([...derivePlanScene(preview.result, () => true).overlapping], ["f", "d"]);
});
