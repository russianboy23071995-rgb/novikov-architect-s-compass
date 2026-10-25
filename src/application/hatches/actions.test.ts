import { withoutOpeningMarks } from "../../test/legacy-project-fixture.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { legacyFixtureJSON, legacyProjectFixture } from "../../test/legacy-project-fixture.ts";
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
  assert.equal(storeyOf(p).hatches.length, 0);
  request.hatch.points[0]!.x = -20;
  assert.equal(storeyOf(preview).hatches[0]!.points[0]!.x, 0);
  const made = commitHatch(history, p, { ...request, hatch: hatch() });
  assert.equal(made.past.length, 1);
  assert.equal(storeyOf(made.present).hatches[0]!.layerId, p.defaultLayerIds.line);
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
  assert.equal(storeyOf(undoProject(made).present).hatches.length, 0);
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
    { ...hatch(), id: storeyOf(p).walls[0]!.id },
    { ...hatch(), id: p.layers[0]!.id },
    { ...hatch(), layerId: "missing" },
  ];
  for (const item of bad)
    assert.throws(() => previewHatch(p, p, { projectId: p.id, kind: "create", hatch: item }));
  assert.equal(storeyOf(p).hatches.length, 0);
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
  assert.equal(storeyOf(p).hatches[0]!.layerId, "custom-hatch");
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
  assert.deepEqual(storeyOf(p).walls, storeyOf(base).walls);
  assert.deepEqual(storeyOf(p).windows, storeyOf(base).windows);
  const date = new Date("2026-10-05T12:00:00Z");
  assert.equal(await exportIfc(p, date), await exportIfc(base, date));
});

test("strict V3 migration preserves visibility and model IDs and never repairs invalid legacy input", () => {
  const p = createExampleProject();
  const { references, hatches, wallTJunctions, wallJoins, ...storey } = storeyOf(p);
  const { assets, hatchPatterns, ...legacyRoot } = p;
  const v3 = {
    ...legacyRoot,
    schemaVersion: 3,
    storey: { ...storey, walls: storey.walls.map(({ bodyOffset, ...wall }) => wall) },
    bimVisibility: { hiddenLayerIds: [p.defaultLayerIds.wall] },
  };
  const before = structuredClone(v3);
  const migrated = loadProjectData(legacyProjectFixture(v3));
  assert.equal(migrated.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.deepEqual(withoutOpeningMarks(storeyOf(migrated)), {
    ...storey,
    references: [],
    hatches: [],
    wallJoins: [],
    wallTJunctions: [],
  });
  assert.deepEqual(migrated.bimVisibility, v3.bimVisibility);
  assert.deepEqual(v3, before);
  assert.throws(() => validateProject(v3));
  assert.throws(() =>
    loadProjectData(
      legacyProjectFixture({ ...v3, bimVisibility: { hiddenLayerIds: ["unknown"] } }),
    ),
  );
  assert.throws(() =>
    loadProjectData(
      legacyProjectFixture({ ...replaceStorey(v3, { ...storey, hatches: [hatch()] }) }),
    ),
  );
  assert.throws(() => validateProject({ ...p, storey }));
});

test("hatch background and contour are atomic, independently switchable and retained by files and history", async () => {
  const initial = createHistory(create(createExampleProject()));
  const base = initial.present;
  const changes = {
    background: { visible: true, color: "#ffffff" },
    contour: { visible: true, color: "#123456" },
  };
  const request = { projectId: base.id, kind: "update" as const, id: "hatch-1", changes };
  const changed = commitHatch(initial, base, request);
  assert.equal(changed.past.length, 1);
  assert.deepEqual(storeyOf(changed.present).hatches[0]!.fill, storeyOf(base).hatches[0]!.fill);
  assert.deepEqual(storeyOf(changed.present).hatches[0]!.points, storeyOf(base).hatches[0]!.points);
  assert.deepEqual(readProjectFile(serializeProject(changed.present)), changed.present);
  assert.deepEqual(undoProject(changed).present, base);
  assert.deepEqual(redoProject(undoProject(changed)).present, changed.present);
  const hidden = previewHatch(changed.present, changed.present, {
    ...request,
    changes: { contour: { ...changes.contour, visible: false } },
  });
  assert.deepEqual(storeyOf(hidden).hatches[0]!.background, changes.background);
  assert.equal(storeyOf(hidden).hatches[0]!.contour.color, "#123456");
  const date = new Date("2026-10-06T12:00:00Z");
  assert.equal(await exportIfc(base, date), await exportIfc(changed.present, date));
});

test("malformed appearance cannot commit or load, including hidden paints and missing schema-7 fields", () => {
  const base = create(createExampleProject());
  for (const key of ["background", "contour"] as const) {
    for (const paint of [
      { visible: true, color: "red" },
      { visible: false, color: "#ffff" },
      { visible: "yes", color: "#ffffff" },
      { visible: true, color: "#ffffff", extra: 1 },
    ]) {
      assert.throws(() =>
        previewHatch(base, base, {
          projectId: base.id,
          kind: "update",
          id: "hatch-1",
          changes: { [key]: paint },
        } as Parameters<typeof previewHatch>[2]),
      );
      const file = structuredClone(base);
      Object.assign(storeyOf(file).hatches[0]!, { [key]: paint });
      assert.throws(() => loadProjectData(legacyProjectFixture(file)));
    }
    const file = structuredClone(base);
    Reflect.deleteProperty(storeyOf(file).hatches[0]!, key);
    assert.throws(() => loadProjectData(legacyProjectFixture(file)));
  }
});

test("V4-V6 hatch migration preserves old fill, contours, layers and appearance without permissive legacy parsing", () => {
  const current = create(createExampleProject());
  for (const version of [4, 5, 6]) {
    const old = JSON.parse(legacyFixtureJSON(current));
    old.schemaVersion = version;
    delete old.assets;
    delete old.hatchPatterns;
    delete storeyOf(old).references;
    delete storeyOf(old).wallTJunctions;
    storeyOf(old).hatches.forEach((h: Record<string, unknown>) => {
      delete h["background"];
      delete h["contour"];
    });
    if (version < 6) delete storeyOf(old).wallJoins;
    if (version < 5)
      storeyOf(old).walls.forEach((w: Record<string, unknown>) => {
        delete w["bodyOffset"];
      });
    const before = legacyFixtureJSON(old);
    const loaded = loadProjectData(legacyProjectFixture(old));
    assert.equal(loaded.schemaVersion, PROJECT_SCHEMA_VERSION);
    assert.deepEqual(storeyOf(loaded).hatches, storeyOf(current).hatches);
    assert.equal(legacyFixtureJSON(old), before);
    storeyOf(old).hatches[0].contour = { visible: true, color: "#ffffff" };
    assert.throws(() => loadProjectData(legacyProjectFixture(old)));
  }
});
