import { storeyOf } from "../../domain/storeys/access.ts";
import { previewHatch } from "../../application/hatches/actions.ts";
import { addLine, createProject } from "./model.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { previewCommand, applyCommand } from "./commands.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
const wall = { kind: "wall", id: "wall-1" } as const;

test("offset text uses common cap, units and stable target context for both 2D types", () => {
  const points = [
    { x: 0, y: 0 },
    { x: 0.1, y: 0 },
    { x: 0.1, y: 0.1 },
    { x: 0, y: 0.1 },
  ];
  for (const kind of ["line", "hatch"] as const) {
    const initial = createProject("p", "s");
    const project =
      kind === "hatch"
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
    const selection = { kind, id: "shape" };
    const before = JSON.stringify(project);
    const preview = previewCommand(project, selection, "Offset um -100 cm");
    assert.match(preview.summary, /begrenzt/);
    assert.match(preview.summary, /-0,0495 m/);
    assert.equal(JSON.stringify(project), before);
    const next = applyCommand(project, selection, preview);
    assert.throws(() => applyCommand(next, selection, preview), /geändert/);
    assert.throws(() => applyCommand(project, { kind, id: "other" }, preview), /geändert/);
    const a = previewCommand(project, selection, "Offset +1 mm"),
      b = previewCommand(project, selection, "Offset um 0,001 m");
    assert.deepEqual(a.result, b.result);
    for (const text of [
      "Offset 1",
      "Offset um 5 cm und löschen",
      "Offset um NaN m",
      "Offset auf 1 m",
    ])
      assert.throws(() => previewCommand(project, selection, text));
  }
  assert.throws(() => previewCommand(createExampleProject(), wall, "Offset um 5 cm"), /2D/);
  assert.throws(() => previewCommand(createExampleProject(), null, "Offset um 5 cm"), /auswählen/);
});
