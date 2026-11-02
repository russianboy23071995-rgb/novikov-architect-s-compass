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
import { placeDrawing, setDrawing } from "./actions.ts";
import {
  dragMaskEdge,
  maskCrop,
  maskEdgeGrip,
  maskFromCrop,
} from "../../domain/elements/drawing/model.ts";

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
  const full = { x0: -0.06, y0: -0.04, x1: 0.06, y1: 0.04 };
  const masked = setDrawing(
    spaceLens(real, { kind: "layout", id: "l1" }),
    "z1",
    { mask: { x0: -0.03, y0: -0.04, x1: 0.06, y1: 0.02 } },
    full,
  );
  assert.throws(() =>
    setDrawing(masked, "z1", { mask: { x0: 0.01, y0: 0, x1: 0.01, y1: 0.02 } }, full),
  );
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

// docs/ZEICHNUNG.md, ZW3: the mask is cropped at its four edges, inside the document frame.
test("mask edges drag inside the frame, keep 5 mm, and map to crops from the frame", () => {
  const full = { x0: -0.06, y0: -0.04, x1: 0.06, y1: 0.04 };
  // The left edge follows the pointer, but never past the frame or within 5 mm of the right edge.
  assert.equal(dragMaskEdge(full, "left", -0.02, full).x0, -0.02);
  assert.equal(dragMaskEdge(full, "left", -0.5, full).x0, -0.06);
  assert.ok(Math.abs(dragMaskEdge(full, "left", 0.3, full).x0 - 0.055) < 1e-12);
  assert.equal(dragMaskEdge(full, "top", 0.5, full).y1, 0.04);
  assert.equal(dragMaskEdge(full, "bottom", 0, full).y0, 0);
  const mask = dragMaskEdge(dragMaskEdge(full, "right", 0.03, full), "top", 0.01, full);
  const crop = maskCrop(mask, full);
  assert.ok(Math.abs(crop.right - 0.03) < 1e-12 && Math.abs(crop.top - 0.03) < 1e-12);
  const back = maskFromCrop(full, crop);
  for (const k of ["x0", "x1", "y0", "y1"] as const) assert.ok(Math.abs(back[k] - mask[k]) < 1e-12);
  // Grips sit in the middle of each edge on the paper.
  const grip = maskEdgeGrip({ position: { x: 0.2, y: 0.1 }, mask: full }, "bottom");
  assert.ok(Math.abs(grip.x - 0.2) < 1e-12 && Math.abs(grip.y - 0.06) < 1e-12);
  // On the layout: one undo step; a mask beyond the frame or too small is refused.
  let state = spaceEditingReducer(createEditingState(project()), {
    type: "space",
    space: { kind: "layout", id: "l1" },
  });
  const lens = () => spaceLens(state.history.present, { kind: "layout", id: "l1" });
  state = spaceEditingReducer(state, {
    type: "project",
    project: placeDrawing(lens(), {
      id: "z1",
      documentId: "d1",
      position: { x: 0.2, y: 0.1 },
      frame: framing,
      denominator: 100,
    }),
  });
  state = spaceEditingReducer(state, {
    type: "project",
    project: setDrawing(lens(), "z1", { mask }, full),
  });
  const placed = () => state.history.present.layoutDrawings![0]!.storey.drawings![0]!;
  assert.deepEqual(placed().mask, mask);
  assert.deepEqual(placed().position, { x: 0.2, y: 0.1 });
  assert.throws(
    () => setDrawing(lens(), "z1", { mask: { ...full, x1: 0.07 } }, full),
    /höchstens bis zum Ausschnitt/,
  );
  assert.throws(
    () => setDrawing(lens(), "z1", { mask: { ...full, x1: -0.058 } }, full),
    /5 × 5 mm/,
  );
  state = spaceEditingReducer(state, { type: "undo" });
  assert.deepEqual(placed().mask, full);
});

// docs/ZEICHNUNG.md, ZW5: a fixed frame; refitting keeps the crop of placed drawings.
test("refitting a document frame keeps the crop of its placed drawings at the new edges", () => {
  let state = spaceEditingReducer(createEditingState(project()), {
    type: "space",
    space: { kind: "layout", id: "l1" },
  });
  const lens = () => spaceLens(state.history.present, { kind: "layout", id: "l1" });
  state = spaceEditingReducer(state, {
    type: "project",
    project: placeDrawing(lens(), {
      id: "z1",
      documentId: "d1",
      position: { x: 0.2, y: 0.1 },
      frame: framing,
      denominator: 100,
    }),
  });
  // 10 mm cropped on the left of the 120 × 80 mm frame.
  const full = { x0: -0.06, y0: -0.04, x1: 0.06, y1: 0.04 };
  state = spaceEditingReducer(state, {
    type: "project",
    project: setDrawing(lens(), "z1", { mask: { ...full, x0: -0.05 } }, full),
  });
  const placed = () => state.history.present.layoutDrawings![0]!.storey.drawings![0]!;
  const near = (a: object, b: object) =>
    Object.entries(a).every(([k, v]) => Math.abs(v - (b as Record<string, number>)[k]!) < 1e-12);
  // The model grew: the frame becomes 2 m higher (20 mm on paper).
  const real = state.history.present;
  state = spaceEditingReducer(state, {
    type: "document",
    base: real,
    action: { kind: "framing", id: "d1", framing: { ...framing, height: 10 } },
  });
  assert.equal(state.error, "");
  assert.deepEqual(state.history.present.drawingDocuments![0]!.framing!.height, 10);
  assert.ok(near(placed().mask, { x0: -0.05, y0: -0.05, x1: 0.06, y1: 0.05 }));
  assert.deepEqual(placed().position, { x: 0.2, y: 0.1 });
  // A crop wider than the new frame cannot stay: the drawing shows the whole frame.
  const now = state.history.present;
  state = spaceEditingReducer(state, {
    type: "document",
    base: now,
    action: { kind: "framing", id: "d1", framing: { ...framing, width: 1 } },
  });
  assert.ok(near(placed().mask, { x0: -0.005, y0: -0.04, x1: 0.005, y1: 0.04 }));
  state = spaceEditingReducer(state, { type: "undo" });
  assert.ok(near(placed().mask, { x0: -0.05, y0: -0.05, x1: 0.06, y1: 0.05 }));
});

test("a section document keeps the frame it is saved with", () => {
  const base = project();
  const p = changeDrawingDocument(base, base, {
    kind: "create-folder",
    id: "f",
    name: "F",
  });
  const withSection = {
    ...p,
    sections: [
      {
        id: "s",
        name: "Schnitt A-A",
        mark: "A",
        start: { x: 0, y: 0 },
        end: { x: 4, y: 0 },
        look: "left" as const,
      },
    ],
  };
  const saved = changeDrawingDocument(withSection, withSection, {
    kind: "create-section",
    id: "ds",
    modelViewId: "vs",
    sectionId: "s",
    name: "Schnitt A-A",
    denominator: 50,
    framing,
  });
  assert.deepEqual(saved.drawingDocuments!.find((d) => d.id === "ds")!.framing, framing);
});
