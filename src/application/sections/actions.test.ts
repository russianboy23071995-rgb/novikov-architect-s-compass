import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import {
  addSection,
  dragSectionGrip,
  nextSectionLabel,
  removeSection,
  SECTION_TOOL_DEFAULTS,
  sectionGripPoint,
  updateSection,
  withSectionLength,
} from "./actions.ts";
import {
  nextSectionMark,
  repeatedSectionMarks,
  sectionFrame,
  sectionLookTo,
  sectionSymbolHeight,
  convertSectionSymbolSize,
  SECTION_SYMBOL_SIZE,
  type Section,
} from "../../domain/views/sections.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";

// docs/SCHNITT.md, SC2, SC4 and SC5.
const line = { start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, look: "left" as const };
const marked = (mark: string) => ({ id: mark, name: mark, mark, ...line }) satisfies Section;

test("marks run A…Z, AA… or 1, 2, …; the first free one is taken", () => {
  assert.equal(nextSectionMark([], "letters"), "A");
  assert.equal(nextSectionMark([marked("A"), marked("C")], "letters"), "B");
  const all = Array.from({ length: 26 }, (_, i) => marked(String.fromCharCode(65 + i)));
  assert.equal(nextSectionMark(all, "letters"), "AA");
  assert.equal(nextSectionMark([marked("1")], "numbers"), "2");
  assert.deepEqual([...repeatedSectionMarks([marked("A"), marked("A"), marked("B")])], ["A"]);
});

test("viewing side from the third click; the frame looks to that side", () => {
  assert.equal(sectionLookTo(line.start, line.end, { x: 2, y: 1 }), "left");
  assert.equal(sectionLookTo(line.start, line.end, { x: 2, y: -1 }), "right");
  assert.deepEqual(sectionFrame(line).view, { x: -0, y: 1 });
  assert.deepEqual(sectionFrame({ ...line, look: "right" }).view, { x: 0, y: -1 });
  assert.equal(sectionFrame(line).length, 4);
});

test("sections belong to the building: add, rename, repeat a mark, turn, delete, round trip", () => {
  const p = createStandardProject("p", "eg", "og");
  const a = addSection(p, { id: "s1", ...line });
  assert.deepEqual(a.sections, [
    { id: "s1", name: "Schnitt A-A", mark: "A", symbolSize: SECTION_SYMBOL_SIZE, ...line },
  ]);
  assert.deepEqual(nextSectionLabel(a, { ...SECTION_TOOL_DEFAULTS, namePrefix: "Längsschnitt" }), {
    mark: "B",
    name: "Längsschnitt B-B",
  });
  const b = addSection(
    a,
    { id: "s2", ...line, look: "right" },
    {
      markKind: "numbers",
      namePrefix: "Querschnitt",
      symbolSize: { unit: "model", value: 0.4 },
    },
  );
  assert.equal(b.sections![1]!.name, "Querschnitt 1-1");
  assert.deepEqual(b.sections![1]!.symbolSize, { unit: "model", value: 0.4 });
  // The storeys are untouched: a section is drawn in any plan and shown in all of them.
  assert.deepEqual(b.storeys, p.storeys);
  const renamed = updateSection(b, "s2", { name: "Treppenschnitt", mark: "A", look: "left" });
  assert.equal(renamed.sections![1]!.mark, "A");
  assert.deepEqual([...repeatedSectionMarks(renamed.sections!)], ["A"]);
  assert.throws(() => updateSection(b, "s2", { name: " " }));
  assert.throws(() => updateSection(b, "nope", { name: "x" }));
  assert.throws(() =>
    addSection(p, { id: "s1", start: line.start, end: line.start, look: "left" }),
  );
  assert.throws(() => addSection(a, { id: "s1", ...line }), /Duplicate ID/);
  assert.deepEqual(readProjectFile(serializeProject(renamed)), renamed);
  assert.deepEqual(
    removeSection(renamed, "s1").sections!.map((s) => s.id),
    ["s2"],
  );
});

test("schema 40 files load without sections; smuggled sections are refused", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 42);
  const stored = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  assert.equal(loadProjectData({ ...stored, schemaVersion: 40 }).schemaVersion, 42);
  assert.equal(loadProjectData({ ...stored, schemaVersion: 39 }).schemaVersion, 42);
  const withSection = JSON.parse(
    serializeProject(addSection(createStandardProject("p", "eg", "og"), { id: "s1", ...line })),
  );
  assert.equal(loadProjectData(withSection).sections!.length, 1);
  assert.throws(() => loadProjectData({ ...withSection, schemaVersion: 40 }));
});

test("symbol size: letter height in paper mm or model m, fixed to the model, not the screen", () => {
  // docs/SCHNITT.md, SC4: default 5 mm on paper, at 1:100 that is 0,50 m in the model.
  assert.deepEqual(SECTION_SYMBOL_SIZE, { unit: "paper", value: 5 });
  assert.equal(sectionSymbolHeight(undefined, 100), 0.5);
  assert.equal(sectionSymbolHeight(undefined, 50), 0.25);
  assert.equal(sectionSymbolHeight({ unit: "model", value: 0.4 }, 50), 0.4);
  // Switching the unit keeps the visible size at the output scale.
  assert.deepEqual(convertSectionSymbolSize(SECTION_SYMBOL_SIZE, "model", 100), {
    unit: "model",
    value: 0.5,
  });
  assert.deepEqual(convertSectionSymbolSize({ unit: "model", value: 0.5 }, "paper", 50), {
    unit: "paper",
    value: 10,
  });
  // Older sections without a size keep loading; a size is saved and refused when invalid.
  const p = createStandardProject("p", "eg", "og");
  const plain = { ...addSection(p, { id: "s1", ...line }) };
  plain.sections = plain.sections!.map(({ symbolSize: _, ...s }) => s);
  assert.equal(
    loadProjectData(JSON.parse(serializeProject(plain))).sections![0]!.symbolSize,
    undefined,
  );
  const sized = updateSection(plain, "s1", { symbolSize: { unit: "paper", value: 3.5 } });
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(sized))).sections![0]!.symbolSize, {
    unit: "paper",
    value: 3.5,
  });
  assert.throws(() => updateSection(plain, "s1", { symbolSize: { unit: "paper", value: 0 } }));
});

test("grips: ends lengthen, shorten or turn the line, the middle moves it, Shift keeps the direction", () => {
  // docs/SCHNITT.md, SC5.
  const s = { start: { x: 0, y: 0 }, end: { x: 4, y: 0 } };
  assert.deepEqual(sectionGripPoint(s, "move"), { x: 2, y: 0 });
  assert.deepEqual(dragSectionGrip(s, "end", { x: 6, y: 0 }), {
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
  });
  assert.deepEqual(dragSectionGrip(s, "start", { x: 1, y: 2 }), {
    start: { x: 1, y: 2 },
    end: { x: 4, y: 0 },
  });
  assert.deepEqual(dragSectionGrip(s, "move", { x: 3, y: 5 }), {
    start: { x: 1, y: 5 },
    end: { x: 5, y: 5 },
  });
  // Shift: only the length changes, the pointer is projected onto the line.
  assert.deepEqual(dragSectionGrip(s, "end", { x: 2.5, y: 3 }, true), {
    start: { x: 0, y: 0 },
    end: { x: 2.5, y: 0 },
  });
  assert.deepEqual(dragSectionGrip(s, "start", { x: -1, y: -2 }, true), {
    start: { x: -1, y: 0 },
    end: { x: 4, y: 0 },
  });
  // Never a point, never flipped over with Shift.
  assert.equal(dragSectionGrip(s, "end", { x: 0, y: 0 }), null);
  assert.equal(dragSectionGrip(s, "end", { x: -1, y: 0 }, true), null);
  // Length typed in the window: from the start, same direction.
  assert.deepEqual(withSectionLength({ start: { x: 1, y: 1 }, end: { x: 1, y: 3 } }, 5), {
    start: { x: 1, y: 1 },
    end: { x: 1, y: 6 },
  });
  assert.throws(() => withSectionLength(s, 0));
  // The model keeps the section, its id, name and mark; the drawing follows the new points.
  const p = addSection(createStandardProject("p", "eg", "og"), { id: "s1", ...line });
  const moved = updateSection(p, "s1", dragSectionGrip(p.sections![0]!, "move", { x: 2, y: 3 })!);
  assert.deepEqual(moved.sections![0]!.start, { x: 0, y: 3 });
  assert.equal(moved.sections![0]!.mark, "A");
});

test("elevations: own marks and names, four around the building, nothing cut in the drawing", async () => {
  // docs/ANSICHTEN.md, A1.
  const { addFourElevations, ELEVATION_TOOL_DEFAULTS } = await import("./actions.ts");
  const { addWall } = await import("../walls/actions.ts");
  const { createProject } = await import("../projects/create.ts");
  const { sectionDrawing } = await import("../../rendering/viewport/section-drawing.ts");
  let p = addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 6, y: 0 },
    thickness: 0.3,
    height: 2.8,
  });
  p = addSection(p, { id: "s1", ...line });
  // Marks run per kind: the first elevation is „Ansicht 1“ next to section A.
  assert.deepEqual(nextSectionLabel(p, ELEVATION_TOOL_DEFAULTS, "elevation"), {
    mark: "1",
    name: "Ansicht 1",
  });
  p = addSection(p, { id: "e1", ...line, kind: "elevation" }, ELEVATION_TOOL_DEFAULTS);
  assert.equal(p.sections![1]!.kind, "elevation");
  assert.equal(p.sections![1]!.name, "Ansicht 1");
  assert.equal(p.sections![0]!.kind, undefined);
  let n = 0;
  const four = addFourElevations(p, () => `e-${++n}`);
  const added = four.sections!.slice(2);
  assert.deepEqual(
    added.map((s) => [s.mark, s.name]),
    [
      ["N", "Nordansicht"],
      ["O", "Ostansicht"],
      ["S", "Südansicht"],
      ["W", "Westansicht"],
    ],
  );
  // 2 m beyond the outline (walls with their thickness): north at y = 0,3 + 2.
  assert.ok(Math.abs(added[0]!.start.y - 2.3) < 1e-9);
  assert.throws(() => addFourElevations(four, () => "x"), /gibt es schon/);
  // The south elevation sees the wall face, nothing is cut; a section through it would cut.
  const south = sectionDrawing(four, added[2]!);
  assert.equal(south.cuts.length, 0);
  assert.ok(south.views.length > 0);
  const through = sectionDrawing(four, {
    ...added[2]!,
    kind: "elevation",
    start: { x: 3, y: -1 },
    end: { x: 3, y: 1 },
  });
  assert.equal(through.cuts.length, 0);
  assert.throws(() => addFourElevations(createStandardProject("q", "eg", "og"), () => "x"));
});
