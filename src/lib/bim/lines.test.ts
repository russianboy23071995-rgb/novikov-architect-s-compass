import { storeyOf } from "../../domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { serializeProject, deserializeProject } from "./model.ts";
import { addLine, updateLine } from "../../application/lines/actions.ts";
import { createProject } from "../../application/projects/create.ts";
import type { DrawingLine } from "../../domain/project/schema.ts";
import { defaultLineAppearance, lineLength, linePath, parsePenWidth } from "./lines.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
} from "../../application/history/project-history.ts";
import { readProjectFile } from "./history.ts";
import { createExampleProject, planBounds, drawingPoint } from "../../components/cad/bim-view.ts";
import { buildSolid } from "./geometry.ts";
import { exportIfc } from "./ifc.ts";
import { previewWallCommand } from "../../application/walls/command.ts";
const line: DrawingLine = {
  id: "line-1",
  layerId: "layer:drawing",
  kind: "line",
  points: [
    { x: 0, y: 0 },
    { x: 3, y: 4 },
  ],
  ...defaultLineAppearance,
};

test("line geometry stays in metres; appearance edits preserve vertices and IDs", () => {
  const p = addLine(createExampleProject(), line);
  assert.equal(lineLength(storeyOf(p).lines![0]!), 5);
  const next = updateLine(p, line.id, { color: "#dc2626", penWidth: 0.7, style: "dashed" });
  assert.equal(storeyOf(next).lines![0]!.id, line.id);
  assert.deepEqual(storeyOf(next).lines![0]!.points, line.points);
  assert.equal(storeyOf(next).lines![0]!.color, "#dc2626");
  assert.equal(storeyOf(p).lines![0]!.color, line.color);
});
test("polyline is one entity with cumulative length and can close back to start", () => {
  const poly = {
    ...line,
    kind: "polyline" as const,
    points: [
      { x: 0, y: 0 },
      { x: 3, y: 0 },
      { x: 3, y: 4 },
      { x: 0, y: 0 },
    ],
  };
  const p = addLine(createProject("p", "s"), poly);
  assert.equal(storeyOf(p).lines!.length, 1);
  assert.equal(lineLength(poly), 12);
});
test("rejects missing, coincident, extra line points and nonfinite geometry", () => {
  const p = createExampleProject();
  for (const points of [
    [],
    [{ x: 0, y: 0 }],
    [
      { x: 0, y: 0 },
      { x: 0, y: 0 },
    ],
    [
      { x: 0, y: 0 },
      { x: Infinity, y: 1 },
    ],
    [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ],
  ])
    assert.throws(() => addLine(p, { ...line, points }));
  assert.throws(() =>
    addLine(p, {
      ...line,
      kind: "polyline",
      points: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 0 },
      ],
    }),
  );
});
test("validates IDs and styles across all model elements atomically", () => {
  const p = addLine(createExampleProject(), line);
  const before = serializeProject(p);
  for (const changes of [
    { id: "wall-1" },
    { id: "window-1" },
    { id: "line-1" },
    { id: "" },
    { color: "red" },
    { penWidth: 0 },
    { penWidth: 3 },
    { style: "unknown" },
  ])
    assert.throws(() => addLine(p, { ...line, id: "new", ...changes } as DrawingLine));
  assert.throws(() => updateLine(p, "missing", { penWidth: 0.5 }));
  assert.throws(() =>
    updateLine(p, "line-1", {
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
      ],
    }),
  );
  assert.equal(serializeProject(p), before);
});
test("old JSON loads and new files round-trip line geometry and all styles", () => {
  const legacy = createExampleProject();
  assert.deepEqual(deserializeProject(serializeProject(legacy)), legacy);
  for (const style of ["solid", "dashed", "break"] as const) {
    const p = addLine(legacy, { ...line, style });
    assert.deepEqual(readProjectFile(serializeProject(p)), p);
  }
});
test("creation and style changes participate in shared undo and redo", () => {
  const initial = createHistory(createExampleProject());
  const created = commitProject(initial, addLine(initial.present, line));
  const edited = commitProject(created, updateLine(created.present, line.id, { style: "break" }));
  assert.equal(storeyOf(undoProject(edited).present).lines![0]!.style, "solid");
  assert.equal(storeyOf(undoProject(undoProject(edited)).present).lines, undefined);
  assert.equal(storeyOf(redoProject(undoProject(edited)).present).lines![0]!.style, "break");
});
test("plan bounds include lines even without walls and snapping is shared", () => {
  const p = addLine(createProject("p", "s"), {
    ...line,
    points: [
      { x: 20, y: 30 },
      { x: 25, y: 30 },
    ],
  });
  const [x, y, w, h] = planBounds(p).split(" ").map(Number);
  assert.ok(x! <= 20 && x! + w! >= 25 && y! <= -30 && y! + h! >= -30);
  assert.deepEqual(drawingPoint({ x: 2.34, y: 0.12 }, { x: 0, y: 0 }, true, true), {
    x: 2.3,
    y: 0,
  });
});
test("break presentation preserves geometry and real endpoints", () => {
  const p = { ...line, style: "break" as const };
  const before = JSON.stringify(p);
  assert.equal(linePath(line), "M 0 0 L 3 -4");
  assert.match(linePath(p), /^M 0 0 L /);
  assert.ok(linePath(p).endsWith("L 3 -4"));
  assert.equal((linePath(p).match(/ L /g) ?? []).length, 5);
  assert.equal(JSON.stringify(p), before);
});
test("2D lines do not become 3D solids or IFC walls and cannot receive wall commands", async () => {
  const p = createExampleProject();
  const next = addLine(p, line);
  assert.deepEqual(buildSolid(next), buildSolid(p));
  const date = new Date("2026-01-01T00:00:00Z");
  assert.equal(await exportIfc(next, date), await exportIfc(p, date));
  assert.throws(
    () => previewWallCommand(next, { kind: "line", id: line.id }, "Wandlänge 6 m"),
    /Wand auswählen/,
  );
});

test("pen width accepts German commas and decimal points, rejecting partial or invalid input", () => {
  for (const text of ["0,05", "0.05", ",05", ".05"]) assert.equal(parsePenWidth(text), 0.05);
  assert.equal(parsePenWidth(" 0,70 "), 0.7);
  assert.equal(parsePenWidth("2"), 2);
  for (const text of ["", " ", "0,", "1.", "0", "-1", "2,01", "0,7mm", "1,2.3", "Infinity", "NaN"])
    assert.ok(Number.isNaN(parsePenWidth(text)), text);
});
test("all line style edits can be committed together without changing geometry and survive undo and JSON", () => {
  const p = addLine(createExampleProject(), line);
  const changed = updateLine(p, line.id, {
    color: "#dc2626",
    penWidth: parsePenWidth("0,70"),
    style: "dashed",
  });
  const restored = deserializeProject(serializeProject(changed));
  assert.deepEqual(storeyOf(restored).lines![0], {
    ...line,
    color: "#dc2626",
    penWidth: 0.7,
    style: "dashed",
  });
  const history = commitProject(createHistory(p), changed);
  assert.deepEqual(undoProject(history).present, p);
  assert.deepEqual(redoProject(undoProject(history)).present, changed);
  assert.throws(() => updateLine(changed, line.id, { penWidth: parsePenWidth("0,") }));
});
