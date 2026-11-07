import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addObject, defaultObjectLayerId, updateObject } from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  objectBoxes,
  objectOutline,
  objectPoint,
  objectSymbol,
} from "../../domain/elements/object/model.ts";
import {
  OBJECT_CATALOG,
  OBJECT_CATALOG_IDS,
  OBJECT_CATEGORIES,
} from "../../domain/elements/object/catalog.ts";
import { objectBody } from "../../rendering/viewport/object-solid.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { copySelection } from "../clipboard/clipboard.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import type { Project } from "../../domain/project/schema.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import { snapPointLabel } from "../snapping/point-label.ts";
import { addSection } from "../sections/actions.ts";
import { sectionDrawing } from "../../rendering/viewport/section-drawing.ts";
import { selectionSummary } from "../../components/cad/demand-menu.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";

// docs/OBJEKTBIBLIOTHEK.md, L44 Teil O1.
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

function furnished(): Project {
  let p = createStandardProject("p", "eg", "og");
  p = addObject(p, { id: "bett", catalogId: "bed-double", position: { x: 2, y: 3 } });
  p = addObject(p, {
    id: "wc",
    catalogId: "wc",
    position: { x: 5, y: 1 },
    rotation: 90,
    renovation: "new",
  });
  return p;
}

test("catalogue: 22 own objects in four categories, every box and symbol inside the unit box", () => {
  assert.equal(OBJECT_CATALOG_IDS.length, 22);
  const inUnit = (u: number) => u >= -0.5 - 1e-9 && u <= 0.5 + 1e-9;
  for (const id of OBJECT_CATALOG_IDS) {
    const d = OBJECT_CATALOG[id];
    assert.ok(d.category in OBJECT_CATEGORIES, id);
    assert.ok(d.boxes.length > 0 && d.symbol.length > 0, id);
    for (const [u0, u1, v0, v1, z0, z1] of d.boxes) {
      assert.ok(inUnit(u0) && inUnit(u1) && inUnit(v0) && inUnit(v1), `${id} box in plan`);
      assert.ok(u0 < u1 && v0 < v1 && z0 < z1 && z0 >= 0, `${id} box order`);
    }
    for (const part of d.symbol)
      if (part.kind === "poly") assert.ok(part.points.every(([u, v]) => inUnit(u) && inUnit(v)));
      else
        assert.ok(
          inUnit(part.centre[0] - part.radius[0]) &&
            inUnit(part.centre[0] + part.radius[0]) &&
            inUnit(part.centre[1] - part.radius[1]) &&
            inUnit(part.centre[1] + part.radius[1]),
          `${id} ellipse`,
        );
  }
  const counts = Object.keys(OBJECT_CATEGORIES).map(
    (c) => OBJECT_CATALOG_IDS.filter((id) => OBJECT_CATALOG[id].category === c).length,
  );
  assert.deepEqual(counts, [12, 4, 4, 2]);
});

test("place: centre, rotation and mirror turn the unit box into plan", () => {
  const o = { position: { x: 1, y: 2 }, rotation: 90, width: 2, depth: 1 };
  // u across the width, v front to back; 90° turns +x to +y.
  const p = objectPoint(o, 0.5, 0);
  assert.ok(near(p.x, 1) && near(p.y, 3));
  const m = objectPoint({ ...o, mirrored: true }, 0.5, 0);
  assert.ok(near(m.x, 1) && near(m.y, 1));
  // Outline counterclockwise, mirrored or not.
  for (const mirrored of [false, true]) {
    const ring = objectOutline({ ...o, mirrored });
    let area = 0;
    ring.forEach((a, i) => {
      const b = ring[(i + 1) % 4]!;
      area += a.x * b.y - b.x * a.y;
    });
    assert.ok(near(area / 2, 2), `area ${area / 2}`);
  }
  // The symbol follows: an ellipse is 24 points, the WC bowl stays inside its box.
  const wc = objectSymbol({ ...o, catalogId: "wc", width: 0.4, depth: 0.65 });
  assert.equal(wc[1]!.points.length, 24);
});

test("add: catalogue size on the Möblierung layer; checked values; delete and copy", () => {
  const p = furnished();
  const bett = storeyOf(p).objects![0]!;
  assert.deepEqual(
    { ...bett, layerId: undefined },
    {
      id: "bett",
      catalogId: "bed-double",
      position: { x: 2, y: 3 },
      rotation: 0,
      width: 1.8,
      depth: 2,
      height: 0.45,
      baseOffset: 0,
      layerId: undefined,
    },
  );
  assert.equal(bett.layerId, defaultObjectLayerId(p));
  assert.equal(p.layers.find((l) => l.id === bett.layerId)!.name, "Möblierung");
  const changed = updateObject(p, "bett", { width: 1.6, mirrored: true });
  assert.equal(storeyOf(changed).objects![0]!.width, 1.6);
  assert.throws(() => updateObject(p, "x", { width: 1 }), /Unbekanntes Objekt/);
  assert.throws(() => updateObject(p, "bett", { width: 0.05 }));
  assert.throws(() => updateObject(p, "bett", { height: 6 }));
  assert.throws(() => updateObject(p, "bett", { layerId: "missing" }), /Unknown layer/);
  assert.throws(() =>
    addObject(p, { id: "x", catalogId: "piano" as "wc", position: { x: 0, y: 0 } }),
  );
  assert.throws(() => addObject(p, { id: "bett", catalogId: "wc", position: { x: 0, y: 0 } }));
  const removed = previewDeleteSelection(p, [{ kind: "object", id: "bett" }], undefined).result;
  assert.deepEqual(
    storeyOf(removed).objects!.map((o) => o.id),
    ["wc"],
  );
  assert.equal(copySelection(p, [{ kind: "object", id: "wc" }]).items.length, 1);
});

test("schema 57: files round-trip; v56 files refuse smuggled objects", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 67);
  const p = furnished();
  assert.deepEqual(storeyOf(readProjectFile(serializeProject(p))).objects, storeyOf(p).objects);
  const smuggled = JSON.parse(serializeProject(p));
  assert.throws(() => loadProjectData({ ...smuggled, schemaVersion: 56 }));
  const plain = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  assert.equal(loadProjectData({ ...plain, schemaVersion: 56 }).schemaVersion, 67);
});

test("3D: closed parts, tagged as object, on the storey floor", () => {
  const p = furnished();
  const bett = storeyOf(p).objects![0]!;
  const body = objectBody(bett, 3);
  assert.ok(body.faces.length > 12);
  assert.ok(body.faces.every((f) => f.object && f.vertices.every((v) => v[2] >= 3 - 1e-9)));
  // Rails, mattress, headboard and duvet of a double bed.
  assert.ok(body.volume > 1.8 * 1.9 * 0.3, String(body.volume));
  const boxes = objectBoxes({ ...bett, baseOffset: 0.4 });
  assert.ok(near(boxes[0]!.bottom, 0.4) && near(boxes[0]!.top, 0.85));
  const building = buildBuildingSolid(p);
  assert.ok(building.faces.filter((f) => f.wallId === "wc").every((f) => f.object));
  assert.ok(building.faces.some((f) => f.wallId === "bett"));
});

test("IFC: furniture and sanitary terminals with their predefined type and values", async () => {
  const ifc = await exportIfc(furnished(), new Date("2026-11-05T12:00:00Z"));
  const lines = ifc.split("\n");
  const bed = lines.find((l) => l.includes("=IFCFURNITURE("));
  assert.ok(bed?.includes(".BED.") && bed.includes("'Doppelbett'"), bed);
  const wc = lines.find((l) => l.includes("=IFCSANITARYTERMINAL("));
  assert.ok(wc?.includes(".TOILETPAN."), wc);
  assert.ok(ifc.includes("'Catalog',$,IFCLABEL('bed-double')"));
  assert.ok(ifc.includes("'Rotation',$,IFCREAL(90.)"));
  assert.ok(ifc.includes("'Renovation',$,IFCLABEL('new')"));
  // The WC body: tank and bowl, one swept rectangle each.
  assert.equal(
    lines.filter((l) => l.includes("IFCSHAPEREPRESENTATION(") && l.includes("'SweptSolid'"))
      .length >= 2,
    true,
  );
});

test("plan: symbol and outline in an object run beneath the walls; hidden objects drop out", () => {
  const p = furnished();
  const scene = derivePlanScene(p, () => true);
  const view = scene.objectViews.get("bett")!;
  assert.equal(view.outline.length, 4);
  assert.equal(view.symbol.length, OBJECT_CATALOG["bed-double"].symbol.length);
  const kinds = planSceneRuns(scene, []).map((r) => r.kind);
  assert.ok(kinds.includes("object"));
  assert.equal(derivePlanScene(p, (id) => id !== "bett").objects.size, 1);
});

test("move, snap and menu: whole object; corners, edges and centre; catalogue name", () => {
  const p = furnished();
  const moved = prepareTranslation(p, ["wc"]).materialize(p, { x: 1, y: -0.5 });
  assert.deepEqual(storeyOf(moved).objects![1]!.position, { x: 6, y: 0.5 });
  assert.deepEqual(storeyOf(moved).objects![0]!.position, { x: 2, y: 3 });
  const refs = projectSnapReferences(p).filter((r) => r.entityId === "bett");
  assert.ok(refs.some((r) => r.feature === "centre" && near(r.point.x, 2) && near(r.point.y, 3)));
  assert.ok(refs.some((r) => near(r.point.x, 1.1) && near(r.point.y, 2)));
  assert.equal(snapPointLabel(p, "bett", "centre"), "Objekt · Mitte");
  assert.deepEqual(selectionSummary(p, { kind: "object", id: "wc" }), {
    title: "WC",
    details: "40 × 65 × 80 cm · 90°",
  });
});

test("section: an object crossing the line is cut", () => {
  let p = furnished();
  p = addSection(p, { id: "s", start: { x: 2, y: 0 }, end: { x: 2, y: 6 }, look: "left" });
  const drawing = sectionDrawing(
    p,
    p.sections!.find((s) => s.id === "s")!,
  );
  assert.ok(drawing.cuts.some((c) => c.id === "bett"));
});
