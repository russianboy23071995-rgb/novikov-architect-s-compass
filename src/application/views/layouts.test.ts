import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  DEFAULT_MASTER_ID,
  LAYOUT_COLLECTION_ID,
  layoutsInFolder,
  layoutFolderTree,
  layoutSheet,
  projectLayoutFolders,
  projectLayouts,
  sheetSize,
  type Sheet,
} from "../../domain/views/layouts.ts";
import { changeLayouts, type LayoutAction } from "./layouts.ts";

// docs/LAYOUTS.md, LA1.
const run = (p: Project, action: LayoutAction) => changeLayouts(p, p, action);
const a4: Sheet = {
  format: "A4",
  orientation: "portrait",
  margins: { top: 10, right: 10, bottom: 10, left: 20 },
};

test("an untouched project uses the defaults; the first layout writes the library", () => {
  const p = createStandardProject("p", "eg", "og");
  assert.equal(projectLayoutFolders(p)[0]!.name, "Layoutsammlung");
  assert.ok(!serializeProject(p).includes("layout"));
  const q = run(p, {
    kind: "create-layout",
    id: "l1",
    name: "Grundriss EG",
    folderId: LAYOUT_COLLECTION_ID,
    masterId: DEFAULT_MASTER_ID,
  });
  const [layout] = projectLayouts(q);
  assert.equal(layout!.masterId, DEFAULT_MASTER_ID);
  assert.equal(layout!.sheet, undefined);
  // Standard A3 quer: 420 × 297 mm, margins 10 mm and 20 mm on the left (binding edge).
  const sheet = layoutSheet(q, layout!);
  assert.deepEqual(sheetSize(sheet), { width: 420, height: 297 });
  assert.equal(sheet.margins.left, 20);
  assert.equal(q.masterLayouts!.length, 1);
  assert.deepEqual(loadProjectData(JSON.parse(serializeProject(q))).layouts, q.layouts);
});

test("folders nest below the collection, move without loops and are deleted only empty", () => {
  let p = createStandardProject("p", "eg", "og");
  p = run(p, { kind: "create-folder", id: "f1", name: "Entwurf", parentId: LAYOUT_COLLECTION_ID });
  p = run(p, { kind: "create-folder", id: "f2", name: "Grundrisse", parentId: "f1" });
  assert.equal(p.layoutFolders!.find((f) => f.id === "f1")!.parentId, undefined);
  assert.equal(p.layoutFolders!.find((f) => f.id === "f2")!.parentId, "f1");
  p = run(p, {
    kind: "create-layout",
    id: "l1",
    name: "EG",
    folderId: "f2",
    masterId: DEFAULT_MASTER_ID,
  });
  assert.throws(() => run(p, { kind: "move-folder", id: "f1", parentId: "f2" }), /in sich selbst/);
  assert.throws(() => run(p, { kind: "delete-folder", id: "f1" }), /zuerst leeren/);
  for (const kind of ["rename-folder", "delete-folder"] as const)
    assert.throws(
      () => run(p, { kind, id: LAYOUT_COLLECTION_ID, name: "X" } as LayoutAction),
      /Layoutsammlung/,
    );
  assert.deepEqual(
    layoutFolderTree(p).map(({ folder, depth }) => [folder.name, depth]),
    [
      ["Layoutsammlung", 0],
      ["Entwurf", 1],
      ["Grundrisse", 2],
    ],
  );
  p = run(p, { kind: "move-layout", id: "l1", folderId: LAYOUT_COLLECTION_ID });
  p = run(p, { kind: "move-folder", id: "f2", parentId: LAYOUT_COLLECTION_ID });
  assert.equal(p.layoutFolders!.find((f) => f.id === "f2")!.parentId, undefined);
  p = run(p, { kind: "delete-folder", id: "f1" });
  p = run(p, { kind: "rename-folder", id: "f2", name: "Pläne" });
  assert.deepEqual(
    p.layoutFolders!.map((f) => f.name),
    ["Layoutsammlung", "Pläne"],
  );
  // A stored folder whose parent loops is refused by the project check.
  const raw = structuredClone(p);
  raw.layoutFolders!.push(
    { id: "x", name: "X", parentId: "y" },
    { id: "y", name: "Y", parentId: "x" },
  );
  assert.throws(() => validateProject(raw), /in sich selbst/);
});

test("without a master the layout keeps its own sheet; switching back drops it", () => {
  let p = createStandardProject("p", "eg", "og");
  const create = (sheet: Sheet) =>
    run(p, {
      kind: "create-layout",
      id: "l1",
      name: "Detail",
      folderId: LAYOUT_COLLECTION_ID,
      masterId: null,
      sheet,
    });
  assert.throws(
    () =>
      run(p, {
        kind: "create-layout",
        id: "l1",
        name: "D",
        folderId: LAYOUT_COLLECTION_ID,
        masterId: null,
      }),
    /eigene Blatteinstellungen/,
  );
  assert.throws(
    () => create({ ...a4, margins: { ...a4.margins, left: 150, right: 60 } }),
    /keinen Platz/,
  );
  assert.throws(() => create({ ...a4, format: "custom" }), /Breite und Höhe/);
  assert.throws(() => create({ ...a4, width: 300 }), /nur beim freien Format/);
  p = create({ ...a4, format: "custom", width: 1000, height: 297 });
  assert.deepEqual(sheetSize(layoutSheet(p, p.layouts![0]!)), { width: 1000, height: 297 });
  p = run(p, {
    kind: "layout-settings",
    id: "l1",
    name: "Detail 1:20",
    folderId: LAYOUT_COLLECTION_ID,
    masterId: DEFAULT_MASTER_ID,
    sheet: a4,
  });
  assert.deepEqual(p.layouts![0], {
    id: "l1",
    name: "Detail 1:20",
    folderId: LAYOUT_COLLECTION_ID,
    masterId: DEFAULT_MASTER_ID,
  });
  assert.deepEqual(sheetSize(a4), { width: 210, height: 297 });
  assert.deepEqual(sheetSize({ ...a4, orientation: "landscape" }), { width: 297, height: 210 });
});

test("master layouts: following layouts take a changed sheet; a used master stays", () => {
  let p = createStandardProject("p", "eg", "og");
  p = run(p, {
    kind: "create-master",
    id: "m2",
    name: "A1 quer",
    sheet: { ...a4, format: "A1", orientation: "landscape" },
  });
  assert.throws(
    () => run(p, { kind: "create-master", id: "m3", name: "A1 quer", sheet: a4 }),
    /eindeutige Namen/,
  );
  p = run(p, {
    kind: "create-layout",
    id: "l1",
    name: "Lageplan",
    folderId: LAYOUT_COLLECTION_ID,
    masterId: "m2",
  });
  assert.deepEqual(sheetSize(layoutSheet(p, p.layouts![0]!)), { width: 841, height: 594 });
  p = run(p, {
    kind: "master-settings",
    id: "m2",
    name: "A0 quer",
    sheet: { ...a4, format: "A0", orientation: "landscape" },
  });
  assert.deepEqual(sheetSize(layoutSheet(p, p.layouts![0]!)), { width: 1189, height: 841 });
  assert.throws(() => run(p, { kind: "delete-master", id: "m2" }), /von 1 Layout verwendet/);
  p = run(p, { kind: "delete-layout", id: "l1" });
  p = run(p, { kind: "delete-master", id: "m2" });
  assert.deepEqual(
    p.masterLayouts!.map((m) => m.id),
    [DEFAULT_MASTER_ID],
  );
  assert.throws(
    () =>
      changeLayouts(createStandardProject("p", "eg", "og"), p, { kind: "delete-layout", id: "x" }),
    /erneut starten/,
  );
});

test("schema 43 files load without layouts; smuggled layouts are refused", () => {
  const stored = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  assert.equal(loadProjectData({ ...stored, schemaVersion: 43 }).schemaVersion, 67);
  assert.throws(() =>
    loadProjectData({
      ...stored,
      schemaVersion: 43,
      layouts: [
        { id: "l", name: "L", folderId: LAYOUT_COLLECTION_ID, masterId: DEFAULT_MASTER_ID },
      ],
    }),
  );
  const raw = {
    ...stored,
    layouts: [{ id: "l", name: "L", folderId: "missing", masterId: DEFAULT_MASTER_ID }],
  };
  assert.throws(() => validateProject(raw), /Ordner fehlt/);
});

test("a folder gives its layouts with those of its subfolders, in navigator order", () => {
  const library = {
    layoutFolders: [
      { id: LAYOUT_COLLECTION_ID, name: "Sammlung" },
      { id: "a", name: "A" },
      { id: "b", name: "B", parentId: "a" },
    ],
    layouts: [
      { id: "top", folderId: LAYOUT_COLLECTION_ID },
      { id: "in-a", folderId: "a" },
      { id: "in-b", folderId: "b" },
    ],
  } as unknown as Parameters<typeof layoutsInFolder>[0];
  const ids = (id: string) => layoutsInFolder(library, id).map((l) => l.id);
  assert.deepEqual(ids("b"), ["in-b"]);
  assert.deepEqual(ids("a"), ["in-b", "in-a"]);
  assert.deepEqual(ids(LAYOUT_COLLECTION_ID), ["in-b", "in-a", "top"]);
});
