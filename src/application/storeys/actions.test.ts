import { legacyProjectFixture } from "../../test/legacy-project-fixture.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { updateWall, serializeProject, validateProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import {
  renameStorey,
  setStoreyHeight,
  setGroundDatum,
  addStorey,
  changeBuilding,
} from "./actions.ts";
import { exportIfc, stepString } from "../../lib/bim/ifc.ts";
import { createProjectRecoveryCodec } from "../../interop/project-file/recovery-codec.ts";
import type { RecoveryDocument } from "../project-files/recovery-v2.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";

test("EG datum retains height and geometry with undo, file and recovery roundtrip", async () => {
  const initial = createExampleProject();
  const p = setStoreyHeight(initial, initial, {
    projectId: initial.id,
    storeyId: storeyOf(initial).id,
    height: 3,
  });
  const request = { projectId: p.id, storeyId: storeyOf(p).id, elevation: 0.5 };
  const next = setGroundDatum(p, p, request);
  assert.deepEqual(storeyOf(next), storeyOf(p));
  assert.equal(
    resolveStoreyLevels([storeyOf(next)], storeyOf(next).id, next.groundDatum)[0]!.upperElevation,
    3.5,
  );
  assert.equal(setGroundDatum(next, next, request), next);
  for (const elevation of [NaN, Infinity, Number.MAX_VALUE])
    assert.throws(() => setGroundDatum(p, p, { ...request, elevation }));
  assert.throws(() => setGroundDatum(p, next, request));
  assert.throws(() => setGroundDatum(p, p, { ...request, storeyId: "foreign" }));
  assert.throws(() => setGroundDatum(p, p, { ...request, projectId: "foreign" }));
  assert.equal(setGroundDatum(p, p, { ...request, elevation: -1 }).groundDatum, -1);
  let state = createEditingState(p);
  state = editingReducer(state, { type: "set-ground-datum", base: state.history.present, request });
  assert.equal(state.error, "");
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, { type: "undo" });
  assert.equal(state.history.present.groundDatum, 0);
  state = editingReducer(state, { type: "redo" });
  assert.deepEqual(state.history.present, next);
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  const codec = createProjectRecoveryCodec();
  assert.deepEqual(await codec.restore(await codec.prepare(next)), next);
  const { groundDatum: _datum, ...old } = p;
  assert.deepEqual(
    readProjectFile(JSON.stringify(legacyProjectFixture({ ...old, schemaVersion: 22 }))),
    p,
  );
  assert.throws(() => readProjectFile(JSON.stringify({ ...p, schemaVersion: 22 })));
});

test("storey rename is one undo step, retains identity/geometry and rejects stale context", () => {
  const p = createExampleProject();
  const request = { projectId: p.id, storeyId: storeyOf(p).id, name: "  Erdgeschoss Süd  " };
  const next = renameStorey(p, p, request);
  assert.equal(storeyOf(next).name, "Erdgeschoss Süd");
  assert.deepEqual({ ...storeyOf(next), name: storeyOf(p).name }, storeyOf(p));
  assert.equal(storeyOf(next).id, storeyOf(p).id);
  let state = createEditingState(p);
  state = editingReducer(state, { type: "rename-storey", base: state.history.present, request });
  assert.equal(state.error, "");
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, { type: "undo" });
  assert.equal(storeyOf(state.history.present).name, storeyOf(p).name);
  state = editingReducer(state, { type: "redo" });
  assert.equal(storeyOf(state.history.present).name, storeyOf(next).name);
  assert.equal(renameStorey(next, next, { ...request, name: storeyOf(next).name }), next);
  for (const name of [" ", "x".repeat(121)])
    assert.throws(() => renameStorey(p, p, { ...request, name }));
  assert.throws(() => renameStorey(p, { ...p }, request));
  assert.throws(() => renameStorey(p, p, { ...request, projectId: "foreign" }));
  assert.throws(() => renameStorey(p, p, { ...request, storeyId: "missing" }));
  assert.equal(storeyOf(p).name, "Level 01");
});

test("schema20 files and recovery migrate explicitly; current format stays strict", async () => {
  const p = createExampleProject();
  p.assets.push({
    id: "image-a",
    mimeType: "image/png",
    pixelWidth: 1,
    pixelHeight: 1,
    data: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWZsAAAAASUVORK5CYII=",
  });
  const { name: _name, height: _height, ...storey } = storeyOf(p);
  const { groundDatum: _datum, storeys: _storeys, groundStoreyId: _ground, ...legacyProject } = p;
  const old = { ...legacyProject, schemaVersion: 20, storey };
  const before = JSON.stringify(old);
  const loaded = readProjectFile(before);
  assert.deepEqual(loaded, p);
  assert.equal(JSON.stringify(old), before);
  assert.throws(() => validateProject(old));
  assert.throws(() =>
    readProjectFile(JSON.stringify({ ...replaceStorey(old, { ...storey, name: "unexpected" }) })),
  );
  assert.throws(() => validateProject({ ...p, storey }));
  const codec = createProjectRecoveryCodec();
  const doc = await codec.prepare(p);
  const {
    groundDatum: _modelDatum,
    storeys: _storeysModel,
    groundStoreyId: _groundModel,
    ...legacyModel
  } = doc.model;
  const legacy = {
    ...doc,
    model: { ...legacyModel, schemaVersion: 20, storey },
  } as unknown as RecoveryDocument;
  assert.deepEqual(await codec.restore(legacy), p);
  const key = legacy.model.assets[0]!.key;
  await assert.rejects(
    codec.restore({
      ...legacy,
      blobs: { ...legacy.blobs, [key]: { ...legacy.blobs[key]!, pixelWidth: 2 } },
    }),
  );
  await assert.rejects(
    codec.restore({
      ...legacy,
      model: { ...legacy.model, schemaVersion: 99 },
    } as unknown as RecoveryDocument),
  );
  const next = renameStorey(p, p, {
    projectId: p.id,
    storeyId: storeyOf(p).id,
    name: "EG Süd 'A'",
  });
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  assert.deepEqual(await codec.restore(await codec.prepare(next)), next);
});

test("IFC names use escaped labels while GlobalIds and geometry remain identical", async () => {
  const p = createExampleProject(),
    name = "EG Süd 'A'";
  const next = renameStorey(p, p, { projectId: p.id, storeyId: storeyOf(p).id, name });
  const time = new Date("2026-10-13T00:00:00Z");
  const oldIfc = await exportIfc(p, time),
    newIfc = await exportIfc(next, time);
  assert.equal(newIfc, oldIfc.replace(stepString(storeyOf(p).name), stepString(name)));
});

test("storey height uses model undo, rejects stale/invalid input and preserves fixed geometry", async () => {
  const p = createExampleProject();
  const request = { projectId: p.id, storeyId: storeyOf(p).id, height: 3.2 };
  const next = setStoreyHeight(p, p, request);
  assert.equal(storeyOf(next).height, 3.2);
  assert.deepEqual({ ...storeyOf(next), height: null }, storeyOf(p));
  assert.equal(setStoreyHeight(next, next, request), next);
  for (const height of [0, -3, NaN, Infinity, null as unknown as number])
    assert.throws(() => setStoreyHeight(p, p, { ...request, height }));
  assert.throws(() => setStoreyHeight(p, next, request));
  assert.throws(() => setStoreyHeight(p, p, { ...request, projectId: "foreign" }));
  assert.throws(() => setStoreyHeight(p, p, { ...request, storeyId: "unknown" }));
  let state = createEditingState(p);
  state = editingReducer(state, {
    type: "set-storey-height",
    base: state.history.present,
    request,
  });
  assert.equal(state.error, "");
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, { type: "undo" });
  assert.equal(storeyOf(state.history.present).height, null);
  state = editingReducer(state, { type: "redo" });
  assert.equal(storeyOf(state.history.present).height, 3.2);
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  const codec = createProjectRecoveryCodec();
  assert.deepEqual(await codec.restore(await codec.prepare(next)), next);
  const time = new Date("2026-10-13T00:00:00Z");
  assert.equal(await exportIfc(next, time), await exportIfc(p, time));
});

test("schema21 migrates unknown storey height through file and recovery without invented defaults", async () => {
  const p = createExampleProject();
  const { height: _height, ...storey } = storeyOf(p);
  const { groundDatum: _datum, storeys: _storeys, groundStoreyId: _ground, ...legacyProject } = p;
  const old = { ...legacyProject, schemaVersion: 21, storey };
  assert.deepEqual(readProjectFile(JSON.stringify(old)), p);
  assert.throws(() =>
    readProjectFile(JSON.stringify({ ...replaceStorey(old, { ...storey, height: 3 }) })),
  );
  assert.throws(() => validateProject({ ...p, storey }));
  const codec = createProjectRecoveryCodec();
  const doc = await codec.prepare(p);
  const {
    groundDatum: _modelDatum,
    storeys: _storeysModel,
    groundStoreyId: _groundModel,
    ...legacyModel
  } = doc.model;
  assert.deepEqual(
    await codec.restore({
      ...doc,
      model: { ...legacyModel, schemaVersion: 21, storey },
    } as unknown as RecoveryDocument),
    p,
  );
});

// Structural storey insertion is one shared operation, independent of the UI.
test("insert above and below, edit heights and datum while preserving geometry and names", async () => {
  const initial = createExampleProject();
  let p = setStoreyHeight(initial, initial, {
    projectId: initial.id,
    storeyId: initial.groundStoreyId,
    height: 3,
  });
  const insert = (anchor: string, side: "above" | "below", id: string, height: number) => {
    p = addStorey(p, p, { projectId: p.id, storeyId: anchor, side, id, height });
  };
  insert(p.groundStoreyId, "above", "og1", 3.2);
  insert(p.groundStoreyId, "below", "ug1", 2.8);
  insert("og1", "above", "og2", 3.1);
  insert("ug1", "below", "ug2", 2.5);
  assert.deepEqual(
    p.storeys.map((s) => s.name),
    ["-2. Kellergeschoss", "-1. Kellergeschoss", "Level 01", "1. Obergeschoss", "2. Obergeschoss"],
  );
  assert.deepEqual(
    resolveStoreyLevels(p.storeys, p.groundStoreyId).map((s) => s.elevation),
    [-5.3, -2.8, 0, 3, 6.2],
  );
  assert.deepEqual(storeyOf(p).walls, storeyOf(initial).walls);
  p = renameStorey(p, p, { projectId: p.id, storeyId: "og1", name: "Atelier" });
  insert(p.groundStoreyId, "above", "middle", 2.7);
  assert.equal(p.storeys.find((s) => s.id === "og1")!.name, "Atelier");
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "ug1", height: 3.2 });
  const levels = resolveStoreyLevels(p.storeys, p.groundStoreyId);
  assert.equal(levels.find((s) => s.storeyId === "ug2")!.elevation, -5.7);
  assert.equal(levels.find((s) => s.storeyId === "og1")!.elevation, 5.7);
  p = changeBuilding(p, p, {
    kind: "elevation",
    request: { projectId: p.id, storeyId: "middle", elevation: 3.5 },
  });
  assert.equal(storeyOf(p).height, 3.5);
  assert.equal(
    resolveStoreyLevels(p.storeys, p.groundStoreyId).find((s) => s.storeyId === "og1")!.elevation,
    6.2,
  );
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
  assert.equal("storey" in JSON.parse(serializeProject(p)), false);
  const codec = createProjectRecoveryCodec();
  assert.deepEqual(await codec.restore(await codec.prepare(p)), p);
  const ifc = await exportIfc(p, new Date("2026-10-13T00:00:00Z"));
  assert.equal((ifc.match(/=IFCBUILDINGSTOREY\(/g) ?? []).length, 6);
  assert.match(ifc, /IFCWALL\(/);
});

test("insert is atomic undo/redo, rejects stale targets, ID collisions and invalid heights", () => {
  let state = createEditingState(createExampleProject());
  const p = state.history.present;
  const request = {
    projectId: p.id,
    storeyId: p.groundStoreyId,
    side: "below" as const,
    id: "ug",
    height: 2.8,
  };
  for (const height of [0, -1, NaN, Infinity])
    assert.throws(() => addStorey(p, p, { ...request, height }));
  for (const id of [p.groundStoreyId, "wall-1", p.layers[0]!.id])
    assert.throws(() => addStorey(p, p, { ...request, id }));
  assert.throws(() => addStorey(p, { ...p }, request));
  assert.throws(() => addStorey(p, p, { ...request, storeyId: "foreign" }));
  assert.throws(() => addStorey(p, p, { ...request, side: "above" })); // unknown EG height
  state = editingReducer(state, { type: "building", base: p, change: { kind: "insert", request } });
  assert.equal(state.error, "");
  assert.equal(state.history.past.length, 1);
  assert.equal(state.history.present.storeys.length, 2);
  state = editingReducer(state, { type: "undo" });
  assert.deepEqual(state.history.present, p);
  state = editingReducer(state, { type: "redo" });
  assert.equal(state.history.present.storeys.length, 2);
  assert.equal(p.storeys.length, 1);
});

test("all storeys are validated: cross-floor host, duplicate element and unresolved views reject", () => {
  const initial = createExampleProject();
  const p = addStorey(initial, initial, {
    projectId: initial.id,
    storeyId: initial.groundStoreyId,
    side: "below",
    id: "ug",
    height: 3,
  });
  assert.throws(() =>
    validateProject({
      ...p,
      storeys: p.storeys.map((s) => (s.id === "ug" ? { ...s, windows: storeyOf(p).windows } : s)),
    }),
  );
  assert.throws(() =>
    validateProject({
      ...p,
      storeys: p.storeys.map((s) => (s.id === "ug" ? { ...s, walls: storeyOf(p).walls } : s)),
    }),
  );
  assert.throws(() => validateProject({ ...p, groundStoreyId: "missing" }));
});

test("ground-floor editing preserves other storeys and their geometry", async () => {
  const initial = createExampleProject();
  const added = addStorey(initial, initial, {
    projectId: initial.id,
    storeyId: initial.groundStoreyId,
    side: "below",
    id: "basement",
    height: 2.8,
  });
  const other = {
    ...added.storeys[0]!,
    walls: [{ ...storeyOf(added).walls[0]!, id: "basement-wall" }],
  };
  const project = validateProject({ ...added, storeys: [other, storeyOf(added)] });
  const edited = updateWall(project, "wall-1", { height: 3.1 });
  assert.deepEqual(edited.storeys[0], project.storeys[0]);
  assert.equal(storeyOf(edited).walls[0]!.height, 3.1);
  assert.deepEqual(readProjectFile(serializeProject(edited)), edited);
  const ifc = await exportIfc(edited);
  assert.equal((ifc.match(/=IFCWALL\(/g) ?? []).length, 2);
  assert.equal((ifc.match(/=IFCBUILDINGSTOREY\(/g) ?? []).length, 2);
});
