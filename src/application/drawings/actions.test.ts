import test from "node:test";
import assert from "node:assert/strict";
import { createStandardProject } from "../projects/create.ts";
import { changeDrawingDocument } from "../views/documents.ts";
import { changeLayouts } from "../views/layouts.ts";
import { spaceEditingReducer, spaceLens } from "../views/title-block-space.ts";
import { createEditingState } from "../direct-edit/controller.ts";
import { DEFAULT_MASTER_ID, LAYOUT_COLLECTION_ID } from "../../domain/views/layouts.ts";
import { maskOnPaper } from "../../domain/elements/drawing/model.ts";
import { validateProject } from "../../domain/project/schema.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import { loadProjectData } from "../../interop/project-file/load.ts";
import { placeDrawing, setDrawingMask } from "./actions.ts";

// docs/ZEICHNUNG.md, ZW1.
const framing = { center: { x: 2, y: 1 }, width: 12, height: 8, pixelsPerMetre: 50 };
function project() {
  let p = createStandardProject("p", "eg", "og");
  p = changeDrawingDocument(p, p, {
    kind: "create",
    id: "d1",
    modelViewId: "v1",
    name: "Grundriss EG",
    denominator: 100,
    framing,
  });
  return changeLayouts(p, p, {
    kind: "create-layout",
    id: "l1",
    name: "EG",
    folderId: LAYOUT_COLLECTION_ID,
    masterId: DEFAULT_MASTER_ID,
  });
}

test("a placed drawing: size from frame and scale, on the layout's sheet, undoable", () => {
  let state = spaceEditingReducer(createEditingState(project()), {
    type: "space",
    space: { kind: "layout", id: "l1" },
  });
  const lens = spaceLens(state.history.present, { kind: "layout", id: "l1" });
  state = spaceEditingReducer(state, {
    type: "project",
    project: placeDrawing(lens, {
      id: "z1",
      documentId: "d1",
      position: { x: 0.21, y: 0.15 },
      frame: framing,
      denominator: 100,
    }),
  });
  assert.equal(state.error, "");
  const real = state.history.present;
  const [placed] = real.layoutDrawings![0]!.storey.drawings!;
  // 12 m × 8 m at 1:100 = 120 × 80 mm on the paper, centred on the placement point.
  assert.deepEqual(placed!.mask, { x0: -0.06, y0: -0.04, x1: 0.06, y1: 0.04 });
  const corner = maskOnPaper(placed!)[0]!;
  assert.ok(Math.abs(corner.x - 0.15) < 1e-12 && Math.abs(corner.y - 0.11) < 1e-12);
  assert.ok(
    real.storeys.every((s) => !s.drawings?.length),
    "never in the building",
  );
  assert.deepEqual(
    loadProjectData(JSON.parse(serializeProject(real))).layoutDrawings,
    real.layoutDrawings,
  );
  // The placed document cannot go; a drawing in a storey of the building is refused.
  assert.throws(
    () => changeDrawingDocument(real, real, { kind: "delete", id: "d1" }),
    /liegt als Zeichnung/,
  );
  const raw = structuredClone(real);
  raw.storeys[0]!.drawings = [placed!];
  assert.throws(() => validateProject(raw), /gehören auf ein Layout|Duplicate ID/);
  // The mask changes, the size of the drawing does not (ZW3 uses this).
  const masked = setDrawingMask(spaceLens(real, { kind: "layout", id: "l1" }), "z1", {
    x0: -0.03,
    y0: -0.04,
    x1: 0.06,
    y1: 0.02,
  });
  assert.throws(() => setDrawingMask(masked, "z1", { x0: 0.01, y0: 0, x1: 0.01, y1: 0.02 }));
  state = spaceEditingReducer(state, { type: "undo" });
  assert.equal(state.history.present.layoutDrawings, undefined);
  // Schema 49 files carry no placed drawings.
  assert.throws(() =>
    loadProjectData({ ...JSON.parse(serializeProject(real)), schemaVersion: 49 }),
  );
});

// docs/ZEICHNUNG.md, ZW2: a drawing on the master layout lies under every following layout.
test("drawings of the master layout show and snap under its layouts; own mask corners snap", async () => {
  const { spaceBackdrop } = await import("../views/title-block-space.ts");
  const { projectSnapReferences } = await import("../snapping/project-references.ts");
  const { storeyOf } = await import("../../domain/storeys/access.ts");
  let state = spaceEditingReducer(createEditingState(project()), {
    type: "space",
    space: { kind: "layout", id: DEFAULT_MASTER_ID },
  });
  const lens = spaceLens(state.history.present, { kind: "layout", id: DEFAULT_MASTER_ID });
  state = spaceEditingReducer(state, {
    type: "project",
    project: placeDrawing(lens, {
      id: "zm",
      documentId: "d1",
      position: { x: 0.2, y: 0.15 },
      frame: framing,
      denominator: 100,
    }),
  });
  assert.equal(state.error, "");
  const real = state.history.present;
  const under = spaceBackdrop(real, { kind: "layout", id: "l1" })!;
  assert.deepEqual(
    storeyOf(under).drawings!.map((d) => d.id),
    ["@bg:m:zm"],
  );
  const layoutRefs = projectSnapReferences(spaceLens(real, { kind: "layout", id: "l1" }));
  assert.ok(layoutRefs.some((r) => r.entityId === "@bg:m:zm"));
  // On the master itself the drawing is its own and its mask corners snap.
  const masterRefs = projectSnapReferences(
    spaceLens(real, { kind: "layout", id: DEFAULT_MASTER_ID }),
  );
  assert.ok(masterRefs.some((r) => r.entityId === "zm"));
});
