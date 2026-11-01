import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addColumn, defaultColumnLayerId, updateColumn } from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  columnLevels,
  columnOutline,
  COLUMN_DEFAULTS,
} from "../../domain/elements/column/model.ts";
import { columnBody } from "../../rendering/viewport/column-solid.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import type { Project } from "../../domain/project/schema.ts";
import { columnSettings, columnToolDefaults, columnValues } from "./defaults.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import { snapPointLabel } from "../snapping/point-label.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { selectionSummary } from "../../components/cad/demand-menu.ts";
import { columnAcceptanceProject } from "../../../benchmarks/column-ifc-acceptance.ts";

// docs/STUETZEN.md, L05 Teil 1.
const column = (p: Project, id: string) => (storeyOf(p).columns ?? []).find((c) => c.id === id)!;

function withColumns(): Project {
  let p = createStandardProject("p", "eg", "og");
  p = addColumn(p, { id: "s1", position: { x: 2, y: 3 }, shape: COLUMN_DEFAULTS.rectangle });
  p = addColumn(p, {
    id: "s2",
    position: { x: 6, y: 3 },
    shape: COLUMN_DEFAULTS.circle,
    height: 2.5,
    renovation: "new",
  });
  return p;
}

test("columns sit on the Stütze layer; without a height they are bound to the storey", () => {
  const p = withColumns();
  assert.equal(column(p, "s1").layerId, defaultColumnLayerId(p));
  assert.equal(p.layers.find((l) => l.id === defaultColumnLayerId(p))!.name, "Stütze");
  assert.deepEqual(column(p, "s1").topBinding, { kind: "storey", topOffset: 0 });
  assert.equal(column(p, "s1").height, undefined);
  const storeyHeight = storeyOf(p).height;
  assert.deepEqual(columnLevels(column(p, "s1"), storeyHeight), {
    bottom: 0,
    top: storeyHeight!,
  });
  assert.deepEqual(columnLevels(column(p, "s2"), storeyHeight), { bottom: 0, top: 2.5 });
  assert.deepEqual(readProjectFile(serializeProject(p)), p);
});

test("a fixed height releases the binding and back; invalid columns are refused", () => {
  const p = withColumns();
  const fixed = updateColumn(p, "s1", { height: 3.1 });
  assert.equal(column(fixed, "s1").topBinding, undefined);
  assert.equal(column(fixed, "s1").height, 3.1);
  const bound = updateColumn(fixed, "s1", { topBinding: { kind: "storey", topOffset: -0.2 } });
  assert.equal(column(bound, "s1").height, undefined);
  assert.throws(() => updateColumn(p, "s1", { baseOffset: 10 }), /Oberkante/);
  assert.throws(() => updateColumn(p, "nope", { rotation: 10 }), /Unbekannte Stütze/);
  assert.throws(() => updateColumn(p, "s1", { layerId: "missing" }), /Unknown layer/);
  assert.throws(() =>
    addColumn(p, { id: "s3", position: { x: 0, y: 0 }, shape: { kind: "circle", diameter: 0 } }),
  );
});

test("outline and 3D body: rotated rectangle, round prism, volume", () => {
  const rect = {
    position: { x: 0, y: 0 },
    shape: { kind: "rectangle" as const, width: 0.4, depth: 0.2 },
  };
  const turned = columnOutline({ ...rect, rotation: 90 });
  assert.ok(Math.abs(turned[0]!.x - 0.1) < 1e-12 && Math.abs(turned[0]!.y + 0.2) < 1e-12);
  const body = columnBody(
    { id: "c", ...rect, rotation: 30, baseOffset: 0.5, height: 2 },
    10,
    null,
  )!;
  assert.ok(Math.abs(body.volume - 0.4 * 0.2 * 2) < 1e-12);
  assert.ok(body.faces.every((f) => f.column && f.wallId === "c"));
  const z = body.faces.flatMap((f) => f.vertices.map((v) => v[2]));
  assert.deepEqual([Math.min(...z), Math.max(...z)], [10.5, 12.5]);
  const round = columnBody(
    {
      id: "r",
      position: { x: 0, y: 0 },
      shape: { kind: "circle", diameter: 0.3 },
      rotation: 0,
      baseOffset: 0,
      topBinding: { kind: "storey", topOffset: 0 },
    },
    0,
    3,
  )!;
  assert.ok(Math.abs(round.volume - Math.PI * 0.15 ** 2 * 3) < 0.01);
  assert.equal(
    columnBody(
      {
        id: "r",
        position: { x: 0, y: 0 },
        shape: { kind: "circle", diameter: 0.3 },
        rotation: 0,
        baseOffset: 0,
        topBinding: { kind: "storey", topOffset: 0 },
      },
      0,
      null,
    ),
    null,
  );
  const building = buildBuildingSolid(withColumns());
  assert.ok(building.faces.some((f) => "column" in f && f.wallId === "s2"));
});

test("schema 36 files get the Stütze layer; smuggled columns are refused; delete works", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 41);
  const stored = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  stored.layers = stored.layers.filter((l: { name: string }) => l.name !== "Stütze");
  const loaded = loadProjectData({ ...stored, schemaVersion: 36 });
  assert.equal(loaded.schemaVersion, PROJECT_SCHEMA_VERSION);
  assert.ok(loaded.layers.some((l) => l.id === "layer:column" && l.name === "Stütze"));
  const smuggled = JSON.parse(serializeProject(withColumns()));
  assert.throws(() => loadProjectData({ ...smuggled, schemaVersion: 36 }));
  const p = withColumns();
  const removed = previewDeleteSelection(p, [{ kind: "column", id: "s1" }], undefined).result;
  assert.deepEqual(
    (storeyOf(removed).columns ?? []).map((c) => c.id),
    ["s2"],
  );
});

test("IFC: IfcColumn with rectangle and circle profile, status and height", async () => {
  const ifc = await exportIfc(withColumns(), new Date("2026-10-31T12:00:00Z"));
  assert.equal(ifc.split("\n").filter((l) => l.includes("=IFCCOLUMN(")).length, 2);
  assert.ok(ifc.includes("IFCRECTANGLEPROFILEDEF(.AREA.,$,"));
  assert.ok(ifc.includes("IFCCIRCLEPROFILEDEF(.AREA.,$,"));
  assert.ok(ifc.includes("'Pset_ColumnCommon'"));
  assert.ok(ifc.includes("'Status',$,IFCLABEL('NEW')"));
  assert.ok(ifc.includes("'Status',$,IFCLABEL('EXISTING')"));
  assert.ok(ifc.includes("'Height',$,IFCLENGTHMEASURE(2.5)"));
});

// docs/STUETZEN.md, P2: tool settings and plan cut.
test("tool settings make a column and read one back; both section sizes are kept", () => {
  const p = createStandardProject("p", "eg", "og");
  const defaults = columnToolDefaults(defaultColumnLayerId(p));
  assert.deepEqual(columnValues(defaults), {
    layerId: defaultColumnLayerId(p),
    shape: { kind: "rectangle", width: 0.3, depth: 0.3 },
    rotation: 0,
    baseOffset: 0,
    topBinding: { kind: "storey", topOffset: 0 },
    renovation: "new",
  });
  const round = {
    ...defaults,
    kind: "circle" as const,
    diameter: 0.5,
    heightMode: "fixed" as const,
    height: 2.2,
  };
  const placed = addColumn(p, { id: "c", position: { x: 1, y: 1 }, ...columnValues(round) });
  const back = columnSettings(column(placed, "c"));
  assert.equal(back.kind, "circle");
  assert.equal(back.diameter, 0.5);
  assert.equal(back.heightMode, "fixed");
  assert.equal(back.height, 2.2);
  assert.deepEqual(columnValues(back), columnValues(round));
});

test("plan: a column through the 1 m cut is filled, one above it only outlined", () => {
  let p = withColumns();
  p = addColumn(p, {
    id: "high",
    position: { x: 4, y: 4 },
    shape: COLUMN_DEFAULTS.rectangle,
    baseOffset: 1.5,
    height: 1,
  });
  const scene = derivePlanScene(p, () => true);
  assert.equal(scene.columnViews.get("s1")!.cut, true);
  assert.equal(scene.columnViews.get("high")!.cut, false);
  assert.equal(scene.columnViews.get("s2")!.outline.length, 32);
  assert.ok(planSceneRuns(scene, []).some((r) => r.kind === "column" && r.ids.length === 3));
});

// docs/STUETZEN.md, P3: move, snap points, pipette, menu summary, Archicad file.
test("a column moves with its centre; others stay; one checked change", () => {
  const p = withColumns();
  const moved = prepareTranslation(p, ["s1"]).materialize(p, { x: 1.5, y: -0.5 });
  assert.deepEqual(column(moved, "s1").position, { x: 3.5, y: 2.5 });
  assert.deepEqual(column(moved, "s2").position, column(p, "s2").position);
  assert.deepEqual(column(moved, "s1").shape, column(p, "s1").shape);
});

test("snap points: centre, rectangle corners and rim points of a round column", () => {
  const p = withColumns();
  const refs = projectSnapReferences(p);
  const of = (id: string) => refs.filter((r) => r.entityId === id);
  assert.deepEqual(of("s1").find((r) => r.feature === "centre")!.point, { x: 2, y: 3 });
  assert.equal(of("s1").filter((r) => r.feature.startsWith("vertex-")).length, 4);
  assert.equal(of("s2").filter((r) => r.feature.startsWith("quadrant-")).length, 4);
  assert.equal(snapPointLabel(p, "s1", "centre"), "Stütze · Mitte");
  assert.equal(snapPointLabel(p, "s1", "vertex-2"), "Stütze · Ecke 3");
  assert.equal(snapPointLabel(p, "s2", "quadrant-1"), "Stütze · Rand");
});

test("pipette hands every column setting to the tool; the menu names the column", () => {
  const p = withColumns();
  const picked = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "column",
    id: "s2",
  });
  assert.equal(picked?.tool, "column");
  if (picked?.tool !== "column") throw new Error("Expected column");
  assert.deepEqual(columnValues(picked.values), columnValues(columnSettings(column(p, "s2"))));
  assert.deepEqual(selectionSummary(p, { kind: "column", id: "s2" }), {
    title: "Stütze",
    details: "Rund Ø 0,30 m · Höhe 2,50 m",
  });
});

test("Archicad acceptance file: four columns, ring of walls, valid IFC", async () => {
  const p = columnAcceptanceProject();
  assert.equal(storeyOf(p).columns!.length, 4);
  const ifc = await exportIfc(p, new Date("2026-10-31T12:00:00Z"));
  assert.equal(ifc.split("\n").filter((l) => l.includes("=IFCCOLUMN(")).length, 4);
  assert.ok(ifc.includes("'Status',$,IFCLABEL('DEMOLISH')"));
});
