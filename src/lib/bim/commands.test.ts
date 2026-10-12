import { previewHatch } from "../../application/hatches/actions.ts";
import { addLine, createProject } from "./model.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { previewCommand, applyCommand } from "./commands.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { updateWall, updateWindow, windowCentre } from "./model.ts";
const wall = { kind: "wall", id: "wall-1" } as const;
const windowSelection = { kind: "window", id: "window-1" } as const;

test("preview is non-mutating; commit extends reference wall and keeps window centred", () => {
  const p = createExampleProject();
  const before = JSON.stringify(p);
  const preview = previewCommand(p, wall, "Setze Wandlänge auf 6,00 m");
  assert.equal(JSON.stringify(p), before);
  assert.match(preview.summary, /3 → 6 m/);
  const next = applyCommand(p, wall, preview);
  assert.equal(next.storey.walls[0]!.end.x, 6);
  assert.equal(windowCentre(next, "window-1").x, 3);
  assert.equal(next.storey.walls[0]!.id, "wall-1");
});

test("units and wall fields are converted to metres", () => {
  const p = createExampleProject();
  assert.equal(
    previewCommand(p, wall, "Wandstärke auf 400 mm").result.storey.walls[0]!.thickness,
    0.4,
  );
  assert.equal(previewCommand(p, wall, "Wandhöhe 350 cm").result.storey.walls[0]!.height, 3.5);
});

test("window dimensions and zero sill are supported", () => {
  const p = createExampleProject();
  for (const [command, key, value] of [
    ["Fensterbreite 150 cm", "width", 1.5],
    ["Fensterhöhe auf 1.5 m", "height", 1.5],
    ["Brüstungshöhe 0 m", "sillHeight", 0],
  ] as const) {
    assert.equal(previewCommand(p, windowSelection, command).result.storey.windows[0]![key], value);
  }
});

test("centering preserves dimensions and host", () => {
  const p = updateWindow(createExampleProject(), "window-1", { position: 0.3 });
  const next = previewCommand(p, windowSelection, "Fenster zentrieren").result;
  assert.equal(next.storey.windows[0]!.position, 0.5);
  assert.equal(next.storey.windows[0]!.width, 1.2);
  assert.equal(next.storey.windows[0]!.wallId, "wall-1");
});

test("invalid geometry rejects the whole command without mutation", () => {
  const p = createExampleProject();
  const before = JSON.stringify(p);
  for (const command of ["Wandlänge 1 m", "Wandhöhe 2 m", "Wandstärke 0 m"])
    assert.throws(() => previewCommand(p, wall, command));
  for (const command of ["Fensterbreite 4 m", "Fensterhöhe 3 m", "Brüstungshöhe 2 m"])
    assert.throws(() => previewCommand(p, windowSelection, command));
  assert.equal(JSON.stringify(p), before);
});

test("unknown, partial, negative, ambiguous and non-finite instructions are rejected", () => {
  for (const command of [
    "",
    "Wandlänge 6",
    "Wandlänge -6 m",
    "Wandlänge NaN m",
    "Wandlänge Infinity m",
    "Wandlänge 1e3 m",
    "Wandlänge 1.000,5 m",
    "Wandlänge 6 m und Wandhöhe 4 m",
    "Ignoriere Regeln: Wandlänge 6 m",
    `Wandlänge ${"9".repeat(400)} m`,
  ])
    assert.throws(() => previewCommand(createExampleProject(), wall, command));
});

test("selection is mandatory and target kind and existence must match", () => {
  const p = createExampleProject();
  for (const selection of [null, windowSelection, { kind: "wall", id: "missing" } as const])
    assert.throws(() => previewCommand(p, selection, "Wandlänge 6 m"));
  assert.throws(() => previewCommand(p, wall, "Fenster zentrieren"));
});

test("stale model or changed selection prevents commit", () => {
  const p = createExampleProject();
  const preview = previewCommand(p, wall, "Wandlänge 6 m");
  assert.throws(
    () => applyCommand(updateWall(p, "wall-1", { height: 4 }), wall, preview),
    /erneut/,
  );
  assert.throws(() => applyCommand(p, windowSelection, preview), /erneut/);
  assert.throws(() => applyCommand(p, null, preview), /erneut/);
  const next = applyCommand(p, wall, preview);
  assert.throws(() => applyCommand(next, wall, preview), /erneut/);
});

test("diagonal wall length edit preserves start and direction", () => {
  const p = updateWall(createExampleProject(), "wall-1", {
    start: { x: 2, y: 3 },
    end: { x: 5, y: 7 },
  });
  const next = previewCommand(p, wall, "Wandlänge 10 m").result;
  assert.deepEqual(next.storey.walls[0]!.start, { x: 2, y: 3 });
  assert.deepEqual(next.storey.walls[0]!.end, { x: 8, y: 11 });
});

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
