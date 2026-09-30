import assert from "node:assert/strict";
import { test } from "node:test";
import { createExampleProject } from "../../components/cad/bim-view.ts";
import { addWall, createProject, updateWall, updateWindow } from "./model.ts";
import { exportIfc, ifcGuid, stepReal, stepString } from "./ifc.ts";

const date = new Date("2026-09-30T12:00:00Z");
const rows = (ifc: string, entity: string) =>
  ifc.split("\n").filter((line) => line.includes(`=${entity}(`));
const globalIds = (ifc: string, entity: string) =>
  rows(ifc, entity).map((line) => line.match(/\('([^']+)'/)![1]);

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
  project.storey.walls[0]!.height = 100;
  const ifc = await pending;
  assert.ok(ifc.includes("IFCLENGTHMEASURE(2.8)"));
  assert.ok(!ifc.includes("IFCLENGTHMEASURE(100.)"));
});

test("invalid dimensions/references and invalid timestamps reject before download", async () => {
  const corrupt = createExampleProject();
  corrupt.storey.windows[0]!.wallId = "missing";
  await assert.rejects(exportIfc(corrupt, date));
  await assert.rejects(exportIfc(createExampleProject(), new Date(NaN)));
});

test("adding unrelated walls does not change existing IDs; window placement is exported", async () => {
  const project = createExampleProject();
  const before = await exportIfc(project, date);
  const after = await exportIfc(
    addWall(updateWindow(project, "window-1", { position: 0.6, sillHeight: 1 }), {
      ...project.storey.walls[0]!,
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
