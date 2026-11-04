import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addRoof } from "../roofs/actions.ts";
import {
  addRoofWindow,
  addRoofWindowAt,
  defaultRoofWindowLayerId,
  updateRoofWindow,
} from "./actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { ROOF_DEFAULTS, type Roof } from "../../domain/elements/roof/model.ts";
import { roofBody } from "../../domain/elements/roof/body.ts";
import { roofTopAt, roofUndersideAt } from "../../domain/elements/roof/geometry.ts";
import { roofWindowPlace, roofWindowRings } from "../../domain/elements/roof/window.ts";
import { roofWindowBody } from "../../domain/elements/roof/window-body.ts";
import { buildBuildingSolid } from "../../rendering/viewport/building-solid.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { readProjectFile } from "../../lib/bim/history.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { previewDeleteSelection } from "../elements/delete.ts";
import { copySelection, pasteClipboard } from "../clipboard/clipboard.ts";
import { prepareTranslation } from "../../domain/project/prepared-translation.ts";
import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import type { Project } from "../../domain/project/schema.ts";
import { selectionSummary } from "../../components/cad/demand-menu.ts";
import { roofWindowCentre } from "./actions.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { projectSnapReferences } from "../snapping/project-references.ts";
import { snapPointLabel } from "../snapping/point-label.ts";
import { pickupToolDefaults } from "../tools/pickup.ts";
import { createLayerVisibilityPolicy, ALL_LAYERS_VISIBLE } from "../layers/visibility.ts";
import { addSection } from "../sections/actions.ts";
import { sectionDrawing } from "../../rendering/viewport/section-drawing.ts";
import { roofWindowSettings, roofWindowToolDefaults, roofWindowValues } from "./defaults.ts";
import { derivePlanScene, planSceneRuns } from "../../rendering/viewport/plan-scene.ts";
import { roofPlanView } from "../../rendering/viewport/roof-plan.ts";

// docs/DACHFLAECHENFENSTER.md, L41 Teil D1.
// A 8 × 5 m shed roof, eave along y = 0, rising towards +y with 35°, 24 cm thick.
const roof: Omit<Roof, "layerId"> = {
  id: "dach",
  points: [
    { x: 0, y: 0 },
    { x: 8, y: 0 },
    { x: 8, y: 5 },
    { x: 0, y: 5 },
  ],
  referenceLine: { start: { x: 0, y: 0 }, end: { x: 8, y: 0 } },
  ...ROOF_DEFAULTS,
  referenceHeight: 2.5,
};
const near = (a: number, b: number, eps = 1e-9) => Math.abs(a - b) < eps;

function withWindow(): Project {
  let p = addRoof(createStandardProject("p", "eg", "og"), roof);
  p = addRoofWindow(p, { id: "w1", roofId: "dach", along: 2, slope: 2 });
  return p;
}
const roofOf = (p: Project) => storeyOf(p).roofs![0]!;

test("place: a plan point and its place in the roof plane belong together", () => {
  const r = roofOf(withWindow());
  const place = roofWindowPlace(r, { x: 3, y: 2 });
  assert.ok(near(place.along, 3));
  assert.ok(near(place.slope, 2 / Math.cos((35 * Math.PI) / 180)));
  const rings = roofWindowRings(r, { ...place, width: 0.78, length: 1.18 });
  const cx = rings.top.reduce((n, q) => n + q.x, 0) / 4,
    cy = rings.top.reduce((n, q) => n + q.y, 0) / 4;
  assert.ok(near(cx, 3) && near(cy, 2));
  // The plan length of the opening is the slope length times cos(pitch).
  const ys = rings.top.map((q) => q.y);
  assert.ok(near(Math.max(...ys) - Math.min(...ys), 1.18 * Math.cos((35 * Math.PI) / 180)));
});

test("opening runs perpendicular to the roof surface through its thickness", () => {
  const r = roofOf(withWindow());
  const { top, bottom } = roofWindowRings(r, { along: 2, slope: 2, width: 0.78, length: 1.18 });
  const sin = Math.sin((35 * Math.PI) / 180),
    cos = Math.cos((35 * Math.PI) / 180);
  top.forEach((t, i) => {
    const b = bottom[i]!;
    const d = [b.x - t.x, b.y - t.y, roofUndersideAt(r, b) - roofTopAt(r, t)];
    // Along the inner normal (0, sin, −cos) by the thickness.
    assert.ok(near(d[0]!, 0) && near(d[1]!, 0.24 * sin) && near(d[2]!, -0.24 * cos));
  });
});

test("roof body: the hole takes exactly its volume; without windows the body is unchanged", () => {
  const p = withWindow();
  const r = roofOf(p);
  const plain = roofBody(r, 0);
  const holed = roofBody(r, 0, storeyOf(p).roofWindows!);
  assert.deepEqual(roofBody(r, 0, []), plain);
  // A perpendicular prism: slope area × thickness.
  assert.ok(near(plain.volume - holed.volume, 0.78 * 1.18 * 0.24, 1e-9));
  // Four reveal faces more, each facing into the hole.
  assert.ok(holed.faces.length > plain.faces.length + 4);
});

test("window body: frame through the roof, a pane in the middle; tagged for 3D", () => {
  const p = withWindow();
  const body = roofWindowBody(roofOf(p), storeyOf(p).roofWindows![0]!, 0);
  assert.equal(body.parts.length, 2);
  assert.equal(body.parts[0]!.faces.length, 24);
  assert.ok(body.parts[1]!.faces.every((f) => f.glass));
  const building = buildBuildingSolid(p);
  const faces = building.faces.filter((f) => f.wallId === "w1");
  assert.ok(faces.length === 30 && faces.every((f) => f.roofWindow && f.opening === "window"));
  assert.ok(faces.some((f) => f.glass));
});

test("add: defaults on the Fenster layer; windows must lie in the roof and apart", () => {
  const p = withWindow();
  const w = storeyOf(p).roofWindows![0]!;
  assert.deepEqual(
    { width: w.width, length: w.length, frame: w.frame },
    { width: 0.78, length: 1.18, frame: 0.06 },
  );
  assert.equal(w.layerId, defaultRoofWindowLayerId(p));
  assert.equal(p.layers.find((l) => l.id === w.layerId)!.name, "Fenster");
  const at = addRoofWindowAt(p, { id: "w2", roofId: "dach" }, { x: 6, y: 3 });
  assert.ok(near(storeyOf(at).roofWindows![1]!.along, 6));
  assert.throws(
    () => addRoofWindow(p, { id: "w3", roofId: "dach", along: 2.3, slope: 2 }),
    /überschneiden sich/,
  );
  assert.throws(
    () => addRoofWindow(p, { id: "w3", roofId: "dach", along: 7.8, slope: 2 }),
    /nicht ganz in der Dachfläche/,
  );
  assert.throws(
    () => addRoofWindow(p, { id: "w3", roofId: "x", along: 2, slope: 2 }),
    /Dach fehlt/,
  );
  assert.throws(() => updateRoofWindow(p, "w1", { frame: 0.5 }));
  assert.equal(storeyOf(updateRoofWindow(p, "w1", { width: 1.14 })).roofWindows![0]!.width, 1.14);
});

test("follows its roof: moved with it, deleted with it, copied with it", () => {
  const p = withWindow();
  const moved = prepareTranslation(p, ["dach"]).materialize(p, { x: 1, y: 1 });
  assert.deepEqual(storeyOf(moved).roofWindows, storeyOf(p).roofWindows);
  assert.deepEqual(roofWindowRings(roofOf(moved), storeyOf(moved).roofWindows![0]!).top[0], {
    x: roofWindowRings(roofOf(p), storeyOf(p).roofWindows![0]!).top[0]!.x + 1,
    y: roofWindowRings(roofOf(p), storeyOf(p).roofWindows![0]!).top[0]!.y + 1,
  });
  const removed = previewDeleteSelection(p, [{ kind: "roof", id: "dach" }], undefined).result;
  assert.deepEqual(storeyOf(removed).roofWindows, []);
  // Copied with its roof the window follows the copy; alone it is skipped.
  let n = 0;
  const pasted = pasteClipboard(
    p,
    copySelection(p, [{ kind: "roof", id: "dach" }]),
    () => `c${n++}`,
  );
  const copies = storeyOf(pasted.project).roofWindows!;
  assert.equal(copies.length, 2);
  assert.ok(copies.some((w) => w.roofId !== "dach" && w.id !== "w1"));
  assert.equal(
    copySelection(p, [
      { kind: "roofWindow", id: "w1" },
      { kind: "roof", id: "dach" },
    ]).items.length,
    2,
  );
});

test("schema 55 round-trips; v54 files refuse smuggled roof windows", () => {
  assert.equal(PROJECT_SCHEMA_VERSION, 55);
  const p = withWindow();
  assert.deepEqual(
    storeyOf(readProjectFile(serializeProject(p))).roofWindows,
    storeyOf(p).roofWindows,
  );
  const smuggled = JSON.parse(serializeProject(p));
  assert.throws(() => loadProjectData({ ...smuggled, schemaVersion: 54 }));
  const plain = JSON.parse(serializeProject(addRoof(createStandardProject("p", "eg", "og"), roof)));
  assert.equal(loadProjectData({ ...plain, schemaVersion: 54 }).schemaVersion, 55);
});

test("IFC: opening voids the roof slab, IfcWindow SKYLIGHT fills it", async () => {
  const ifc = await exportIfc(withWindow(), new Date("2026-11-04T12:00:00Z"));
  const lines = ifc.split("\n");
  const windowLine = lines.find((l) => l.includes("=IFCWINDOW(") && l.includes(".SKYLIGHT."));
  assert.ok(windowLine, "skylight window");
  assert.ok(windowLine!.includes(",1.18,0.78,"), "height and width");
  assert.ok(lines.some((l) => l.includes("=IFCOPENINGELEMENT(") && l.includes("Opening w1")));
  assert.equal(lines.filter((l) => l.includes("=IFCRELFILLSELEMENT(")).length, 1);
  assert.ok(ifc.includes("'RoofId',$,IFCTEXT('dach')"));
});

test("menu summary names the roof window with its size and frame", () => {
  assert.deepEqual(selectionSummary(withWindow(), { kind: "roofWindow", id: "w1" }), {
    title: "Dachflächenfenster",
    details: "78 × 118 cm · Rahmen 6 cm",
  });
});

// docs/DACHFLAECHENFENSTER.md, D2: tool settings and plan.
test("tool settings make a roof window and read one back; the plan draws its opening", () => {
  const p = withWindow();
  const defaults = roofWindowToolDefaults(defaultRoofWindowLayerId(p));
  assert.deepEqual(roofWindowValues(defaults), {
    layerId: defaultRoofWindowLayerId(p),
    width: 0.78,
    length: 1.18,
    frame: 0.06,
    renovation: "new",
  });
  const placed = addRoofWindowAt(
    p,
    { id: "w2", roofId: "dach", ...roofWindowValues({ ...defaults, width: 1.14 }) },
    { x: 6, y: 3 },
  );
  assert.equal(roofWindowSettings(storeyOf(placed).roofWindows![1]!).width, 1.14);
  const scene = derivePlanScene(placed, () => true);
  assert.equal(scene.roofWindowViews.get("w2")!.length, 4);
  const runs = planSceneRuns(scene, []).map((r) => r.kind);
  assert.ok(runs.indexOf("roofWindow") > runs.indexOf("roof"));
  // Hidden roof: its windows are not drawn either.
  assert.equal(derivePlanScene(placed, (id) => id !== "dach").roofWindowViews.size, 0);
});

test("roof cut at 1 m gets a hole where it meets a roof window", () => {
  // A low roof whose top passes 1 m: a window on that line is cut by the plan cut.
  const low = { ...roof, referenceHeight: 0.2 };
  let p = addRoof(createStandardProject("p", "eg", "og"), low);
  const plain = roofPlanView(roofOf(p));
  // Top reaches 1 m where run = (1 − 0,2 − 0,24 / cos 35°) / tan 35° ≈ 0,72 m.
  p = addRoofWindowAt(p, { id: "w", roofId: "dach" }, { x: 4, y: 0.72 });
  const holed = roofPlanView(roofOf(p), undefined, storeyOf(p).roofWindows!);
  assert.ok(
    holed.cut.length > plain.cut.length || JSON.stringify(holed.cut) !== JSON.stringify(plain.cut),
  );
});

// docs/DACHFLAECHENFENSTER.md, D3: move in the roof plane, snap points, pipette, section.
test("move: a plan move shifts the window along the eave and up the slope", () => {
  const p = withWindow();
  const cos = Math.cos((35 * Math.PI) / 180);
  const moved = prepareTranslation(p, ["w1"]).materialize(p, { x: 1, y: 0.5 });
  const w = storeyOf(moved).roofWindows![0]!;
  assert.ok(near(w.along, 3) && near(w.slope, 2 + 0.5 / cos));
  assert.deepEqual(storeyOf(moved).roofs, storeyOf(p).roofs);
  // Window and roof together: the roof moves, the window keeps its place in it.
  const both = prepareTranslation(p, ["dach", "w1"]).materialize(p, { x: 1, y: 0.5 });
  assert.deepEqual(storeyOf(both).roofWindows, storeyOf(p).roofWindows);
  // Moved out of the roof: refused.
  assert.throws(() =>
    validateProject(prepareTranslation(p, ["w1"]).materialize(p, { x: 7, y: 0 })),
  );
  assert.deepEqual(
    roofWindowCentre(p, "w1"),
    roofWindowRings(roofOf(p), storeyOf(p).roofWindows![0]!).top.reduce(
      (c, q) => ({ x: c.x + q.x / 4, y: c.y + q.y / 4 }),
      { x: 0, y: 0 },
    ),
  );
});

test("snap points: centre, corners and edge midpoints of the opening, labelled", () => {
  const p = withWindow();
  const refs = projectSnapReferences(p).filter((r) => r.entityId === "w1");
  assert.ok(refs.some((r) => r.feature === "centre"));
  assert.equal(refs.filter((r) => r.feature.startsWith("vertex-")).length, 4);
  assert.equal(snapPointLabel(p, "w1", "centre"), "Dachflächenfenster · Mitte");
  assert.equal(snapPointLabel(p, "w1", "vertex-0"), "Dachflächenfenster · Ecke 1");
});

test("pipette hands size, frame, layer and status to the tool", () => {
  const p = updateRoofWindow(withWindow(), "w1", { width: 1.14, renovation: "existing" });
  const picked = pickupToolDefaults(p, createLayerVisibilityPolicy(p, ALL_LAYERS_VISIBLE), {
    kind: "roofWindow",
    id: "w1",
  });
  assert.equal(picked?.tool, "roofWindow");
  if (picked?.tool !== "roofWindow") throw new Error("Expected roof window");
  assert.deepEqual(picked.values, roofWindowSettings(storeyOf(p).roofWindows![0]!));
});

test("section through a roof window cuts its frame and glass", () => {
  let p = withWindow();
  // Window centre along x = 2: a section along y at x = 2 crosses it.
  p = addSection(p, { id: "s", start: { x: 2, y: -1 }, end: { x: 2, y: 6 }, look: "left" });
  const drawing = sectionDrawing(
    p,
    p.sections!.find((s) => s.id === "s")!,
  );
  assert.ok(
    drawing.cuts.some((c) => c.id === "w1"),
    "window cut",
  );
  assert.ok(
    drawing.cuts.some((c) => c.id === "dach"),
    "roof cut",
  );
});
