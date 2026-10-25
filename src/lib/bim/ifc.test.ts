import { storeyOf } from "../../domain/storeys/access.ts";
import assert from "node:assert/strict";
import { test } from "node:test";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { createProject } from "../../application/projects/create.ts";
import { updateWindow } from "../../application/windows/actions.ts";
import { addWall, updateWall } from "../../application/walls/actions.ts";
import { exportIfc, ifcGuid, stepReal, stepString } from "./ifc.ts";
import { serializeProject, deserializeProject } from "./model.ts";
import { addWindow } from "../../application/windows/actions.ts";
import { addStorey, setStoreyHeight, setGroundDatum } from "../../application/storeys/actions.ts";
import { selectWorkingStorey } from "../../application/storeys/working-storey.ts";
import { prepareZTranslation } from "../../application/selection/z-translation.ts";
import { createHistory, undoProject } from "./history.ts";
import type { Project } from "../../domain/project/schema.ts";

const date = new Date("2026-09-30T12:00:00Z");
const rows = (ifc: string, entity: string) =>
  ifc.split("\n").filter((line) => line.includes(`=${entity}(`));
const globalIds = (ifc: string, entity: string) =>
  rows(ifc, entity).map((line) => line.match(/\('([^']+)'/)![1]);

// Limited reader for the writer's placement/containment output, not a general IFC parser.
async function assertStoreyExport(project: Project, levels: Record<string, number>) {
  const text = await exportIfc(project, date);
  const entities = new Map([...text.matchAll(/^(#\d+)=(.*);$/gm)].map((m) => [m[1]!, m[2]!]));
  const byGuid = async (kind: string, id: string) => {
    const guid = await ifcGuid(project.id, kind, id);
    const entry = [...entities].find(([, row]) => row.includes(`('${guid}',`));
    assert.ok(entry, `${kind} ${id} exported`);
    return entry;
  };
  const z = (ref: string): number => {
    const row = entities.get(ref);
    assert.ok(row, `placement reference ${ref} exists`);
    const refs = row.match(/#\d+/g) ?? [];
    if (row.startsWith("IFCLOCALPLACEMENT(")) return refs.reduce((sum, r) => sum + z(r), 0);
    if (row.startsWith("IFCAXIS2PLACEMENT3D(")) return z(refs[0]!);
    assert.ok(row.startsWith("IFCCARTESIANPOINT("));
    return Number(row.match(/\(\((.*)\)\)/)![1]!.split(",")[2]);
  };
  const near = (actual: number, expected: number) =>
    assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);
  for (const floor of project.storeys) {
    const [floorRef, floorRow] = await byGuid("storey", floor.id);
    near(z(floorRow.split(",")[5]!), levels[floor.id]!);
    near(Number(floorRow.slice(0, -1).split(",").at(-1)), levels[floor.id]!);
    const expectedMembers: string[] = [];
    for (const wall of floor.walls) {
      const [wallRef, wallRow] = await byGuid("wall", wall.id);
      expectedMembers.push(wallRef);
      const wallZ = levels[floor.id]! + (wall.baseOffset ?? 0);
      near(z(wallRow.split(",")[5]!), wallZ);
      for (const window of floor.windows.filter((w) => w.wallId === wall.id)) {
        const [windowRef, windowRow] = await byGuid("window", window.id);
        const [openingRef, openingRow] = await byGuid("opening", window.id);
        expectedMembers.push(windowRef);
        near(z(windowRow.split(",")[5]!), wallZ + window.sillHeight);
        near(z(openingRow.split(",")[5]!), wallZ + window.sillHeight);
        assert.ok(
          rows(text, "IFCRELVOIDSELEMENT").some((r) => r.endsWith(`,${wallRef},${openingRef});`)),
        );
        assert.ok(
          rows(text, "IFCRELFILLSELEMENT").some((r) => r.endsWith(`,${openingRef},${windowRef});`)),
        );
      }
    }
    const contained = rows(text, "IFCRELCONTAINEDINSPATIALSTRUCTURE").filter((r) =>
      r.endsWith(`,${floorRef});`),
    );
    assert.equal(contained.length, 1);
    const members = contained[0]!.match(/,\((#[\d,#]+)\),#\d+\);$/)![1]!.split(",");
    assert.deepEqual(members.sort(), expectedMembers.sort());
  }
  assert.equal(rows(text, "IFCRELCONTAINEDINSPATIALSTRUCTURE").length, project.storeys.length);
  return text;
}

test("multi-storey IFC preserves heights and containment through Z move, height edits, reload and undo", async () => {
  let p = createProject("ifc-height-proof", "eg");
  p = setStoreyHeight(p, p, { projectId: p.id, storeyId: "eg", height: 3.2 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "above", id: "og", height: 3.1 });
  p = addStorey(p, p, { projectId: p.id, storeyId: "eg", side: "below", id: "kg", height: 2.6 });
  for (const [id, offset] of [
    ["kg", -0.4],
    ["eg", 0],
    ["og", 0.6],
  ] as const) {
    p = selectWorkingStorey(p, p, id);
    p = addWall(p, {
      id: `${id}-wall`,
      start: { x: 0, y: 0 },
      end: { x: 3, y: 2 },
      thickness: 0.36,
      height: 2.8,
      baseOffset: offset,
    });
    p = addWindow(p, {
      id: `${id}-window`,
      wallId: `${id}-wall`,
      width: 1.2,
      height: 1.2,
      sillHeight: 0.9,
      position: 0.5,
    });
  }
  const levels = { kg: -2.6, eg: 0, og: 3.2 };
  const baseline = await assertStoreyExport(p, levels);
  const targets = [{ kind: "wall" as const, id: "og-wall" }];
  // Move beyond the storey interval: spatial ownership must still stay OG.
  const history = createHistory(p);
  const moved = prepareZTranslation(history.present, targets).commit(history, targets, -4);
  const exported = await assertStoreyExport(moved.present, levels);
  assert.equal(
    await assertStoreyExport(deserializeProject(serializeProject(moved.present)), levels),
    exported,
  );
  assert.equal(await assertStoreyExport(undoProject(moved).present, levels), baseline);
  let edited = setStoreyHeight(moved.present, moved.present, {
    projectId: p.id,
    storeyId: "eg",
    height: 4,
  });
  edited = setStoreyHeight(edited, edited, { projectId: p.id, storeyId: "kg", height: 3 });
  const changed = await assertStoreyExport(edited, { kg: -3, eg: 0, og: 4 });
  for (const type of ["IFCBUILDINGSTOREY", "IFCWALL", "IFCWINDOW", "IFCOPENINGELEMENT"])
    assert.deepEqual(globalIds(changed, type), globalIds(baseline, type));
  // Absolute survey datum remains annotation; model/IFC coordinates stay EG-relative.
  edited = setGroundDatum(edited, edited, { projectId: p.id, storeyId: "eg", elevation: 100 });
  assert.equal(await assertStoreyExport(edited, { kg: -3, eg: 0, og: 4 }), changed);
});

test("exports IFC4 with metre units, hierarchy and separate wall/opening/window entities", async () => {
  const ifc = await exportIfc(createExampleProject(), date);
  assert.ok(ifc.startsWith("ISO-10303-21;\nHEADER;"));
  assert.ok(ifc.endsWith("END-ISO-10303-21;\n"));
  assert.ok(ifc.includes("FILE_SCHEMA(('IFC4'))"));
  assert.ok(ifc.includes("IFCSIUNIT(*,.LENGTHUNIT.,$,.METRE.)"));
  for (const type of [
    "IFCPROJECT",
    "IFCSITE",
    "IFCBUILDING",
    "IFCBUILDINGSTOREY",
    "IFCWALL",
    "IFCOPENINGELEMENT",
    "IFCWINDOW",
    "IFCRELVOIDSELEMENT",
    "IFCRELFILLSELEMENT",
    "IFCRELCONTAINEDINSPATIALSTRUCTURE",
  ])
    assert.equal(rows(ifc, type).length, 1, type);
  assert.equal(rows(ifc, "IFCRELAGGREGATES").length, 3);
  assert.match(rows(ifc, "IFCWINDOW")[0]!, /1\.35,1\.2,\.WINDOW\.,\.NOTDEFINED\./);
  assert.ok(ifc.includes("IFCLENGTHMEASURE(0.9)"));
  assert.ok(ifc.includes("IFCRATIOMEASURE(0.5)"));
});

test("entity references resolve and all semantic GlobalIds are distinct", async () => {
  const ifc = await exportIfc(createExampleProject(), date);
  const definitions = new Set([...ifc.matchAll(/^#(\d+)=/gm)].map((match) => match[1]));
  for (const match of ifc.matchAll(/#(\d+)/g)) assert.ok(definitions.has(match[1]), match[0]);
  const ids = [...ifc.matchAll(/^#\d+=IFC\w+\('([0-3][0-9A-Za-z_$]{21})'/gm)].map(
    (match) => match[1],
  );
  assert.ok(ids.length > 10);
  assert.equal(new Set(ids).size, ids.length);
});

test("repeat exports and JSON reloads preserve IDs; dimension edits update sizes, not identity", async () => {
  const project = createExampleProject();
  const before = await exportIfc(project, date);
  assert.equal(await exportIfc(JSON.parse(JSON.stringify(project)), date), before);
  const after = await exportIfc(
    updateWall(project, "wall-1", { end: { x: 6, y: 0 }, height: 3.5 }),
    date,
  );
  for (const type of [
    "IFCPROJECT",
    "IFCWALL",
    "IFCWINDOW",
    "IFCOPENINGELEMENT",
    "IFCRELVOIDSELEMENT",
    "IFCRELFILLSELEMENT",
  ])
    assert.deepEqual(globalIds(before, type), globalIds(after, type));
  assert.notEqual(before, after);
  assert.ok(after.includes("IFCCARTESIANPOINT((2.4,0.,0.9))"));
  assert.ok(after.includes("IFCLENGTHMEASURE(6.)"));
});

test("IFC GUIDs are namespaced by project, entity kind and unambiguous source ID", async () => {
  const ids = await Promise.all([
    ifcGuid("p", "wall", "a:b"),
    ifcGuid("p", "window", "a:b"),
    ifcGuid("q", "wall", "a:b"),
    ifcGuid("p", "wall:a", "b"),
  ]);
  ids.forEach((id) => assert.match(id, /^[0-3][0-9A-Za-z_$]{21}$/));
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(ids[0], await ifcGuid("p", "wall", "a:b"));
});

test("Unicode, apostrophes, backslashes and line breaks cannot inject STEP entities", async () => {
  assert.equal(stepString("O'Brien"), "'O''Brien'");
  assert.throws(() => stepString("\ud800"));
  assert.equal(
    stepString("Ä\\\n🏠"),
    "'\\X4\\000000C4\\X0\\\\X4\\0000005C\\X0\\\\X4\\0000000A\\X0\\\\X4\\0001F3E0\\X0\\'",
  );
  const project = createProject("p');\n#999=IFCWALL('injected", "s");
  const ifc = await exportIfc(project, date);
  assert.equal(rows(ifc, "IFCWALL").filter((line) => line.startsWith("#999=")).length, 0);
  assert.ok(ifc.includes("\\X4\\0000000A\\X0\\"));
});

test("STEP real syntax keeps decimal points and finite exponent values", () => {
  assert.equal(stepReal(3), "3.");
  assert.equal(stepReal(-0), "0.");
  assert.equal(stepReal(1e-7), "1.E-7");
  assert.equal(stepReal(1e21), "1.E+21");
  assert.equal(stepReal(0.36), "0.36");
  for (const number of [NaN, Infinity, -Infinity]) assert.throws(() => stepReal(number));
});

test("empty projects export their hierarchy without invalid empty containment sets", async () => {
  const ifc = await exportIfc(createProject("p", "s"), date);
  assert.equal(rows(ifc, "IFCBUILDINGSTOREY").length, 1);
  assert.equal(rows(ifc, "IFCRELCONTAINEDINSPATIALSTRUCTURE").length, 0);
});

test("snapshot isolation prevents edits during export from mixing model states", async () => {
  const project = createExampleProject();
  const pending = exportIfc(project, date);
  storeyOf(project).walls[0]!.height = 100;
  const ifc = await pending;
  assert.ok(ifc.includes("IFCLENGTHMEASURE(2.8)"));
  assert.ok(!ifc.includes("IFCLENGTHMEASURE(100.)"));
});

test("invalid dimensions/references and invalid timestamps reject before download", async () => {
  const corrupt = createExampleProject();
  storeyOf(corrupt).windows[0]!.wallId = "missing";
  await assert.rejects(exportIfc(corrupt, date));
  await assert.rejects(exportIfc(createExampleProject(), new Date(NaN)));
});

test("adding unrelated walls does not change existing IDs; window placement is exported", async () => {
  const project = createExampleProject();
  const before = await exportIfc(project, date);
  const after = await exportIfc(
    addWall(updateWindow(project, "window-1", { position: 0.6, sillHeight: 1 }), {
      ...storeyOf(project).walls[0]!,
      id: "another",
      start: { x: 10, y: 5 },
      end: { x: 7, y: 1 },
    }),
    date,
  );
  assert.equal(globalIds(before, "IFCWALL")[0], globalIds(after, "IFCWALL")[0]);
  assert.deepEqual(globalIds(before, "IFCWINDOW"), globalIds(after, "IFCWINDOW"));
  assert.ok(after.includes("IFCRATIOMEASURE(0.6)"));
  assert.ok(after.includes("IFCLENGTHMEASURE(1.)"));
});
