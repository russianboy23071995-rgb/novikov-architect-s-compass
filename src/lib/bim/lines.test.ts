import test from "node:test";
import assert from "node:assert/strict";
import {
  addLine,
  updateLine,
  createProject,
  serializeProject,
  deserializeProject,
} from "./model.ts";
import type { DrawingLine } from "./model.ts";
import { defaultLineAppearance, lineLength, linePath } from "./lines.ts";
import {
  createHistory,
  commitProject,
  undoProject,
  redoProject,
  readProjectFile,
} from "./history.ts";
import { createExampleProject, planBounds, drawingPoint } from "../../components/cad/bim-view.ts";
import { buildSolid } from "./geometry.ts";
import { exportIfc } from "./ifc.ts";
import { previewCommand } from "./commands.ts";
const line: DrawingLine = {
  id: "line-1",
  kind: "line",
  points: [
    { x: 0, y: 0 },
    { x: 3, y: 4 },
  ],
  ...defaultLineAppearance,
};

test("line geometry stays in metres; appearance edits preserve vertices and IDs", () => {
  const p = addLine(createExampleProject(), line);
  assert.equal(lineLength(p.storey.lines![0]!), 5);
  const next = updateLine(p, line.id, { color: "#dc2626", penWidth: 0.7, style: "dashed" });
  assert.equal(next.storey.lines![0]!.id, line.id);
  assert.deepEqual(next.storey.lines![0]!.points, line.points);
  assert.equal(next.storey.lines![0]!.color, "#dc2626");
  assert.equal(p.storey.lines![0]!.color, line.color);
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
  assert.equal(p.storey.lines!.length, 1);
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
  assert.equal(undoProject(edited).present.storey.lines![0]!.style, "solid");
  assert.equal(undoProject(undoProject(edited)).present.storey.lines, undefined);
  assert.equal(redoProject(undoProject(edited)).present.storey.lines![0]!.style, "break");
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
    () => previewCommand(next, { kind: "line", id: line.id }, "Wandlänge 6 m"),
    /Wand auswählen/,
  );
});
