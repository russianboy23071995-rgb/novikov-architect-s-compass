import test from "node:test";
import assert from "node:assert/strict";
import { previewHatch, commitHatch } from "./actions.ts";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { validateProject, serializeProject } from "../../lib/bim/model.ts";
import { createHistory, undoProject, redoProject, readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import {
  previewLayerAssignment,
  previewLayerManagement,
  layerDeletionBlock,
} from "../layers/actions.ts";
import { createLayerVisibilityPolicy } from "../layers/visibility.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";

const hatch = () => ({
  id: "hatch-1",
  points: [
    { x: 0, y: 0 },
    { x: 3, y: 0 },
    { x: 3, y: 2 },
    { x: 0, y: 2 },
  ],
  fill: { color: "#aabbcc", opacity: 0.5 },
});
const create = (p: ReturnType<typeof createExampleProject>) =>
  previewHatch(p, p, { projectId: p.id, kind: "create", hatch: hatch() });

test("hatch preview is isolated; create/update use atomic model history with no-op and undo/redo", () => {
  const history = createHistory(createExampleProject());
  const p = history.present;
  const request = { projectId: p.id, kind: "create" as const, hatch: hatch() };
  const preview = previewHatch(p, p, request);
  assert.equal(p.storey.hatches.length, 0);
  request.hatch.points[0]!.x = -20;
  assert.equal(preview.storey.hatches[0]!.points[0]!.x, 0);
  const made = commitHatch(history, p, { ...request, hatch: hatch() });
  assert.equal(made.past.length, 1);
  assert.equal(made.present.storey.hatches[0]!.layerId, p.defaultLayerIds.line);
  assert.equal(
    commitHatch(made, made.present, {
      projectId: p.id,
      kind: "update",
      id: "hatch-1",
      changes: {},
    }),
    made,
  );
  const changed = commitHatch(made, made.present, {
    projectId: p.id,
    kind: "update",
    id: "hatch-1",
    changes: { fill: { color: "#112233", opacity: 1 } },
  });
  assert.equal(changed.past.length, 2);
  assert.deepEqual(undoProject(changed).present, made.present);
  assert.deepEqual(redoProject(undoProject(changed)).present, changed.present);
  assert.equal(undoProject(made).present.storey.hatches.length, 0);
});

test("invalid geometry, fill, IDs and layers cannot commit a hatch", () => {
  const p = createExampleProject();
  const bad = [
    {
      ...hatch(),
      points: [
        { x: 0, y: 0 },
        { x: 3, y: 2 },
        { x: 0, y: 2 },
        { x: 3, y: 0 },
      ],
    },
    {
      ...hatch(),
      points: [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
    },
    { ...hatch(), fill: { color: "red", opacity: 1 } },
    { ...hatch(), fill: { color: "#ffffff", opacity: 1.1 } },
    { ...hatch(), fill: { color: "#ffffff", opacity: -0.1 } },
    { ...hatch(), fill: { color: "#ffffff", opacity: NaN } },
    { ...hatch(), id: p.storey.walls[0]!.id },
    { ...hatch(), id: p.layers[0]!.id },
    { ...hatch(), layerId: "missing" },
  ];
  for (const item of bad)
    assert.throws(() => previewHatch(p, p, { projectId: p.id, kind: "create", hatch: item }));
  assert.equal(p.storey.hatches.length, 0);
  const q = create(p);
  assert.throws(() => previewHatch(q, q, { projectId: q.id, kind: "create", hatch: hatch() }));
  assert.throws(() =>
    previewHatch(q, q, {
      projectId: q.id,
      kind: "update",
      id: "hatch-1",
      changes: { points: bad[0]!.points },
    }),
  );
});

test("stable target context rejects stale snapshots, wrong projects and unknown targets", () => {
  const p = createExampleProject(),
    q = create(p);
  assert.throws(() => previewHatch(p, q, { projectId: p.id, kind: "create", hatch: hatch() }));
  assert.throws(() =>
    previewHatch(q, q, { projectId: "other", kind: "update", id: "hatch-1", changes: {} }),
  );
  assert.throws(() =>
    previewHatch(q, q, { projectId: q.id, kind: "update", id: "missing", changes: {} }),
  );
});

test("hatches share layer reassignment, occupied-layer protection and visibility", () => {
  let p = createExampleProject();
  p = previewLayerManagement(p, p, { kind: "create", id: "custom-hatch", name: "Schraffuren" });
  p = create(p);
  p = previewLayerAssignment(p, p, {
    projectId: p.id,
    elementIds: ["hatch-1"],
    layerId: "custom-hatch",
  });
  assert.equal(p.storey.hatches[0]!.layerId, "custom-hatch");
  assert.ok(layerDeletionBlock(p, "custom-hatch"));
  assert.throws(() => previewLayerManagement(p, p, { kind: "delete", id: "custom-hatch" }));
  const policy = createLayerVisibilityPolicy(p, {
    scope: { kind: "bim-project" },
    hiddenLayerIds: ["custom-hatch"],
  });
  assert.deepEqual(policy.evaluate(p, policy.context, "hatch-1"), {
    eligible: false,
    reason: "hidden-layer",
  });
});

test("schema 4 roundtrip preserves hatches and BIM; IFC intentionally remains building-only", async () => {
  const base = createExampleProject(),
    p = create(base);
  const loaded = readProjectFile(serializeProject(p));
  assert.deepEqual(loaded, p);
  assert.deepEqual(p.storey.walls, base.storey.walls);
  assert.deepEqual(p.storey.windows, base.storey.windows);
  const date = new Date("2026-10-05T12:00:00Z");
  assert.equal(await exportIfc(p, date), await exportIfc(base, date));
});

test("strict V3 migration preserves visibility and model IDs and never repairs invalid legacy input", () => {
  const p = createExampleProject();
  const { hatches, ...storey } = p.storey;
  const v3 = {
    ...p,
    schemaVersion: 3,
    storey: { ...storey, walls: storey.walls.map(({ bodyOffset, ...wall }) => wall) },
    bimVisibility: { hiddenLayerIds: [p.defaultLayerIds.wall] },
  };
  const before = structuredClone(v3);
  const migrated = loadProjectData(v3);
  assert.equal(migrated.schemaVersion, 5);
  assert.deepEqual(migrated.storey, { ...storey, hatches: [] });
  assert.deepEqual(migrated.bimVisibility, v3.bimVisibility);
  assert.deepEqual(v3, before);
  assert.throws(() => validateProject(v3));
  assert.throws(() => loadProjectData({ ...v3, bimVisibility: { hiddenLayerIds: ["unknown"] } }));
  assert.throws(() => loadProjectData({ ...v3, storey: { ...storey, hatches: [hatch()] } }));
  assert.throws(() => validateProject({ ...p, storey }));
});
