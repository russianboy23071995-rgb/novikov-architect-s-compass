import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { updateWindow as legacyUpdateWindow } from "./actions.ts";
import { previewOffsetCommand } from "../drawing/offset-command.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { previewSelectionCommand } from "../commands/selection-command.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { setOpeningMark } from "../openings/marks.ts";
import { updateWindow } from "./actions.ts";
import { previewWindowCommand } from "./command.ts";

const target = { kind: "window", id: "window-1" } as const;
const wall = { kind: "wall", id: "wall-1" } as const;

test("window commands give the same model as the former lib/bim action", () => {
  const p = legacyUpdateWindow(createExampleProject(), "window-1", { position: 0.3 });
  for (const [command, key, value] of [
    ["Fensterbreite 150 cm", "width", 1.5],
    ["Fensterhöhe auf 1.5 m", "height", 1.5],
    ["setze Fensterhöhe 1200 mm", "height", 1.2],
    ["Brüstungshöhe 0 m", "sillHeight", 0],
    ["Brüstungshöhe auf 0,45 m", "sillHeight", 0.45],
    ["Fenster zentrieren", "position", 0.5],
  ] as const) {
    const next = previewWindowCommand(p, target, command)!.result;
    // Equality oracle: the unchanged lib/bim window action with the same change.
    assert.deepEqual(next, legacyUpdateWindow(p, "window-1", { [key]: value }), command);
    assert.deepEqual(updateWindow(p, "window-1", { [key]: value }), next);
    assert.equal(storeyOf(next).windows[0]!.wallId, "wall-1");
  }
});

test("limits and messages are unchanged; other texts are left to other grammars", () => {
  const p = createExampleProject();
  const before = JSON.stringify(p);
  for (const command of ["Fensterbreite 4 m", "Fensterhöhe 3 m", "Brüstungshöhe 2 m"])
    assert.throws(() => previewWindowCommand(p, target, command), /vollständig in die Wand/);
  for (const command of ["Fensterbreite 0 m", "Fensterhöhe 0 cm"])
    assert.throws(() => previewWindowCommand(p, target, command), /größer als null/);
  assert.throws(() => previewWindowCommand(p, wall, "Fenster zentrieren"), /Fenster auswählen/);
  assert.throws(() => previewWindowCommand(p, null, "Fensterbreite 1 m"), /Fenster auswählen/);
  for (const text of ["Fensterbreite -1 m", "Fensterbreite 1", "Wandlänge 6 m", "Fenster drehen"])
    assert.equal(previewWindowCommand(p, target, text), null, text);
  assert.equal(JSON.stringify(p), before);
  // The legacy grammar no longer answers window commands.
  assert.equal(previewOffsetCommand(p, target, "Fenster zentrieren"), null);
});

test("summary in door style names the position number, else the ID", () => {
  const p = createExampleProject();
  const v = createLayerVisibilityPolicy(p, { scope: { kind: "bim-project" }, hiddenLayerIds: [] });
  assert.equal(
    previewSelectionCommand(p, [target], v, "Fensterbreite 150 cm").summary,
    "window-1 · Fensterbreite: 1,2 → 1,5 m",
  );
  const marked = setOpeningMark(p, target, "F-EG-01");
  const vm = createLayerVisibilityPolicy(marked, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  assert.equal(
    previewSelectionCommand(marked, [target], vm, "Fenster zentrieren").summary,
    "F-EG-01 · Relative Fenstermitte: 0,5 → 0,5",
  );
});
