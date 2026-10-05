import { createProject } from "../../lib/bim/model.ts";
import { commitLayerManagement } from "./actions.ts";
import test from "node:test";
import assert from "node:assert/strict";
import { previewLayerAssignment, commitLayerAssignment } from "./actions.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addLine, serializeProject } from "../../lib/bim/model.ts";
import { defaultLineAppearance } from "../../lib/bim/lines.ts";
import { createHistory, undoProject, redoProject, readProjectFile } from "../../lib/bim/history.ts";
import { buildSolid } from "../../lib/bim/geometry.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";

const fixture = () =>
  createHistory(
    addLine(createExampleProject(), {
      id: "line-1",
      kind: "line",
      points: [
        { x: 0, y: 1 },
        { x: 2, y: 1 },
      ],
      ...defaultLineAppearance,
    }),
  );

test("shared assignment previews then commits all element kinds atomically; undo/reload/IFC unchanged", async () => {
  const h = fixture(),
    base = h.present,
    saved = serializeProject(base);
  const request = {
    projectId: base.id,
    elementIds: ["wall-1", "window-1", "line-1"],
    layerId: base.layers.find((l) => l.name === "Neutrale Ebene")!.id,
  };
  const preview = previewLayerAssignment(base, base, request);
  assert.equal(h.past.length, 0);
  assert.equal(serializeProject(base), saved); // discarding preview is cancellation
  const next = commitLayerAssignment(h, base, request);
  assert.equal(next.past.length, 1);
  assert.deepEqual(next.present, preview);
  for (const e of [
    ...next.present.storey.walls,
    ...next.present.storey.windows,
    ...next.present.storey.lines!,
  ])
    assert.equal(e.layerId, request.layerId);
  assert.equal(next.present.storey.windows[0]!.wallId, "wall-1");
  assert.deepEqual(buildSolid(next.present), buildSolid(base));
  const date = new Date("2026-10-04T00:00:00Z");
  assert.equal(await exportIfc(next.present, date), await exportIfc(base, date));
  assert.deepEqual(undoProject(next).present, base);
  assert.deepEqual(redoProject(undoProject(next)).present, next.present);
  assert.deepEqual(readProjectFile(serializeProject(next.present)), next.present);
  assert.equal(commitLayerAssignment(next, next.present, request), next);
});

test("invalid, mixed and stale targets cannot partially commit", () => {
  const h = fixture(),
    base = h.present,
    saved = serializeProject(base);
  const request = {
    projectId: base.id,
    elementIds: ["wall-1"],
    layerId: base.defaultLayerIds.line,
  };
  for (const bad of [
    { ...request, elementIds: ["wall-1", "missing"] },
    { ...request, elementIds: [base.storey.id] },
    { ...request, elementIds: [] },
    { ...request, projectId: "other" },
    { ...request, layerId: "missing" },
  ])
    assert.throws(() => commitLayerAssignment(h, base, bad));
  const next = commitLayerAssignment(h, base, request);
  assert.throws(() => commitLayerAssignment(next, base, request));
  assert.throws(() => commitLayerAssignment(h, structuredClone(base), request));
  assert.equal(serializeProject(base), saved);
  assert.equal(h.past.length, 0);
  assert.equal(next.present.storey.windows[0]!.layerId, base.defaultLayerIds.window);
});

test("create and rename layers retain assignments/defaults through history and files", () => {
  const h = fixture(),
    base = h.present;
  const created = commitLayerManagement(h, base, {
    kind: "create",
    id: "custom-layer",
    name: "  Bestand  ",
  });
  assert.equal(created.present.layers.at(-1)!.name, "Bestand");
  assert.equal(created.past.length, 1);
  const assigned = commitLayerAssignment(created, created.present, {
    projectId: base.id,
    elementIds: ["wall-1"],
    layerId: "custom-layer",
  });
  const renamed = commitLayerManagement(assigned, assigned.present, {
    kind: "rename",
    id: "custom-layer",
    name: "Altbau",
  });
  assert.equal(renamed.present.storey.walls[0]!.layerId, "custom-layer");
  assert.deepEqual(renamed.present.defaultLayerIds, base.defaultLayerIds);
  assert.deepEqual(undoProject(renamed).present, assigned.present);
  assert.deepEqual(redoProject(undoProject(renamed)).present, renamed.present);
  assert.deepEqual(readProjectFile(serializeProject(renamed.present)), renamed.present);
  const noop = commitLayerManagement(renamed, renamed.present, {
    kind: "rename",
    id: "custom-layer",
    name: " Altbau ",
  });
  assert.equal(noop, renamed);
  const standard = commitLayerManagement(h, base, {
    kind: "rename",
    id: base.defaultLayerIds.wall,
    name: "Fassade",
  });
  assert.equal(standard.present.storey.walls[0]!.layerId, base.defaultLayerIds.wall);
  assert.equal(standard.present.defaultLayerIds.wall, base.defaultLayerIds.wall);
});

test("layer management rejects empty/duplicate names, colliding IDs and stale contexts atomically", () => {
  const h = fixture(),
    base = h.present;
  for (const request of [
    { kind: "create" as const, id: "custom", name: " " },
    { kind: "create" as const, id: "custom", name: " außenwand " },
    { kind: "create" as const, id: base.id, name: "Bestand" },
    { kind: "create" as const, id: "", name: "Bestand" },
    { kind: "rename" as const, id: "missing", name: "Bestand" },
    { kind: "rename" as const, id: base.defaultLayerIds.wall, name: "Fenster" },
  ])
    assert.throws(() => commitLayerManagement(h, base, request));
  assert.throws(() =>
    commitLayerManagement(h, structuredClone(base), {
      kind: "create",
      id: "custom",
      name: "Bestand",
    }),
  );
  assert.equal(h.past.length, 0);
  assert.equal(h.present, base);
});

test("existing duplicate display names remain loadable and can be disambiguated by stable ID", () => {
  const p = fixture().present;
  p.layers[0]!.name = "Bestand";
  p.layers[1]!.name = "Bestand";
  const h = createHistory(readProjectFile(serializeProject(p)));
  assert.equal(
    commitLayerManagement(h, h.present, { kind: "rename", id: p.layers[0]!.id, name: "Bestand" }),
    h,
  );
  const next = commitLayerManagement(h, h.present, {
    kind: "rename",
    id: p.layers[1]!.id,
    name: "Bestand innen",
  });
  assert.equal(next.present.layers[0]!.name, "Bestand");
  assert.equal(next.present.layers[1]!.name, "Bestand innen");
});

test("only empty custom layers can be deleted; undo and file roundtrip preserve protection", () => {
  const h = fixture(),
    base = h.present;
  const created = commitLayerManagement(h, base, {
    kind: "create",
    id: "custom-empty",
    name: "Leer",
  });
  const removed = commitLayerManagement(created, created.present, {
    kind: "delete",
    id: "custom-empty",
  });
  assert.equal(
    removed.present.layers.some((l) => l.id === "custom-empty"),
    false,
  );
  assert.deepEqual(undoProject(removed).present, created.present);
  assert.deepEqual(redoProject(undoProject(removed)).present, removed.present);
  assert.deepEqual(readProjectFile(serializeProject(removed.present)), removed.present);
  for (const layer of base.layers)
    assert.throws(
      () => commitLayerManagement(h, base, { kind: "delete", id: layer.id }),
      /Standardebenen/,
    );
  const renamed = commitLayerManagement(h, base, {
    kind: "rename",
    id: "layer:roof",
    name: "Anderer Dachname",
  });
  const loaded = createHistory(readProjectFile(serializeProject(renamed.present)));
  assert.throws(
    () => commitLayerManagement(loaded, loaded.present, { kind: "delete", id: "layer:roof" }),
    /Standardebenen/,
  );
  for (const id of ["wall-1", "window-1", "line-1"]) {
    const assigned = commitLayerAssignment(created, created.present, {
      projectId: base.id,
      elementIds: [id],
      layerId: "custom-empty",
    });
    assert.throws(
      () =>
        commitLayerManagement(assigned, assigned.present, { kind: "delete", id: "custom-empty" }),
      /enthält Elemente/,
    );
    assert.equal(
      assigned.present.layers.some((l) => l.id === "custom-empty"),
      true,
    );
  }
  assert.throws(
    () => commitLayerManagement(created, base, { kind: "delete", id: "custom-empty" }),
    /geändert/,
  );
  assert.throws(() => commitLayerManagement(h, base, { kind: "delete", id: "missing" }));
});

test("migration-suffixed standard identities remain protected and reserved", () => {
  const p = createProject("layer:roof", "storey");
  const h = createHistory(p);
  const roof = p.layers.find((l) => l.name === "Dach")!;
  assert.equal(roof.id, "layer:roof:1");
  assert.throws(
    () => commitLayerManagement(h, h.present, { kind: "delete", id: roof.id }),
    /Standardebenen/,
  );
  assert.throws(
    () =>
      commitLayerManagement(h, h.present, { kind: "create", id: "layer:roof:9", name: "Eigen" }),
    /reserviert/,
  );
});
