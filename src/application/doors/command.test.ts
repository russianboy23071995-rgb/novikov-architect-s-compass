import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { addWall, createProject } from "../../lib/bim/model.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { addDoor } from "./actions.ts";
import { previewDoorCommand } from "./command.ts";
import { previewSelectionCommand } from "../commands/selection-command.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";

function project() {
  const walled = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
  return addDoor(walled, { id: "d", wallId: "w", position: 0.3, ...DOOR_DEFAULTS });
}
const door = { kind: "door", id: "d" } as const;
const run = (text: string) => {
  const p = project();
  return storeyOf(previewDoorCommand(p, door, text)!.result).doors![0]!;
};

test("door measures accept m, cm and mm with a comma or point", () => {
  assert.equal(run("Türbreite auf 1,26 m").width, 1.26);
  assert.equal(run("setze Türhöhe 226 cm").height, 2.26);
  assert.equal(run("Z-Versatz auf 50 mm").zOffset, 0.05);
  assert.equal(run("Tür zentrieren").position, 0.5);
});

test("hinge and swing side are set by name", () => {
  assert.equal(run("Anschlag Wandende").hinge, "end");
  assert.equal(run("Aufschlag nach rechts").opensTo, "right");
});

test("other text is left to other grammars; invalid door changes are rejected", () => {
  const p = project();
  assert.equal(previewDoorCommand(p, door, "Wandlänge auf 6 m"), null);
  assert.throws(
    () => previewDoorCommand(p, { kind: "wall", id: "w" }, "Türbreite auf 1 m"),
    /Tür auswählen/,
  );
  assert.throws(() => previewDoorCommand(p, door, "Türbreite auf 9 m"), /Änderung nicht möglich/);
  assert.throws(() => previewDoorCommand(p, door, "Türbreite auf 0 m"), /größer als null/);
  // Extra words make it no door command; the shared path then rejects the unknown text.
  assert.equal(previewDoorCommand(p, door, "Türbreite auf 1 m bitte"), null);
  const visibility = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  assert.throws(
    () => previewSelectionCommand(p, [door], visibility, "Türbreite auf 1 m bitte"),
    /Unbekannter Befehl/,
  );
});

test("the shared selection command path previews door commands with a summary", () => {
  const p = project();
  const visibility = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const preview = previewSelectionCommand(p, [door], visibility, "Türbreite auf 1,26 m");
  assert.equal(storeyOf(preview.result).doors![0]!.width, 1.26);
  assert.match(preview.summary, /Türbreite: 1,01 → 1,26 m/);
});
