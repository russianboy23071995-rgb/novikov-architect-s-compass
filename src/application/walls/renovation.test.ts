import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { setWallRenovation } from "./renovation.ts";
import { createDrawing } from "../drawing/actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { wallRenovation } from "../../domain/elements/wall/renovation.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";

// docs/BAUZUSTAND.md, S2.
const wall = (p: ReturnType<typeof createExampleProject>, id = "wall-1") =>
  storeyOf(p).walls.find((w) => w.id === id)!;

test("walls without a status are Bestand; the status is set, kept and round-trips", () => {
  const base = createExampleProject();
  assert.equal(wall(base).renovation, undefined);
  assert.equal(wallRenovation(wall(base)), "existing");
  const next = setWallRenovation(base, ["wall-1"], "demolish");
  assert.equal(wall(next).renovation, "demolish");
  assert.equal(wall(base).renovation, undefined, "input untouched");
  assert.deepEqual(wall(next).start, wall(base).start);
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  assert.throws(() => setWallRenovation(base, ["nope"], "new"), /Unbekannte Wand/);
  assert.throws(() => setWallRenovation(base, [], "new"), /mindestens eine Wand/);
});

test("drawn walls take the status of the tool defaults", () => {
  const base = createExampleProject();
  const drawn = createDrawing(base, base, "w-new", {
    kind: "wall",
    start: { x: 0, y: 5 },
    end: { x: 4, y: 5 },
    thickness: 0.24,
    height: 2.5,
    renovation: "new",
  });
  assert.equal(wall(drawn, "w-new").renovation, "new");
});

test("schema 35 files load as Bestand; a smuggled status in a v35 file is refused", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 40);
  const stored = JSON.parse(serializeProject(createExampleProject()));
  const v35 = { ...stored, schemaVersion: 35 };
  const loaded = loadProjectData(v35);
  assert.equal(loaded.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.equal(wall(loaded).renovation, undefined);
  const smuggled = structuredClone(v35);
  smuggled.storeys[0].walls[0].renovation = "new";
  assert.throws(() => loadProjectData(smuggled));
  const unknown = JSON.parse(serializeProject(createExampleProject()));
  unknown.storeys[0].walls[0].renovation = "temporary";
  assert.throws(() => loadProjectData(unknown));
});

test("IFC carries Pset_WallCommon.Status and the own Renovation entry", async () => {
  const project = setWallRenovation(createExampleProject(), ["wall-1"], "new");
  const ifc = await exportIfc(project, new Date("2026-10-31T12:00:00Z"));
  assert.ok(ifc.includes("'Pset_WallCommon'"));
  assert.ok(ifc.includes("'Status',$,IFCLABEL('NEW')"));
  assert.ok(ifc.includes("'Renovation',$,IFCLABEL('new')"));
  const plain = await exportIfc(createExampleProject(), new Date("2026-10-31T12:00:00Z"));
  assert.ok(plain.includes("'Status',$,IFCLABEL('EXISTING')"));
});
