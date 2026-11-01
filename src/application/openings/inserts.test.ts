import test from "node:test";
import assert from "node:assert/strict";
import { storeyOf } from "../../domain/storeys/access.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { createProject } from "../projects/create.ts";
import { addWall } from "../walls/actions.ts";
import { addWindow } from "../windows/actions.ts";
import { addDoor } from "../doors/actions.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import {
  checkedDoorInsert,
  checkedWindowInsert,
  DOOR_INSERT_DEFAULTS,
  doorInsertProblem,
  WINDOW_INSERT_DEFAULTS,
  windowInsertProblem,
} from "../../domain/elements/window/insert.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { placeWindow } from "../drawing/window-placement.ts";
import { placeDoor } from "../drawing/door-placement.ts";
import { setOpeningInsert } from "./inserts.ts";

// docs/FENSTER_TUEREN.md, FT1.
const wall = (thickness = 0.24) =>
  addWall(createProject("p", "eg"), {
    id: "w",
    start: { x: 0, y: 0 },
    end: { x: 4, y: 0 },
    thickness,
    height: 2.8,
  });
const opening = { id: "f", wallId: "w", width: 1.2, height: 1.35, sillHeight: 0.9, position: 0.3 };
const door = { id: "d", wallId: "w", position: 0.75, ...DOOR_DEFAULTS };

test("defaults: fixed light 7 × 8 cm in the middle of the wall with sills; door frame 6 cm, leaf 4 cm", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 42);
  assert.deepEqual(WINDOW_INSERT_DEFAULTS, {
    frameWidth: 0.07,
    frameDepth: 0.08,
    location: "centre",
    offset: 0,
    exterior: "right",
    division: "fixed",
    sillInside: { projection: 0.02 },
    sillOutside: { projection: 0.04 },
  });
  assert.deepEqual(DOOR_INSERT_DEFAULTS, { frameWidth: 0.06, leafThickness: 0.04 });
});

test("an element must fit its opening and the wall thickness; the reason is given", () => {
  const w = WINDOW_INSERT_DEFAULTS;
  assert.equal(windowInsertProblem(w, opening, 0.24), null);
  assert.match(windowInsertProblem({ ...w, frameWidth: 0.6 }, opening, 0.24)!, /kein Glas/);
  assert.match(windowInsertProblem(w, opening, 0.06)!, /Wanddicke/);
  assert.equal(
    windowInsertProblem({ ...w, location: "outside", offset: 0.16 }, opening, 0.24),
    null,
  );
  assert.match(
    windowInsertProblem({ ...w, location: "inside", offset: 0.2 }, opening, 0.24)!,
    /Abstand/,
  );
  const d = DOOR_INSERT_DEFAULTS;
  assert.equal(doorInsertProblem(d, door, 0.24), null);
  assert.match(doorInsertProblem({ ...d, frameWidth: 0.6 }, door, 0.24)!, /Durchgang/);
  assert.match(doorInsertProblem({ ...d, frameDepth: 0.3 }, door, 0.24)!, /Wanddicke/);
  assert.match(doorInsertProblem({ ...d, frameDepth: 0.03 }, door, 0.24)!, /dicker/);
  // Input outside the ranges is refused in words.
  assert.throws(() => checkedWindowInsert({ ...w, frameWidth: 0 }), /Rahmenbreite 2–30 cm/);
  assert.throws(() => checkedDoorInsert({ ...d, leafThickness: 0.5 }), /Blattdicke/);
});

test("set, change and remove the element of an opening; refused when it does not fit", () => {
  let p = addDoor(addWindow(wall(), opening), door);
  assert.equal(storeyOf(p).windows[0]!.insert, undefined);
  p = setOpeningInsert(p, { kind: "window", id: "f", insert: WINDOW_INSERT_DEFAULTS });
  p = setOpeningInsert(p, { kind: "door", id: "d", insert: DOOR_INSERT_DEFAULTS });
  assert.deepEqual(storeyOf(p).windows[0]!.insert, WINDOW_INSERT_DEFAULTS);
  assert.deepEqual(storeyOf(p).doors![0]!.insert, DOOR_INSERT_DEFAULTS);
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
  assert.throws(
    () =>
      setOpeningInsert(p, {
        kind: "window",
        id: "f",
        insert: { ...WINDOW_INSERT_DEFAULTS, frameDepth: 0.3 },
      }),
    /Fenster .*Rahmentiefe/,
  );
  const plain = setOpeningInsert(p, { kind: "window", id: "f", insert: null });
  assert.equal("insert" in storeyOf(plain).windows[0]!, false);
  assert.throws(() => setOpeningInsert(p, { kind: "door", id: "nope", insert: null }));
});

test("schema 41 files keep plain openings; smuggled elements in a v41 file are refused", () => {
  const p = addWindow(wall(), opening);
  const stored = JSON.parse(serializeProject(p));
  const loaded = loadProjectData({ ...stored, schemaVersion: 41 });
  assert.equal(loaded.schemaVersion, 42);
  assert.equal(storeyOf(loaded).windows[0]!.insert, undefined);
  const filled = JSON.parse(
    serializeProject(
      setOpeningInsert(p, { kind: "window", id: "f", insert: WINDOW_INSERT_DEFAULTS }),
    ),
  );
  assert.deepEqual(storeyOf(loadProjectData(filled)).windows[0]!.insert, WINDOW_INSERT_DEFAULTS);
  assert.throws(() => loadProjectData({ ...filled, schemaVersion: 41 }));
});

test("the tools place opening and element together; „nur Öffnung“ leaves the opening empty", () => {
  const base = addDoor(wall(), { ...door, id: "d0", position: 0.85 });
  const visibility = createLayerVisibilityPolicy(base, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  const point = { x: 1.2, y: 0.12 };
  const filled = placeWindow(base, base, visibility, "f1", point);
  assert.deepEqual(storeyOf(filled).windows[0]!.insert, WINDOW_INSERT_DEFAULTS);
  const empty = placeWindow(
    base,
    base,
    visibility,
    "f1",
    point,
    undefined,
    undefined,
    undefined,
    null,
  );
  assert.equal(storeyOf(empty).windows[0]!.insert, undefined);
  const withDoor = placeDoor(base, base, visibility, "d1", { x: 2, y: 0.12 });
  assert.deepEqual(storeyOf(withDoor).doors![1]!.insert, DOOR_INSERT_DEFAULTS);
  // The element must fit: a 6 cm partition takes no 8 cm window frame.
  const thin = wall(0.06);
  const thinPolicy = createLayerVisibilityPolicy(thin, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: [],
  });
  assert.throws(
    () => placeWindow(thin, thin, thinPolicy, "f2", { x: 1.2, y: 0.02 }),
    /Rahmentiefe/,
  );
});
