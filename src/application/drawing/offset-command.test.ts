import test from "node:test";
import assert from "node:assert/strict";
import { previewHatch } from "../hatches/actions.ts";
import { addLine } from "../lines/actions.ts";
import { createProject } from "../projects/create.ts";
import { previewOffsetCommand } from "./offset-command.ts";
import { applySelectionCommand, previewSelectionCommand } from "../commands/selection-command.ts";
import { ALL_LAYERS_VISIBLE, createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { commitProject, createHistory, undoProject } from "../history/project-history.ts";
import { isOwnedProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import type { Project } from "../../domain/project/schema.ts";

// Offset text command in the shared selection command path, moved from lib/bim/commands.ts
// (docs/performance/OFFSET_COMMAND.md).
const points = [
  { x: 0, y: 0 },
  { x: 0.1, y: 0 },
  { x: 0.1, y: 0.1 },
  { x: 0, y: 0.1 },
];
function shape(kind: "line" | "hatch"): Project {
  const initial = createProject("p", "s");
  return kind === "hatch"
    ? previewHatch(initial, initial, {
        projectId: "p",
        kind: "create",
        hatch: { id: "shape", points, fill: { color: "#123456", opacity: 0.4 } },
      })
    : addLine(initial, {
        id: "shape",
        kind: "polyline",
        points: [...points, points[0]!],
        color: "#123456",
        penWidth: 0.25,
        style: "solid",
      });
}
const preview = (p: Project, target: { kind: string; id: string }, text: string) =>
  previewSelectionCommand(
    p,
    [target as never],
    createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE),
    text,
  );

test("offset text uses common cap, units and stable target context for both 2D types", () => {
  for (const kind of ["line", "hatch"] as const) {
    const project = shape(kind);
    const selection = { kind, id: "shape" };
    const visibility = createLayerVisibilityPolicy(project, ALL_LAYERS_VISIBLE);
    const before = JSON.stringify(project);
    const p = previewSelectionCommand(project, [selection], visibility, "Offset um -100 cm");
    assert.match(p.summary, /begrenzt/);
    assert.match(p.summary, /-0,0495 m/);
    assert.equal(JSON.stringify(project), before);
    const next = applySelectionCommand(project, [selection], visibility, p);
    assert.throws(() => applySelectionCommand(next, [selection], visibility, p), /geändert/);
    assert.throws(
      () => applySelectionCommand(project, [{ kind, id: "other" }], visibility, p),
      /geändert/,
    );
    const a = preview(project, selection, "Offset +1 mm"),
      b = preview(project, selection, "Offset um 0,001 m");
    assert.deepEqual(a.result, b.result);
    for (const text of [
      "Offset 1",
      "Offset um 5 cm und löschen",
      "Offset um NaN m",
      "Offset auf 1 m",
    ])
      assert.throws(() => preview(project, selection, text));
  }
  assert.throws(
    () => preview(createExampleProject(), { kind: "wall", id: "wall-1" }, "Offset um 5 cm"),
    /2D/,
  );
  assert.throws(
    () => previewOffsetCommand(createExampleProject(), null, "Offset um 5 cm"),
    /auswählen/,
  );
  assert.throws(
    () => preview(createExampleProject(), { kind: "wall", id: "wall-1" }, "Fenster drehen"),
    /Unbekannter Befehl/,
  );
});

test("an owned project applies the previewed offset without running it again, as one undo step", () => {
  for (const kind of ["line", "hatch"] as const) {
    const history = createHistory(shape(kind));
    const project = history.present;
    const selection = { kind, id: "shape" };
    const visibility = createLayerVisibilityPolicy(project, ALL_LAYERS_VISIBLE);
    const p = previewSelectionCommand(project, [selection], visibility, "Offset um 2 cm");
    assert.ok(isOwnedProjectSnapshot(p.result));
    const applied = applySelectionCommand(project, [selection], visibility, p);
    assert.equal(applied, p.result);
    const next = commitProject(history, applied);
    assert.equal(next.past.length, 1);
    assert.equal(undoProject(next).present, project);
    // A mutable input still yields the same model.
    assert.deepEqual(preview(shape(kind), selection, "Offset um 2 cm").result, applied);
  }
});
