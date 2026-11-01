import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addSection, nextSectionLabel, removeSection, updateSection } from "./actions.ts";
import {
  nextSectionMark,
  repeatedSectionMarks,
  sectionFrame,
  sectionLookTo,
  type Section,
} from "../../domain/views/sections.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";

// docs/SCHNITT.md, SC2.
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
  assert.deepEqual(a.sections, [{ id: "s1", name: "Schnitt A-A", mark: "A", ...line }]);
  assert.deepEqual(nextSectionLabel(a, { markKind: "letters", namePrefix: "Längsschnitt" }), {
    mark: "B",
    name: "Längsschnitt B-B",
  });
  const b = addSection(
    a,
    { id: "s2", ...line, look: "right" },
    {
      markKind: "numbers",
      namePrefix: "Querschnitt",
    },
  );
  assert.equal(b.sections![1]!.name, "Querschnitt 1-1");
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
  assert.equal(PROJECT_SCHEMA_VERSION, 41);
  const stored = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  assert.equal(loadProjectData({ ...stored, schemaVersion: 40 }).schemaVersion, 41);
  assert.equal(loadProjectData({ ...stored, schemaVersion: 39 }).schemaVersion, 41);
  const withSection = JSON.parse(
    serializeProject(addSection(createStandardProject("p", "eg", "og"), { id: "s1", ...line })),
  );
  assert.equal(loadProjectData(withSection).sections!.length, 1);
  assert.throws(() => loadProjectData({ ...withSection, schemaVersion: 40 }));
});
