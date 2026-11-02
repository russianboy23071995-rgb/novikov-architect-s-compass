import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { createDrawing } from "../drawing/actions.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { changeTitleBlocks, titleBlockUnderlay, type TitleBlockAction } from "./title-blocks.ts";

// docs/PLANKOPF.md, PK1.
const run = (p: Project, action: TitleBlockAction) => changeTitleBlocks(p, p, action);
const start = () => createStandardProject("p", "eg", "og");
/** A line of the building, to copy into a title block as its drawing. */
function line(id: string) {
  const p = start();
  const drawn = createDrawing(p, p, id, {
    kind: "line",
    lineKind: "polyline",
    points: [
      { x: -0.18, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 0.05 },
    ],
    appearance: defaultLineAppearance,
  });
  return storeyOf(drawn).lines![0]!;
}

test("title blocks: create with the master's sheet, rename, change the underlay, delete", () => {
  const p = start();
  assert.ok(!serializeProject(p).includes("titleBlocks"));
  let q = run(p, { kind: "create", id: "tb1", name: "Plankopf" });
  const [block] = q.titleBlocks!;
  assert.equal(block!.storey.id, "tb1");
  assert.deepEqual(block!.sheet, {
    format: "A3",
    orientation: "landscape",
    margins: { top: 10, right: 10, bottom: 10, left: 20 },
  });
  assert.equal(q.storeys.length, 2, "never a storey of the building");
  assert.throws(() => run(q, { kind: "create", id: "tb2", name: "Plankopf" }), /eindeutige Namen/);
  q = run(q, { kind: "rename", id: "tb1", name: "Plankopf Entwurf" });
  assert.equal(q.titleBlocks![0]!.storey.name, "Plankopf Entwurf");
  q = run(q, {
    kind: "sheet",
    id: "tb1",
    sheet: {
      format: "A4",
      orientation: "portrait",
      margins: { top: 5, right: 5, bottom: 5, left: 25 },
    },
  });
  assert.equal(q.titleBlocks![0]!.sheet.format, "A4");
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(q))).titleBlocks, q.titleBlocks);
  q = run(q, { kind: "delete", id: "tb1" });
  assert.equal(q.titleBlocks, undefined);
  assert.throws(() => run(q, { kind: "rename", id: "tb1", name: "X" }), /existiert nicht mehr/);
});

test("the drawing sheet holds drawing elements only and keeps its own checks", () => {
  const q = run(start(), { kind: "create", id: "tb1", name: "Plankopf" });
  const raw = structuredClone(q);
  raw.titleBlocks![0]!.storey.lines = [line("frame")];
  const drawn = validateProject(raw);
  assert.equal(drawn.titleBlocks![0]!.storey.lines!.length, 1);
  assert.equal(storeyOf(drawn).lines, undefined, "the building stays untouched");
  // A wall is part of the building, never of a title block.
  const walled = structuredClone(q);
  walled.titleBlocks![0]!.storey.walls = [
    {
      id: "w",
      layerId: q.defaultLayerIds.wall,
      start: { x: 0, y: 0 },
      end: { x: 1, y: 0 },
      thickness: 0.2,
      height: 2,
      bodyOffset: 0,
    },
  ] as never;
  assert.throws(() => validateProject(walled), /nur Linien, Texte/);
  // IDs are unique across the building and the title blocks.
  const twice = structuredClone(raw);
  twice.storeys[0]!.lines = [line("frame")];
  assert.throws(() => validateProject(twice), /Duplicate ID: frame/);
  const unknownLayer = structuredClone(raw);
  unknownLayer.titleBlocks![0]!.storey.lines![0]!.layerId = "nope";
  assert.throws(() => validateProject(unknownLayer), /layer/i);
});

test("schema 44 files load without title blocks; smuggled title blocks are refused", () => {
  const stored = JSON.parse(serializeProject(start()));
  assert.equal(loadProjectData({ ...stored, schemaVersion: 44 }).schemaVersion, 48);
  const withBlock = JSON.parse(
    serializeProject(run(start(), { kind: "create", id: "tb1", name: "Plankopf" })),
  );
  assert.throws(() => loadProjectData({ ...withBlock, schemaVersion: 44 }));
});

test("the underlay puts the margin frame's lower right corner at the origin (PK3)", () => {
  const u = titleBlockUnderlay({
    format: "A3",
    orientation: "landscape",
    margins: { top: 10, right: 10, bottom: 10, left: 20 },
  });
  const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-12, `${a} ≠ ${b}`);
  // A3 quer 420 × 297 mm: paper from −0,41 to 0,01 m and −0,01 to 0,287 m.
  near(u.paper.x0, -0.41);
  near(u.paper.x1, 0.01);
  near(u.paper.y0, -0.01);
  near(u.paper.y1, 0.287);
  near(u.frame.x0, -0.39);
  assert.equal(u.frame.x1, 0);
  assert.equal(u.frame.y0, 0);
  near(u.frame.y1, 0.277);
});
