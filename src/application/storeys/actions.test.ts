import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { serializeProject, validateProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { createEditingState, editingReducer } from "../direct-edit/controller.ts";
import { renameStorey, setStoreyHeight, setGroundDatum } from "./actions.ts";
import { exportIfc, stepString } from "../../lib/bim/ifc.ts";
import { createProjectRecoveryCodec } from "../../interop/project-file/recovery-codec.ts";
import type { RecoveryDocument } from "../project-files/recovery-v2.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";

test("EG datum retains height and geometry with undo, file and recovery roundtrip", async () => {
  const initial = createExampleProject();
  const p = setStoreyHeight(initial, initial, {
    projectId: initial.id,
    storeyId: initial.storey.id,
    height: 3,
  });
  const request = { projectId: p.id, storeyId: p.storey.id, elevation: 0.5 };
  const next = setGroundDatum(p, p, request);
  assert.deepEqual(next.storey, p.storey);
  assert.equal(
    resolveStoreyLevels([next.storey], next.storey.id, next.groundDatum)[0]!.upperElevation,
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
  assert.deepEqual(readProjectFile(JSON.stringify({ ...old, schemaVersion: 22 })), p);
  assert.throws(() => readProjectFile(JSON.stringify({ ...p, schemaVersion: 22 })));
});

test("storey rename is one undo step, retains identity/geometry and rejects stale context", () => {
  const p = createExampleProject();
  const request = { projectId: p.id, storeyId: p.storey.id, name: "  Erdgeschoss Süd  " };
  const next = renameStorey(p, p, request);
  assert.equal(next.storey.name, "Erdgeschoss Süd");
  assert.deepEqual({ ...next.storey, name: p.storey.name }, p.storey);
  assert.equal(next.storey.id, p.storey.id);
  let state = createEditingState(p);
  state = editingReducer(state, { type: "rename-storey", base: state.history.present, request });
  assert.equal(state.error, "");
  assert.equal(state.history.past.length, 1);
  state = editingReducer(state, { type: "undo" });
  assert.equal(state.history.present.storey.name, p.storey.name);
  state = editingReducer(state, { type: "redo" });
  assert.equal(state.history.present.storey.name, next.storey.name);
  assert.equal(renameStorey(next, next, { ...request, name: next.storey.name }), next);
  for (const name of [" ", "x".repeat(121)])
    assert.throws(() => renameStorey(p, p, { ...request, name }));
  assert.throws(() => renameStorey(p, { ...p }, request));
  assert.throws(() => renameStorey(p, p, { ...request, projectId: "foreign" }));
  assert.throws(() => renameStorey(p, p, { ...request, storeyId: "missing" }));
  assert.equal(p.storey.name, "Level 01");
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
  const { name: _name, height: _height, ...storey } = p.storey;
  const { groundDatum: _datum, ...legacyProject } = p;
  const old = { ...legacyProject, schemaVersion: 20, storey };
  const before = JSON.stringify(old);
  const loaded = readProjectFile(before);
  assert.deepEqual(loaded, p);
  assert.equal(JSON.stringify(old), before);
  assert.throws(() => validateProject(old));
  assert.throws(() =>
    readProjectFile(JSON.stringify({ ...old, storey: { ...storey, name: "unexpected" } })),
  );
  assert.throws(() => validateProject({ ...p, storey }));
  const codec = createProjectRecoveryCodec();
  const doc = await codec.prepare(p);
  const { groundDatum: _modelDatum, ...legacyModel } = doc.model;
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
  const next = renameStorey(p, p, { projectId: p.id, storeyId: p.storey.id, name: "EG Süd 'A'" });
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  assert.deepEqual(await codec.restore(await codec.prepare(next)), next);
});

test("IFC names use escaped labels while GlobalIds and geometry remain identical", async () => {
  const p = createExampleProject(),
    name = "EG Süd 'A'";
  const next = renameStorey(p, p, { projectId: p.id, storeyId: p.storey.id, name });
  const time = new Date("2026-10-13T00:00:00Z");
  const oldIfc = await exportIfc(p, time),
    newIfc = await exportIfc(next, time);
  assert.equal(newIfc, oldIfc.replace(stepString(p.storey.name), stepString(name)));
});

test("storey height uses model undo, rejects stale/invalid input and preserves fixed geometry", async () => {
  const p = createExampleProject();
  const request = { projectId: p.id, storeyId: p.storey.id, height: 3.2 };
  const next = setStoreyHeight(p, p, request);
  assert.equal(next.storey.height, 3.2);
  assert.deepEqual({ ...next.storey, height: null }, p.storey);
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
  assert.equal(state.history.present.storey.height, null);
  state = editingReducer(state, { type: "redo" });
  assert.equal(state.history.present.storey.height, 3.2);
  assert.deepEqual(readProjectFile(serializeProject(next)), next);
  const codec = createProjectRecoveryCodec();
  assert.deepEqual(await codec.restore(await codec.prepare(next)), next);
  const time = new Date("2026-10-13T00:00:00Z");
  assert.equal(await exportIfc(next, time), await exportIfc(p, time));
});

test("schema21 migrates unknown storey height through file and recovery without invented defaults", async () => {
  const p = createExampleProject();
  const { height: _height, ...storey } = p.storey;
  const { groundDatum: _datum, ...legacyProject } = p;
  const old = { ...legacyProject, schemaVersion: 21, storey };
  assert.deepEqual(readProjectFile(JSON.stringify(old)), p);
  assert.throws(() =>
    readProjectFile(JSON.stringify({ ...old, storey: { ...storey, height: 3 } })),
  );
  assert.throws(() => validateProject({ ...p, storey }));
  const codec = createProjectRecoveryCodec();
  const doc = await codec.prepare(p);
  const { groundDatum: _modelDatum, ...legacyModel } = doc.model;
  assert.deepEqual(
    await codec.restore({
      ...doc,
      model: { ...legacyModel, schemaVersion: 21, storey },
    } as unknown as RecoveryDocument),
    p,
  );
});
