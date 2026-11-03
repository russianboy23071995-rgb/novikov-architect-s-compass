import { schoolFixture } from "./school-fixture.ts";
import { validateProject, type Project } from "../src/domain/project/schema.ts";
import { projectWallAssemblies } from "../src/domain/elements/wall/assembly.ts";
import { setWallAssembly } from "../src/application/walls/assembly.ts";
import { addRoof } from "../src/application/roofs/actions.ts";
import { trimWallsToRoof } from "../src/application/walls/roof-trim.ts";
import { addSection, addFourElevations } from "../src/application/sections/actions.ts";
import { changeDrawingDocument } from "../src/application/views/documents.ts";
import { changeLayouts } from "../src/application/views/layouts.ts";
import { placeDrawing } from "../src/application/drawings/actions.ts";
import { spaceEditingReducer, spaceLens } from "../src/application/views/title-block-space.ts";
import { createEditingState } from "../src/application/direct-edit/controller.ts";
import { selectWorkingStorey } from "../src/application/storeys/working-storey.ts";
import { DEFAULT_MASTER_ID, LAYOUT_COLLECTION_ID } from "../src/domain/views/layouts.ts";

/**
 * Gesamtnachweis große Projekte (docs/performance/GESAMTNACHWEIS_2026-11.md): the school model of
 * the earlier runs (walls in L pairs, windows, lines; benchmarks/school-fixture.ts) with every
 * feature added since, so one model exercises them together:
 * - storey 0: walls bound to the storey height, 7 image references of 4000 × 4000 px (112 of
 *   the 128 Mpx raster budget);
 * - storey 1: walls with a layered build-up;
 * - storeys 0–3: one slab over the storey with 10 slab openings;
 * - every storey: one room in every L (rooms with clear heights under slab or roof);
 * - storey 4: a roof over the storey, all its walls trimmed to it;
 * - 4 sections and 4 elevations; one plan document per storey and one per section/elevation;
 * - 6 layouts with 2 placed drawings each.
 * Synthetic and repetitive, not a real school plan; geometry and counts are fixed (seedless).
 */
export const GESAMT_DOCUMENTS = { plans: 5, sections: 8, layouts: 6 } as const;
/** 7 images of 4000 × 4000 px: 112 of the 128 Mpx raster budget. */
export const GESAMT_IMAGES = { count: 7, pixels: 4000 } as const;
export type GesamtImage = { data: string };

const rect = (x0: number, y0: number, x1: number, y1: number) => [
  { x: x0, y: y0 },
  { x: x1, y: y0 },
  { x: x1, y: y1 },
  { x: x0, y: y1 },
];

/** `images`: base64 PNGs of 4000 × 4000 px, made by the caller (Node: gesamt-images.ts, browser:
 * canvas), so the model itself runs in both. */
export function gesamtFixture(elements: number, images: readonly GesamtImage[] = []): Project {
  const school = schoolFixture(elements, 5);
  const groups = school.storeys[0]!.walls.length / 2;
  const columns = Math.min(groups, 20);
  const width = (columns - 1) * 7 + 4,
    depth = (Math.ceil(groups / 20) - 1) * 7 + 4;
  const layer = (name: string) => school.layers.find((l) => l.name === name)!.id;
  const assets = images.map((image, i) => ({
    id: `bild-${i}`,
    mimeType: "image/png" as const,
    pixelWidth: GESAMT_IMAGES.pixels,
    pixelHeight: GESAMT_IMAGES.pixels,
    data: image.data,
  }));
  let p = validateProject({
    ...school,
    assets,
    storeys: school.storeys.map((storey, s) => ({
      ...storey,
      walls:
        s === 0
          ? storey.walls.map((w) => ({
              ...w,
              topBinding: { kind: "storey" as const, topOffset: 0 },
            }))
          : storey.walls,
      ...(s < 4
        ? {
            slabs: [
              {
                id: `s${s}-decke`,
                layerId: layer("Decke"),
                points: rect(-0.5, -0.5, width + 0.5, depth + 0.5),
                thickness: 0.25,
                topOffset: 0,
              },
            ],
            slabOpenings: Array.from({ length: 10 }, (_, k) => ({
              id: `s${s}-bd${k}`,
              layerId: layer("Decke"),
              slabId: `s${s}-decke`,
              points: rect(k * 7 + 4.8, 0.8, k * 7 + 6.2, 2.2),
            })),
          }
        : {}),
      rooms: Array.from({ length: groups }, (_, g) => {
        const x = (g % 20) * 7,
          y = Math.floor(g / 20) * 7;
        return {
          id: `s${s}-raum${g}`,
          layerId: layer("Raum"),
          points: rect(x + 0.3, y + 0.3, x + 3.7, y + 3.7),
          name: "Klasse",
          number: `R-${s}${String(g).padStart(3, "0")}`,
        };
      }),
      references:
        s === 0
          ? assets.map((a, i) => ({
              id: `ref-${i}`,
              kind: "image-reference" as const,
              assetId: a.id,
              layerId: layer("Neutrale Ebene"),
              origin: { x: i * 20, y: -30 },
              rotation: 0,
              metresPerPixel: 0.004,
            }))
          : storey.references,
    })),
  });
  // Storey 1: a layered build-up on every wall.
  const layered = projectWallAssemblies(p)[1]!.id;
  p = setWallAssembly(
    p,
    p.storeys[1]!.walls.map((w) => w.id),
    layered,
  );
  // Storey 4: a low roof over the whole storey; all its walls trimmed to it.
  p = selectWorkingStorey(p, p, "s4");
  p = addRoof(p, {
    id: "dach",
    points: rect(-1, -1, width + 1, depth + 1),
    referenceLine: { start: { x: -1, y: -1 }, end: { x: width + 1, y: -1 } },
    rise: "left",
    referenceHeight: 2.6,
    pitch: 3,
    thickness: 0.24,
    eaveCut: "vertical",
    topCut: "vertical",
  });
  p = trimWallsToRoof(
    p,
    p.storeys[4]!.walls.map((w) => w.id),
    "dach",
  );
  // Sections across and along the building, four elevations around it.
  for (const [i, x] of [width * 0.25, width * 0.5, width * 0.75].entries())
    p = addSection(p, {
      id: `schnitt-${i}`,
      start: { x: x + 0.1, y: -3 },
      end: { x: x + 0.1, y: depth + 3 },
      look: "left",
    });
  p = addSection(p, {
    id: "schnitt-3",
    start: { x: -3, y: depth / 2 + 0.1 },
    end: { x: width + 3, y: depth / 2 + 0.1 },
    look: "left",
  });
  let n = 0;
  p = addFourElevations(p, () => `ansicht-${n++}`);
  // Documents: one plan per storey, one per section and elevation.
  const plan = { center: { x: width / 2, y: depth / 2 }, width: width + 6, height: depth + 6 };
  for (const storey of p.storeys) {
    p = selectWorkingStorey(p, p, storey.id);
    p = changeDrawingDocument(p, p, {
      kind: "create",
      id: `abbild-${storey.id}`,
      modelViewId: `ansicht-gr-${storey.id}`,
      name: `Grundriss ${storey.name}`,
      denominator: 500,
      framing: { ...plan, pixelsPerMetre: 20 },
    });
  }
  for (const section of p.sections ?? [])
    p = changeDrawingDocument(p, p, {
      kind: "create-section",
      id: `abbild-${section.id}`,
      modelViewId: `mv-${section.id}`,
      sectionId: section.id,
      name: section.name,
      denominator: 500,
    });
  // Layouts with two placed drawings each: plans and sections in turn.
  const documents = p.drawingDocuments!.map((d) => d.id);
  for (let l = 0; l < GESAMT_DOCUMENTS.layouts; l++) {
    p = changeLayouts(p, p, {
      kind: "create-layout",
      id: `layout-${l}`,
      name: `Plan ${l + 1}`,
      folderId: LAYOUT_COLLECTION_ID,
      masterId: DEFAULT_MASTER_ID,
    });
    let state = spaceEditingReducer(createEditingState(p), {
      type: "space",
      space: { kind: "layout", id: `layout-${l}` },
    });
    for (let k = 0; k < 2; k++) {
      const documentId = documents[(l * 2 + k) % documents.length]!;
      const lens = spaceLens(state.history.present, { kind: "layout", id: `layout-${l}` });
      state = spaceEditingReducer(state, {
        type: "project",
        project: placeDrawing(lens, {
          id: `zeichnung-${l}-${k}`,
          documentId,
          position: { x: 0.05 + k * 0.2, y: 0.08 },
          frame: { width: plan.width, height: plan.height },
          denominator: 500,
        }),
      });
      if (state.error) throw new Error(`Layout ${l}: ${state.error}`);
    }
    p = state.history.present;
  }
  return selectWorkingStorey(p, p, "s2");
}

/** Element counts per kind over all storeys, for the report. */
export function gesamtCounts(p: Project) {
  const count = (pick: (s: Project["storeys"][number]) => readonly unknown[] | undefined) =>
    p.storeys.reduce((n, s) => n + (pick(s)?.length ?? 0), 0);
  return {
    walls: count((s) => s.walls),
    trimmedWalls: p.storeys.reduce((n, s) => n + s.walls.filter((w) => w.roofTrim).length, 0),
    windows: count((s) => s.windows),
    lines: count((s) => s.lines),
    slabs: count((s) => s.slabs),
    slabOpenings: count((s) => s.slabOpenings),
    rooms: count((s) => s.rooms),
    roofs: count((s) => s.roofs),
    references: count((s) => s.references),
    sections: p.sections?.length ?? 0,
    documents: p.drawingDocuments?.length ?? 0,
    layouts: p.layouts?.length ?? 0,
    placedDrawings: (p.layoutDrawings ?? []).reduce(
      (n, d) => n + (d.storey.drawings?.length ?? 0),
      0,
    ),
  };
}
