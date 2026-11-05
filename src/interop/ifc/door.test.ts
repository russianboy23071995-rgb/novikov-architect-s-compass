import test from "node:test";
import assert from "node:assert/strict";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { updateWall } from "../../application/walls/actions.ts";
import { exportIfc } from "../../lib/bim/ifc.ts";
import { addDoor } from "../../application/doors/actions.ts";
import { DOOR_DEFAULTS } from "../../domain/elements/door/model.ts";
import { doorOperationType, FILLING_PLACEHOLDER_DEPTH, ifcGuid } from "./writer.ts";
import { roofAcceptanceProject } from "../../../benchmarks/roof-ifc-acceptance.ts";
import { roofBody } from "../../domain/elements/roof/body.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import {
  exportFillingVariant,
  fillingAcceptanceProject,
} from "../../../benchmarks/filling-ifc-acceptance.ts";
import type { Project } from "../../domain/project/schema.ts";

const date = new Date("2026-10-24T12:00:00Z");
const rows = (ifc: string, entity: string) =>
  ifc.split("\n").filter((line) => line.includes(`=${entity}(`));

function withDoor(changes: Partial<Parameters<typeof addDoor>[1]> = {}): Project {
  const wide = updateWall(createExampleProject(), "wall-1", { end: { x: 6, y: 0 } });
  return addDoor(wide, {
    id: "door-1",
    wallId: "wall-1",
    position: 0.15,
    ...DOOR_DEFAULTS,
    ...changes,
  });
}

test("hinge side seen from the swing side gives the IFC4 single swing operation type", () => {
  assert.equal(doorOperationType({ hinge: "start", opensTo: "left" }), "SINGLE_SWING_LEFT");
  assert.equal(doorOperationType({ hinge: "end", opensTo: "left" }), "SINGLE_SWING_RIGHT");
  assert.equal(doorOperationType({ hinge: "start", opensTo: "right" }), "SINGLE_SWING_RIGHT");
  assert.equal(doorOperationType({ hinge: "end", opensTo: "right" }), "SINGLE_SWING_LEFT");
});

test("a door exports as IfcDoor filling its own wall opening, with explicit properties", async () => {
  const project = withDoor({ zOffset: 0.05, hinge: "end", opensTo: "right" });
  const ifc = await exportIfc(project, date);
  const [door] = rows(ifc, "IFCDOOR");
  assert.ok(door);
  assert.ok(door.includes(`'${await ifcGuid(project.id, "door", "door-1")}'`));
  assert.match(door, /,2\.135,1\.01,\.DOOR\.,\.SINGLE_SWING_LEFT\.,\$\)/);
  // Window and door each void the wall and fill their own opening.
  assert.equal(rows(ifc, "IFCOPENINGELEMENT").length, 2);
  assert.equal(rows(ifc, "IFCRELVOIDSELEMENT").length, 2);
  assert.equal(rows(ifc, "IFCRELFILLSELEMENT").length, 2);
  const openingGuid = await ifcGuid(project.id, "opening", "door-1");
  const opening = rows(ifc, "IFCOPENINGELEMENT").find((r) => r.includes(openingGuid))!;
  const openingId = opening.split("=")[0]!;
  const doorId = door.split("=")[0]!;
  assert.ok(rows(ifc, "IFCRELFILLSELEMENT").some((r) => r.endsWith(`,${openingId},${doorId});`)));
  for (const [name, value] of [
    ["ZOffset", "IFCLENGTHMEASURE(0.05)"],
    ["Hinge", "IFCLABEL('end')"],
    ["OpensTo", "IFCLABEL('right')"],
  ])
    assert.ok(ifc.includes(`'${name}',$,${value}`), name);
  // The door is contained in the storey like walls and windows.
  const containment = rows(ifc, "IFCRELCONTAINEDINSPATIALSTRUCTURE")[0]!;
  assert.ok(containment.includes(doorId));
});

test("the opening underside follows the door's storey-relative z offset over a raised wall", async () => {
  const raised = updateWall(withDoor({ zOffset: 0.3 }), "wall-1", { baseOffset: 0.3 });
  const ifc = await exportIfc(raised, date);
  const openingGuid = await ifcGuid(raised.id, "opening", "door-1");
  const opening = rows(ifc, "IFCOPENINGELEMENT").find((r) => r.includes(openingGuid))!;
  const placementRef = opening.split(",")[5]!;
  const placement = rows(ifc, "IFCLOCALPLACEMENT").find((r) => r.startsWith(`${placementRef}=`))!;
  const axisRef = placement.match(/,(#\d+)\);$/)![1]!;
  const axis = ifc.split("\n").find((r) => r.startsWith(`${axisRef}=`))!;
  const pointRef = axis.match(/\((#\d+),/)![1]!;
  const point = ifc.split("\n").find((r) => r.startsWith(`${pointRef}=`))!;
  // Wall placement already sits at the wall base, so the opening starts at 0 above it.
  assert.match(point, /IFCCARTESIANPOINT\(\([-\d.E]+,0\.,0\.\)\)/);
});

test("the door carries its DIN 107 handing as an explicit property", async () => {
  const ifc = await exportIfc(withDoor({ hinge: "end", opensTo: "left" }), date);
  assert.ok(ifc.includes("'Handing',$,IFCLABEL('DIN links')"));
  const right = await exportIfc(withDoor(), date);
  assert.ok(right.includes("'Handing',$,IFCLABEL('DIN rechts')"));
});

// Ceiling slabs, Teil B2 (docs/SLAB_ELEMENT.md): IfcSlab FLOOR in the owning storey.
import { slabAcceptanceProject } from "../../../benchmarks/slab-ifc-acceptance.ts";
import { addSlab } from "../../application/slabs/actions.ts";
import { createProject as emptyProject } from "../../application/projects/create.ts";

test("each ceiling slab exports as IfcSlab FLOOR from its underside, contained in its storey", async () => {
  const project = slabAcceptanceProject();
  const ifc = await exportIfc(project, date);
  const line = (ref: string) => ifc.split("\n").find((r) => r.startsWith(`${ref}=`))!;
  const args = (row: string) => row.slice(row.indexOf("(") + 1, -2).split(",");
  const slabs = rows(ifc, "IFCSLAB");
  assert.equal(slabs.length, 2);
  const expected = {
    "eg-decke": { storey: "Erdgeschoss", bottom: 2.8, depth: 0.2, points: 4 },
    "og-decke": { storey: "1. Obergeschoss", bottom: 2.55, depth: 0.25, points: 6 },
  } as const;
  for (const [id, want] of Object.entries(expected)) {
    const guid = await ifcGuid(project.id, "slab", id);
    const slab = slabs.find((r) => r.includes(`'${guid}'`))!;
    assert.ok(slab.endsWith(`'${id}',.FLOOR.);`));
    const ref = slab.split("=")[0]!;
    const [, , , , , placementRef, shapeRef] = args(slab);
    // Underside relative to the storey placement.
    const axis = line(line(placementRef!).match(/,(#\d+)\);$/)![1]!);
    const point = line(axis.match(/\((#\d+),/)![1]!);
    const z = Number(point.match(/\(\(([^)]*)\)\)/)![1]!.split(",")[2]);
    assert.ok(Math.abs(z - want.bottom) < 1e-9, `${id} underside ${z}`);
    // Outline extruded upward by the thickness.
    const shape = line(line(shapeRef!).match(/\((#\d+)\)\);$/)![1]!);
    const solid = line(shape.match(/\((#\d+)\)\);$/)![1]!);
    assert.ok(solid.includes("IFCEXTRUDEDAREASOLID"));
    assert.equal(Number(args(solid).at(-1)), want.depth);
    const profile = line(args(solid)[0]!);
    const curve = line(args(profile).at(-1)!);
    assert.equal(curve.match(/#\d+/g)!.length - 1, want.points + 1);
    // Contained in the storey that owns the slab.
    const storey = rows(ifc, "IFCBUILDINGSTOREY").find((r) => r.includes(`'${want.storey}'`))!;
    const storeyRef = storey.split("=")[0]!;
    assert.ok(
      rows(ifc, "IFCRELCONTAINEDINSPATIALSTRUCTURE").some(
        (r) => r.endsWith(`,${storeyRef});`) && r.includes(ref),
      ),
    );
  }
  assert.ok(ifc.includes("'Thickness',$,IFCLENGTHMEASURE(0.25)"));
  // Without a known storey height there is no level and no IfcSlab, as in 3D.
  const unknown = addSlab(emptyProject("q", "eg"), {
    id: "s",
    points: [
      { x: 0, y: 0 },
      { x: 4, y: 0 },
      { x: 4, y: 4 },
    ],
    thickness: 0.2,
    topOffset: 0,
  });
  assert.equal(rows(await exportIfc(unknown, date), "IFCSLAB").length, 0);
});

test("filling variants for Archicad: placeholder body or type and quantities; default unchanged", async () => {
  // docs/T_IFC_ACCEPTANCE.md, 29.10.2026. The regular export keeps no body and no type.
  const project = fillingAcceptanceProject();
  const regular = await exportIfc(project, date);
  assert.ok(rows(regular, "IFCWINDOW").every((line) => /,#\d+,\$,'/.test(line)));
  assert.equal(rows(regular, "IFCWINDOWTYPE").length, 0);
  assert.equal(regular.includes("PlaceholderBody"), false);
  assert.equal(await exportFillingVariant(project, {}, date), regular);

  const entity = (ifc: string, ref: string) =>
    ifc.split("\n").find((line) => line.startsWith(`${ref}=`))!;
  const depth = (ifc: string, line: string) => {
    // Filling -> product shape -> representation -> extruded solid -> rectangle profile.
    const shape = /,#\d+,(#\d+),'/.exec(line)![1]!;
    const representation = /\(\$,\$,\((#\d+)\)\)/.exec(entity(ifc, shape))![1]!;
    const solid = /\((#\d+)\)\);$/.exec(entity(ifc, representation))![1]!;
    const profile = /\((#\d+),/.exec(entity(ifc, solid))![1]!;
    const [, length, thickness] = /,#\d+,([\d.E-]+),([\d.E-]+)\);$/.exec(entity(ifc, profile))!;
    const height = /,([\d.E-]+)\);$/.exec(entity(ifc, solid))![1]!;
    return [Number(length), Number(thickness), Number(height)];
  };
  for (const [body, thickness] of [
    ["thin", FILLING_PLACEHOLDER_DEPTH],
    ["full", 0.3],
  ] as const) {
    const ifc = await exportFillingVariant(project, { fillingBody: body }, date);
    const windows = rows(ifc, "IFCWINDOW");
    assert.deepEqual(depth(ifc, windows[0]!), [1.2, thickness, 1.35], body);
    assert.deepEqual(depth(ifc, windows[1]!), [0.8, thickness, 1], body);
    assert.deepEqual(depth(ifc, rows(ifc, "IFCDOOR")[0]!), [1.01, thickness, 2.135], body);
    assert.equal(ifc.split("PlaceholderBody").length - 1, 3, body);
    assert.equal(rows(ifc, "IFCWINDOWTYPE").length, 0, body);
  }
  const typed = await exportFillingVariant(project, { fillingTypes: true }, date);
  assert.equal(rows(typed, "IFCWINDOWTYPE").length, 2);
  assert.match(
    rows(typed, "IFCDOORTYPE")[0]!,
    /,\.DOOR\.,\.SINGLE_SWING_(LEFT|RIGHT)\.,\.F\.,\$\);$/,
  );
  assert.equal(rows(typed, "IFCRELDEFINESBYTYPE").length, 3);
  assert.equal(rows(typed, "IFCRELDECLARES").length, 1);
  assert.ok(typed.includes("'Width',$,$,1.2,$"));
  assert.ok(typed.includes("'Area',$,$,0.8,$"));
  assert.ok(rows(typed, "IFCWINDOW").every((line) => /,#\d+,\$,'/.test(line)));
  // Every reference points to an existing entity.
  for (const ifc of [regular, typed]) {
    const ids = new Set([...ifc.matchAll(/^#(\d+)=/gm)].map((m) => m[1]));
    assert.ok([...ifc.matchAll(/#(\d+)/g)].every((m) => ids.has(m[1])));
  }
});

test("a roof exports as IfcRoof aggregating one IfcSlab ROOF with a closed faceted B-rep", async () => {
  // Dach D5 (docs/ROOF_ELEMENT.md).
  const project = roofAcceptanceProject();
  const ifc = await exportIfc(project, date);
  const entity = (ref: string) => ifc.split("\n").find((line) => line.startsWith(`${ref}=`))!;
  const refOf = (line: string) => line.slice(0, line.indexOf("="));
  const [roof] = rows(ifc, "IFCROOF");
  assert.ok(roof?.includes(`'${await ifcGuid(project.id, "roof", "og-dach")}'`));
  assert.match(roof!, /,\.SHED_ROOF\.\);$/);
  const surfaces = rows(ifc, "IFCSLAB").filter((line) => line.endsWith(",.ROOF.);"));
  assert.equal(surfaces.length, 1);
  const aggregate = rows(ifc, "IFCRELAGGREGATES").find((line) =>
    line.includes(`,${refOf(roof!)},(${refOf(surfaces[0]!)})`),
  );
  assert.ok(aggregate, "roof aggregates its surface");
  // The roof (not its surface) is contained in the OG.
  const contained = rows(ifc, "IFCRELCONTAINEDINSPATIALSTRUCTURE").join("\n");
  assert.ok(contained.includes(refOf(roof!)));
  assert.ok(
    !contained.includes(`${refOf(surfaces[0]!)},`) &&
      !contained.includes(`${refOf(surfaces[0]!)})`),
  );
  // Closed shell: every edge of every face loop is used exactly once in each direction.
  const shell = rows(ifc, "IFCCLOSEDSHELL");
  assert.equal(shell.length, 1);
  const faceRefs = /\(\((.*)\)\);$/.exec(shell[0]!)![1]!.split(",");
  const body = roofBody(storeyOf(project).roofs![0]!, 0);
  assert.equal(faceRefs.length, body.faces.length);
  const edges = new Map<string, number>();
  const zs: number[] = [];
  for (const face of faceRefs) {
    const bound = /\((#\d+)\)\);$/.exec(entity(face))![1]!;
    const loop = /\((#\d+),/.exec(entity(bound))![1]!;
    const pts = /\(\((.*)\)\);$/.exec(entity(loop))![1]!.split(",");
    pts.forEach((p, i) => {
      const k = `${p}>${pts[(i + 1) % pts.length]}`;
      edges.set(k, (edges.get(k) ?? 0) + 1);
      zs.push(Number(/\(([^,]+),([^,]+),([^)]+)\)\);$/.exec(entity(p))![3]));
    });
  }
  for (const [k, count] of edges) {
    const [a, b] = k.split(">");
    assert.equal(count, 1, k);
    assert.equal(edges.get(`${b}>${a}`), 1, `${k} has its partner`);
  }
  // Heights relative to the OG placement match the shared roof body.
  const bodyZ = body.faces.flatMap((f) => f.vertices.map((v) => v[2]));
  assert.ok(Math.abs(Math.min(...zs) - Math.min(...bodyZ)) < 1e-9);
  assert.ok(Math.abs(Math.max(...zs) - Math.max(...bodyZ)) < 1e-9);
  assert.ok(ifc.includes("'PitchDegrees',$,IFCREAL(15.)"));
  assert.ok(ifc.includes("'EaveCut',$,IFCLABEL('horizontal')"));
  const ids = new Set([...ifc.matchAll(/^#(\d+)=/gm)].map((m) => m[1]));
  assert.ok([...ifc.matchAll(/#(\d+)/g)].every((m) => ids.has(m[1])));
});

test("every window, door and opening carries base quantities, also without a type (G2)", async () => {
  const project = withDoor();
  const ifc = await exportIfc(project, date);
  const windows = rows(ifc, "IFCWINDOW").length;
  const doors = rows(ifc, "IFCDOOR").length;
  assert.ok(windows > 0 && doors === 1);
  const sets = (name: string) =>
    rows(ifc, "IFCELEMENTQUANTITY").filter((line) => line.includes(`'${name}'`)).length;
  assert.equal(sets("Qto_WindowBaseQuantities"), windows);
  assert.equal(sets("Qto_DoorBaseQuantities"), doors);
  assert.equal(sets("Qto_OpeningElementBaseQuantities"), rows(ifc, "IFCOPENINGELEMENT").length);
  const door = storeyOf(project).doors![0]!;
  assert.ok(
    ifc.includes(`'Width',$,$,${door.width}`) || ifc.includes(`'Width',$,$,${door.width}.`),
  );
  assert.ok(ifc.includes("'Depth',$,$,"));
});
