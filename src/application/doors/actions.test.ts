import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import {
  addWall,
  createProject,
  serializeProject,
  updateWall,
  validateProject,
  type Project,
} from "../../lib/bim/model.ts";
import {
  readProjectFile,
  createHistory,
  commitProject,
  undoProject,
} from "../../lib/bim/history.ts";
import { buildBuildingSolid } from "../../lib/bim/geometry.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { ELEMENT_KINDS, storeyElements } from "../../domain/elements/registry.ts";
import { addDoor, updateDoor } from "./actions.ts";

function wallProject(): Project {
  return addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness: 0.24,
    height: 2.8,
  });
}
const door = (changes: Partial<Parameters<typeof addDoor>[1]> = {}) => ({
  id: "d",
  wallId: "w",
  position: 0.5,
  ...DOOR_DEFAULTS,
  ...changes,
});

test("a door defaults to the Rohbaumaß opening on the standard Tür layer and round-trips", () => {
  const p = addDoor(wallProject(), door());
  const placed = storeyOf(p).doors![0]!;
  assert.equal(placed.width, 1.01);
  assert.equal(placed.height, 2.135);
  assert.equal(placed.layerId, "layer:door");
  assert.deepEqual(storeyElements(storeyOf(p), "door"), [placed]);
  assert.equal(ELEMENT_KINDS.door.label, "Tür");
  const reopened = readProjectFile(serializeProject(p));
  assert.equal(reopened.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(reopened, p);
});

test("width and height are free but must fit the host wall; zOffset is storey-relative", () => {
  const p = addDoor(wallProject(), door({ width: 1.26, height: 2.5, zOffset: 0.2 }));
  assert.equal(storeyOf(p).doors![0]!.zOffset, 0.2);
  assert.throws(() => addDoor(wallProject(), door({ width: 4.5 })), /Wandlänge/);
  assert.throws(() => addDoor(wallProject(), door({ zOffset: 0.8 })), /Wandhöhe/);
  assert.throws(() => addDoor(wallProject(), door({ zOffset: -0.1 })), /Wandhöhe/);
  // A raised wall lifts its usable range; the door underside stays storey-relative.
  const raised = updateWall(wallProject(), "w", { baseOffset: 0.3 });
  assert.throws(() => addDoor(raised, door({ zOffset: 0 })), /Wandhöhe/);
  assert.equal(storeyOf(addDoor(raised, door({ zOffset: 0.3 }))).doors!.length, 1);
  assert.throws(() => addDoor(wallProject(), door({ wallId: "missing" })), /unbekannte Wand/);
});

test("hinge and swing side are editable; one undo per change; IDs stay unique", () => {
  const h0 = createHistory(addDoor(wallProject(), door()));
  const h1 = commitProject(h0, updateDoor(h0.present, "d", { hinge: "end", opensTo: "right" }));
  assert.equal(storeyOf(h1.present).doors![0]!.hinge, "end");
  assert.equal(storeyOf(h1.present).doors![0]!.opensTo, "right");
  assert.equal(undoProject(h1).present, h0.present);
  assert.throws(() => addDoor(h0.present, door()), /Duplicate ID/);
  assert.throws(() => updateDoor(h0.present, "d", { hinge: "middle" as never }));
});

test("a door cuts its opening through the 3D wall and blocks joined wall ends", () => {
  const plain = buildBuildingSolid(wallProject());
  const withDoor = buildBuildingSolid(addDoor(wallProject(), door()));
  assert.notEqual(withDoor.faces.length, plain.faces.length);
  // Near a joined end the shared opening rule names the door.
  const corner = addWall(wallProject(), {
    id: "w2",
    start: { x: 4, y: 0 },
    end: { x: 4, y: 4 },
    thickness: 0.24,
    height: 2.8,
  });
  assert.equal(storeyOf(corner).wallJoins.length, 1);
  const valid = validateProject(corner);
  assert.throws(() => addDoor(valid, door({ position: 0.87 })), /Tür darf einen Wandabschluss/);
});

test("schema 26 files migrate without doors and cannot smuggle doors in", () => {
  const raw = JSON.parse(serializeProject(wallProject()));
  raw.schemaVersion = 26;
  assert.deepEqual(readProjectFile(JSON.stringify(raw)).storeys[0]!.doors, undefined);
  raw.storeys[0].doors = [{ ...door(), layerId: "layer:door" }];
  assert.throws(() => readProjectFile(JSON.stringify(raw)));
});
