import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { addSection, removeSection } from "../sections/actions.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { changeDrawingDocument, type DocumentAction } from "./documents.ts";
import { drawingInfo } from "./drawing-info.ts";

// docs/ABBILDER.md, AB1.
const run = (p: Project, action: DocumentAction) => changeDrawingDocument(p, p, action);
const line = { start: { x: 0, y: 0 }, end: { x: 4, y: 0 }, look: "left" as const };
function project() {
  let p = createStandardProject("p", "eg", "og");
  p = addSection(p, { id: "s1", ...line });
  return addSection(p, { id: "e1", ...line, kind: "elevation" });
}

test("every drawing document has a drawing name and a scale, whatever it shows", () => {
  let p = project();
  p = run(p, {
    kind: "create",
    id: "d1",
    modelViewId: "v1",
    name: "Grundriss EG",
    denominator: 100,
  });
  p = run(p, {
    kind: "create-section",
    id: "d2",
    modelViewId: "v2",
    sectionId: "s1",
    name: "Schnitt A-A",
    denominator: 50,
  });
  p = run(p, {
    kind: "create-section",
    id: "d3",
    modelViewId: "v3",
    sectionId: "e1",
    name: "Ansicht Nord",
    denominator: 100,
  });
  // A second document of the same section shares its model view.
  p = run(p, {
    kind: "create-section",
    id: "d4",
    modelViewId: "v4",
    sectionId: "s1",
    name: "Schnitt A-A Detail",
    denominator: 20,
  });
  assert.deepEqual(
    p.modelViews!.map((v) => v.id),
    ["v1", "v2", "v3"],
  );
  const info = (id: string) => {
    const i = drawingInfo(p, id);
    return [i.kindLabel, i.name, i.scale, i.sourceName];
  };
  assert.deepEqual(info("d1"), ["Grundriss", "Grundriss EG", "1:100", "Erdgeschoss"]);
  assert.deepEqual(info("d2")[0], "Schnitt");
  assert.deepEqual(info("d2").slice(1, 3), ["Schnitt A-A", "1:50"]);
  assert.deepEqual(info("d3").slice(0, 3), ["Ansicht", "Ansicht Nord", "1:100"]);
  assert.equal(drawingInfo(p, "d4").scale, "1:20");
  // Name and scale are required for every kind.
  assert.throws(() =>
    run(p, {
      kind: "create-section",
      id: "d5",
      modelViewId: "v5",
      sectionId: "s1",
      name: " ",
      denominator: 50,
    }),
  );
  assert.throws(() =>
    run(p, {
      kind: "create-section",
      id: "d5",
      modelViewId: "v5",
      sectionId: "s1",
      name: "X",
      denominator: 0,
    }),
  );
  assert.deepEqual(
    loadProjectData(JSON.parse(serializeProject(p))).drawingDocuments,
    p.drawingDocuments,
  );
});

test("a section with documents stays until they are deleted; its model view goes with it", () => {
  let p = run(project(), {
    kind: "create-section",
    id: "d2",
    modelViewId: "v2",
    sectionId: "s1",
    name: "Schnitt A-A",
    denominator: 50,
  });
  assert.throws(() => removeSection(p, "s1"), /von 1 Abbild verwendet/);
  p = run(p, { kind: "delete", id: "d2" });
  p = removeSection(p, "s1");
  assert.equal(p.modelViews, undefined);
  assert.throws(
    () =>
      run(p, {
        kind: "create-section",
        id: "d",
        modelViewId: "v",
        sectionId: "s1",
        name: "X",
        denominator: 50,
      }),
    /existiert nicht mehr/,
  );
  // A stored section view whose section is gone is refused.
  const raw = structuredClone(p);
  raw.modelViews = [{ id: "v9", kind: "section", sectionId: "gone" }];
  assert.throws(() => validateProject(raw), /Schnitt bzw. die Ansicht eines Abbilds fehlt/);
});

test("schema 45 files load with their plan documents; section views are refused there", () => {
  const plan = run(project(), {
    kind: "create",
    id: "d1",
    modelViewId: "v1",
    name: "Grundriss EG",
    denominator: 100,
  });
  const stored = JSON.parse(serializeProject(plan));
  assert.deepEqual(
    loadProjectData({ ...stored, schemaVersion: 45 }).drawingDocuments,
    plan.drawingDocuments,
  );
  const section = run(project(), {
    kind: "create-section",
    id: "d2",
    modelViewId: "v2",
    sectionId: "s1",
    name: "Schnitt A-A",
    denominator: 50,
  });
  assert.throws(() =>
    loadProjectData({ ...JSON.parse(serializeProject(section)), schemaVersion: 45 }),
  );
});
