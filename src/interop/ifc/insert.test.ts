import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { updateWall } from "../../application/walls/actions.ts";
import { addDoor } from "../../application/doors/actions.ts";
import { addWindow } from "../../application/windows/actions.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import {
  DOOR_INSERT_DEFAULTS,
  WINDOW_INSERT_DEFAULTS,
} from "../../domain/elements/window/insert.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { ifcGuid, stepString } from "./writer.ts";

// docs/FENSTER_TUEREN.md, FT4. Example wall 0,36 m thick, made 8 m long.
const date = new Date("2026-11-01T12:00:00Z");
const rows = (ifc: string, entity: string) =>
  ifc.split("\n").filter((line) => line.includes(`=${entity}(`));
const byRef = (ifc: string) =>
  new Map(ifc.split("\n").flatMap((l) => (l.startsWith("#") ? [[l.split("=")[0]!, l]] : [])));

const project = () =>
  addDoor(
    addWindow(updateWall(createExampleProject(), "wall-1", { end: { x: 8, y: 0 } }), {
      id: "window-2",
      wallId: "wall-1",
      width: 1.2,
      height: 1.35,
      sillHeight: 0.9,
      position: 0.55,
      insert: WINDOW_INSERT_DEFAULTS,
    }),
    {
      id: "door-1",
      wallId: "wall-1",
      position: 0.85,
      ...DOOR_DEFAULTS,
      opensTo: "right",
      insert: DOOR_INSERT_DEFAULTS,
    },
  );

test("a window element exports its frame, glass and boards as the IfcWindow body", async () => {
  const p = project();
  const ifc = await exportIfc(p, date);
  const refs = byRef(ifc);
  const windowGuid = await ifcGuid(p.id, "window", "window-2");
  const window = rows(ifc, "IFCWINDOW").find((r) => r.includes(windowGuid))!;
  // The plain example window keeps no body; the element has one.
  const plainGuid = await ifcGuid(p.id, "window", "window-1");
  assert.match(
    rows(ifc, "IFCWINDOW").find((r) => r.includes(plainGuid))!,
    /,\$,'window-1',/,
  );
  const shapeRef = window.match(/\),?(#\d+),'window-2'/)?.[1] ?? window.split(",")[6]!;
  const shape = refs.get(shapeRef)!;
  assert.match(shape, /IFCPRODUCTDEFINITIONSHAPE/);
  const representation = refs.get(shape.match(/\((#\d+)\)/)![1]!)!;
  const solids = representation.match(/\(([^()]*)\)\);$/)![1]!.split(",");
  // Two jambs, two rails, the glass, two boards.
  assert.equal(solids.length, 7);
  const parts = solids.map((s) => refs.get(refs.get(s)!.match(/\((#\d+),/)![1]!)!);
  assert.deepEqual(parts.map((p) => p.match(/\.AREA\.,'(\w+)'/)![1]).sort(), [
    "glass",
    "jamb",
    "jamb",
    "rail",
    "rail",
    "sill",
    "sill",
  ]);
  // The glass is 1,06 × 0,024 m, centred in the opening frame (opening 1,2 m wide).
  const glass = parts.find((p) => p.includes("'glass'"))!;
  assert.match(glass, /,1\.06,0\.024\);$/);
  // Lining on the window type: depth 8 cm, thickness 7 cm; no placeholder flag.
  const [lining] = rows(ifc, "IFCWINDOWLININGPROPERTIES");
  assert.match(lining!, /,\$,\$,\$,0\.08,0\.07,\$/);
  // Its property sets start with the lining, the panel follows (FL4).
  const type = rows(ifc, "IFCWINDOWTYPE").find((r) => r.includes(`(${lining!.split("=")[0]},`));
  assert.ok(type);
  assert.ok(ifc.includes("'FrameWidth',$,IFCLENGTHMEASURE(0.07)"));
  assert.ok(ifc.includes("'FrameLocation',$,IFCLABEL('centre')"));
  assert.ok(!ifc.includes("PlaceholderBody"));
});

test("a door element exports frame and leaf in the turned door frame with its lining", async () => {
  const p = project();
  const ifc = await exportIfc(p, date);
  const refs = byRef(ifc);
  const door = rows(ifc, "IFCDOOR").find((r) => r.includes("'door-1'"))!;
  const shape = refs.get(door.split(",")[6]!)!;
  const representation = refs.get(shape.match(/\((#\d+)\)/)![1]!)!;
  const solids = representation.match(/\(([^()]*)\)\);$/)![1]!.split(",");
  assert.equal(solids.length, 4);
  const parts = solids.map((s) => refs.get(refs.get(s)!.match(/\((#\d+),/)![1]!)!);
  // Opening to the right turns the door placement: the leaf lies at local y > 0, flush with
  // the swing face (wall half thickness 0,18, leaf 4 cm: centre 0,16).
  const leaf = parts.find((p) => p.includes("'leaf'"))!;
  const centre = refs.get(leaf.match(/'leaf',(#\d+)/)![1]!)!;
  const point = refs.get(centre.match(/\((#\d+),/)![1]!)!;
  assert.match(point, /\(0\.505,0\.16\)/);
  const [lining] = rows(ifc, "IFCDOORLININGPROPERTIES");
  assert.match(lining!, /,\$,\$,\$,0\.36,0\.06,\$/);
  assert.equal(lining!.split(",").length, 17);
  assert.ok(ifc.includes("'LeafThickness',$,IFCLENGTHMEASURE(0.04)"));
});

test("element parts carry surface styles: glass 70 % transparent, frames white, door wooden", async () => {
  // docs/FENSTER_TUEREN.md, G1: Archicad showed unstyled glass as opaque grey.
  const ifc = await exportIfc(project(), date);
  const refs = byRef(ifc);
  const styles = rows(ifc, "IFCSURFACESTYLE");
  // Names as STEP strings (the ü is encoded).
  assert.deepEqual(
    styles.map((s) => s.match(/IFCSURFACESTYLE\(('[^']+')/)![1]).sort(),
    [stepString("Fensterrahmen"), stepString("Glas"), stepString("Tür")].sort(),
  );
  const glass = styles.find((s) => s.includes("'Glas'"))!;
  const rendering = refs.get(glass.match(/\((#\d+)\)\);$/)![1]!)!;
  assert.match(rendering, /IFCSURFACESTYLERENDERING\(#\d+,0\.7,\$,\$,\$,\$,\$,\$,\.NOTDEFINED\.\)/);
  // Every element part is styled: 7 window parts and 4 door parts.
  const styled = rows(ifc, "IFCSTYLEDITEM");
  assert.equal(styled.length, 11);
  const glassRef = glass.split("=")[0]!;
  const glassSolids = styled.filter((s) => s.includes(`(${glassRef})`));
  assert.equal(glassSolids.length, 1);
  const solid = refs.get(glassSolids[0]!.match(/IFCSTYLEDITEM\((#\d+),/)![1]!)!;
  const profile = refs.get(solid.match(/\((#\d+),/)![1]!)!;
  assert.match(profile, /'glass'/);
});

test("sashes in IFC: partitioning, one panel per sash with its operation, values in NOVIKOV_BIM", async () => {
  // docs/FENSTER_TUEREN.md, FL4.
  const { withDivision } = await import("../../domain/elements/window/insert.ts");
  const { panelOperation, windowPanels, windowPartitioning } = await import("./writer.ts");
  assert.equal(panelOperation({ operation: "turn", hinge: "left" }), "SIDEHUNGLEFTHAND");
  assert.equal(panelOperation({ operation: "turn-tilt", hinge: "right" }), "TILTANDTURNRIGHTHAND");
  assert.equal(panelOperation({ operation: "tilt", hinge: "left" }), "BOTTOMHUNG");
  const double = withDivision(WINDOW_INSERT_DEFAULTS, "double");
  assert.equal(windowPartitioning(double), "DOUBLE_PANEL_VERTICAL");
  assert.deepEqual(windowPanels(double), [
    { operation: "SIDEHUNGLEFTHAND", position: "LEFT" },
    { operation: "TILTANDTURNRIGHTHAND", position: "RIGHT" },
  ]);
  const transom = withDivision(WINDOW_INSERT_DEFAULTS, "transom");
  assert.equal(windowPartitioning(transom), "DOUBLE_PANEL_HORIZONTAL");
  assert.deepEqual(windowPanels(transom), [
    { operation: "FIXEDCASEMENT", position: "TOP" },
    { operation: "TILTANDTURNLEFTHAND", position: "BOTTOM" },
  ]);
  assert.deepEqual(windowPanels(WINDOW_INSERT_DEFAULTS), [
    { operation: "FIXEDCASEMENT", position: "MIDDLE" },
  ]);
  // Export: the window, its type and two panels with the sash frame (8 cm deep, 6 cm wide).
  const p = addWindow(updateWall(createExampleProject(), "wall-1", { end: { x: 8, y: 0 } }), {
    id: "window-2",
    wallId: "wall-1",
    width: 1.2,
    height: 1.35,
    sillHeight: 0.9,
    position: 0.55,
    insert: double,
  });
  const ifc = await exportIfc(p, date);
  const window = rows(ifc, "IFCWINDOW").find((r) => r.includes("'window-2'"))!;
  assert.match(window, /,\.WINDOW\.,\.DOUBLE_PANEL_VERTICAL\.,\$\);$/);
  const panels = rows(ifc, "IFCWINDOWPANELPROPERTIES");
  assert.equal(panels.length, 2);
  assert.match(panels[0]!, /,\$,\$,\$,\.SIDEHUNGLEFTHAND\.,\.LEFT\.,0\.08,0\.06,\$\);$/);
  assert.match(panels[1]!, /\.TILTANDTURNRIGHTHAND\.,\.RIGHT\./);
  assert.equal(panels[0]!.split(",").length, 9);
  const type = rows(ifc, "IFCWINDOWTYPE")[0]!;
  assert.match(type, /\.WINDOW\.,\.DOUBLE_PANEL_VERTICAL\.,\.F\.,\$\);$/);
  for (const panel of panels) assert.ok(type.includes(panel.split("=")[0]!));
  assert.ok(ifc.includes("'Sashes',$,IFCLABEL('turn/left; turn-tilt/right')"));
  assert.ok(ifc.includes("'MullionWidth',$,IFCLENGTHMEASURE(0.08)"));
  // The body carries the sash parts: 2 jambs, 2 rails, mullion, 8 sash members, 2 panes, 2 boards.
  assert.equal(
    rows(ifc, "IFCRECTANGLEPROFILEDEF").filter((r) => /'(sash|mullion)'/.test(r)).length,
    9,
  );
});
