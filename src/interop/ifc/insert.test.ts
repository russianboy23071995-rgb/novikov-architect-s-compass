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
import { ifcGuid } from "./writer.ts";

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
  const type = rows(ifc, "IFCWINDOWTYPE").find((r) => r.includes(`(${lining!.split("=")[0]})`));
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
