import test from "node:test";
import assert from "node:assert/strict";
import { previewSelectionCommand, applySelectionCommand } from "./selection-command.ts";
import { beginSelectionMove, previewSelectionMove } from "../selection/move.ts";
import { selectionIndex } from "../selection/state.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addWall, serializeProject } from "../../lib/bim/model.ts";
import { createDrawing, defaultHatchFill } from "../drawing/actions.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { previewCommand } from "../../lib/bim/commands.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../../lib/bim/history.ts";
function fixture() {
  let p = createExampleProject();
  p = addWall(p, {
    id: "corner",
    start: { x: 0, y: 0 },
    end: { x: 0, y: 3 },
    thickness: 0.36,
    height: 2.8,
    bodyOffset: 0,
  });
  p = createDrawing(p, p, "line", {
    kind: "line",
    lineKind: "line",
    points: [
      { x: 0, y: 4 },
      { x: 3, y: 4 },
    ],
    appearance: defaultLineAppearance,
  });
  return createDrawing(p, p, "hatch", {
    kind: "hatch",
    points: [
      { x: 0, y: 5 },
      { x: 1, y: 5 },
      { x: 1, y: 6 },
    ],
    fill: defaultHatchFill,
  });
}
test("text translates all mixed targets through the mouse action without mutation; units and cardinal directions agree", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()],
    visibility = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    before = serializeProject(p);
  for (const text of [
    "Auswahl um 2 m bei 90 Grad verschieben",
    "auswahl um 200 cm bei 90° verschieben",
    " AUSWAHL um 2000,0 mm bei 90,0 grad verschieben ",
  ]) {
    const preview = previewSelectionCommand(p, targets, visibility, text);
    const expected = previewSelectionMove(
      beginSelectionMove(p, targets, { x: 0, y: 0 }, visibility),
      p,
      targets,
      { x: 0, y: 2 },
      visibility,
    );
    assert.deepEqual(preview.result, expected);
    assert.deepEqual(
      applySelectionCommand(p, [...targets].reverse(), visibility, preview),
      expected,
    );
    assert.match(preview.summary, /5 Elemente/);
    assert.match(preview.summary, /0 externe/);
    assert.equal(preview.targets.length, 5);
  }
  assert.equal(serializeProject(p), before);
});
test("external joins and dependent windows are reported; result is recalculated on acceptance", () => {
  const p = fixture(),
    targets = [{ kind: "wall", id: "wall-1" }] as const,
    v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const preview = previewSelectionCommand(p, targets, v, "Auswahl um 1 m bei 0 Grad verschieben");
  assert.match(preview.summary, /1 Fenster/);
  assert.match(preview.summary, /1 externe/);
  const applied = applySelectionCommand(p, targets, v, { ...preview, result: p });
  assert.deepEqual(applied, preview.result);
  assert.equal(applied.storey.wallJoins.length, 0);
});
test("wrong, duplicated, hidden, deleted and changed targets never commit a partial set", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()],
    v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const preview = previewSelectionCommand(p, targets, v, "Auswahl um 2 m bei 90 Grad verschieben");
  assert.throws(() => applySelectionCommand({ ...p }, targets, v, preview));
  assert.throws(() => applySelectionCommand(p, targets.slice(1), v, preview));
  assert.throws(() => applySelectionCommand(p, [targets[0]!, ...targets.slice(0, -1)], v, preview));
  const hidden = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [p.storey.walls[0]!.layerId],
  });
  assert.throws(() => applySelectionCommand(p, targets, hidden, preview));
  assert.throws(() => previewSelectionCommand(p, targets, hidden, preview.text));
  assert.throws(() =>
    previewSelectionCommand(p, [{ kind: "wall", id: "missing" }], v, preview.text),
  );
  assert.throws(() => previewSelectionCommand(p, [], v, preview.text));
  assert.throws(
    () =>
      previewSelectionCommand(
        p,
        targets.filter((t) => t.kind !== "wall"),
        v,
        preview.text,
      ),
    /Fenster/,
  );
});
test("bounded grammar rejects incomplete, ambiguous, chained, negative, zero and invalid-angle commands", () => {
  const p = fixture(),
    targets = [...selectionIndex(p).values()],
    v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  for (const text of [
    "Auswahl verschieben",
    "Auswahl um 2 bei 90 Grad verschieben",
    "Auswahl um 2 m verschieben",
    "Auswahl um -2 m bei 90 Grad verschieben",
    "Auswahl um 0 m bei 90 Grad verschieben",
    "Auswahl um 2 m bei 566 Grad verschieben",
    "Auswahl um 2 m bei -1 Grad verschieben",
    "Auswahl um 2 m bei 90 Grad verschieben und skalieren",
    "Wandhöhe auf 4 m",
  ])
    assert.throws(() => previewSelectionCommand(p, targets, v, text));
});
test("existing singleton commands retain their original action and require visible singleton context", () => {
  const p = createExampleProject(),
    target = { kind: "wall", id: "wall-1" } as const,
    v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const text = "Wandlänge auf 6 m";
  assert.deepEqual(
    previewSelectionCommand(p, [target], v, text).result,
    previewCommand(p, target, text).result,
  );
});
test("acceptance has one undo/redo; preview and cancellation require no model history", () => {
  const h = createHistory(fixture()),
    p = h.present,
    targets = [...selectionIndex(p).values()],
    v = createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE);
  const preview = previewSelectionCommand(p, targets, v, "Auswahl um 2 m bei 180 Grad verschieben");
  assert.equal(h.past.length, 0);
  assert.equal(h.present, p);
  const next = commitProject(h, applySelectionCommand(p, targets, v, preview));
  assert.equal(next.past.length, 1);
  assert.deepEqual(undoProject(next).present, p);
  assert.deepEqual(redoProject(undoProject(next)).present, preview.result);
});
