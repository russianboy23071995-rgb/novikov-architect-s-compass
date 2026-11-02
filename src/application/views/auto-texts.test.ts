import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addSection } from "../sections/actions.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { DEFAULT_MASTER_ID, LAYOUT_COLLECTION_ID } from "../../domain/views/layouts.ts";
import { changeDrawingDocument } from "./documents.ts";
import { changeLayouts } from "./layouts.ts";
import { autoTextValues, planDate, resolveAutoText, setProjectInfo } from "./auto-texts.ts";

// docs/PLANKOPF.md, AT1.
const today = new Date(2026, 10, 2);
function project() {
  let p = createStandardProject("p", "eg", "og");
  p = addSection(p, { id: "s1", start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, look: "left" });
  p = changeDrawingDocument(p, p, {
    kind: "create-section",
    id: "d1",
    modelViewId: "v1",
    sectionId: "s1",
    name: "Schnitt A-A",
    denominator: 50,
  });
  p = setProjectInfo(p, p, { name: "Haus am See", client: "Familie Muster", author: " " });
  return changeLayouts(p, p, {
    kind: "create-layout",
    id: "l1",
    name: "Schnitte",
    folderId: LAYOUT_COLLECTION_ID,
    masterId: DEFAULT_MASTER_ID,
    planNumber: "A-201",
    index: "b",
    documentId: "d1",
  });
}

test("a layout's automatic texts: drawing, layout, project and date", () => {
  const p = project();
  assert.deepEqual(p.projectInfo, { name: "Haus am See", client: "Familie Muster" });
  const values = autoTextValues(p, "l1", today);
  assert.equal(
    resolveAutoText("{Zeichnungsname} · M {Maßstab} · {Zeichnungsart}", values),
    "Schnitt A-A · M 1:50 · Schnitt",
  );
  assert.equal(
    resolveAutoText("Plan {Plannummer}{Index} · {Blattgröße} · {Layoutname}", values),
    "Plan A-201b · DIN A3 · Schnitte",
  );
  assert.equal(resolveAutoText("{Projektname}, {Bauherr}", values), "Haus am See, Familie Muster");
  assert.equal(resolveAutoText("{Datum}", values), "02.11.2026");
  assert.equal(planDate(new Date(2027, 0, 5)), "05.01.2027");
  // A missing value leaves the place empty; on a master layout the name stays visible.
  assert.equal(resolveAutoText("Verfasser: {Planverfasser}", values), "Verfasser: ");
  const master = autoTextValues(p, DEFAULT_MASTER_ID, today);
  assert.equal(resolveAutoText("{Maßstab}", master, true), "{Maßstab}");
  assert.equal(resolveAutoText("{Layoutname}", master, true), "Standard A3 quer");
  // Unknown braces stay as typed.
  assert.equal(resolveAutoText("{Unbekannt} {}", values), "{Unbekannt} {}");
});

test("layout fields keep, change and clear; a shown document cannot go; files round-trip", () => {
  let p = project();
  const settings = (fields: object) =>
    changeLayouts(p, p, {
      kind: "layout-settings",
      id: "l1",
      name: "Schnitte",
      folderId: LAYOUT_COLLECTION_ID,
      masterId: DEFAULT_MASTER_ID,
      ...fields,
    });
  assert.equal(settings({}).layouts![0]!.planNumber, "A-201", "absent keeps");
  assert.equal(settings({ index: "c" }).layouts![0]!.index, "c");
  assert.equal(settings({ planNumber: "" }).layouts![0]!.planNumber, undefined);
  assert.throws(
    () => changeDrawingDocument(p, p, { kind: "delete", id: "d1" }),
    /Layout „Schnitte“/,
  );
  p = settings({ documentId: null });
  p = changeDrawingDocument(p, p, { kind: "delete", id: "d1" });
  assert.equal(autoTextValues(p, "l1", today).Maßstab, undefined);
  const stored = JSON.parse(serializeProject(project()));
  assert.deepEqual(loadProjectData(stored).layouts, project().layouts);
  assert.throws(() => loadProjectData({ ...stored, schemaVersion: 48 }));
  const plain = JSON.parse(serializeProject(createStandardProject("p", "eg", "og")));
  assert.equal(loadProjectData({ ...plain, schemaVersion: 48 }).schemaVersion, 49);
});
