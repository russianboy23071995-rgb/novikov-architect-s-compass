import { PROJECT_SCHEMA_VERSION } from "./format.ts";
import { wallBase, wallHeights } from "../elements/wall/heights.ts";
import {
  doorSchema,
  doorV27Schema,
  insertedDoorSchema,
  openingMarkSchema,
} from "../elements/door/model.ts";
import {
  doorInsertProblem,
  windowInsertProblem,
  windowInsertSchema,
} from "../elements/window/insert.ts";
import { slabSchema } from "../elements/slab/model.ts";
import {
  slabOpeningProblem,
  slabOpeningSchema,
  slabOpeningV51Schema,
} from "../elements/slab/opening.ts";
import { roofSchema } from "../elements/roof/model.ts";
import { columnLevels, columnSchema } from "../elements/column/model.ts";
import { dimensionSchema } from "../elements/dimension/model.ts";
import { textSchema } from "../elements/text/model.ts";
import { stairGeometry, stairSchema } from "../elements/stair/model.ts";
import { railingSchema } from "../elements/railing/model.ts";
import {
  objectSchema,
  objectV58Schema,
  objectV59Schema,
  objectV60Schema,
  objectV61Schema,
} from "../elements/object/model.ts";
import { terrainSchema } from "../elements/terrain/model.ts";
import { hotkeyConflicts, hotkeysSchema, resolvedHotkeys } from "../hotkeys/model.ts";
import {
  roofWindowProblem,
  roofWindowSchema,
  roofWindowV55Schema,
} from "../elements/roof/window.ts";
import { sectionSchema } from "../views/sections.ts";
import {
  roomNumberKey,
  roomSchema,
  roomV32Schema,
  roomV33Schema,
  roomV64Schema,
} from "../elements/room/model.ts";
import {
  legacyWallTopBindingSchema,
  resolveBoundWallHeights,
  wallTopBindingSchema,
} from "../elements/wall/height-binding.ts";
import { resolveRoofTrims } from "../elements/wall/roof-trim.ts";
import { WALL_RENOVATIONS } from "../elements/wall/renovation.ts";
import {
  assemblyLibraryProblem,
  assemblyThickness,
  materialsSchema,
  projectMaterials,
  projectWallAssemblies,
  wallAssembliesSchema,
} from "../elements/wall/assembly.ts";
import { resolveStoreyLevels } from "../storeys/heights.ts";
import { placedDrawingSchema } from "../elements/drawing/model.ts";
import {
  layoutFolderSchema,
  layoutLibraryProblem,
  layoutSchema,
  projectLayouts,
  projectMasterLayouts,
  masterLayoutSchema,
  masterLayoutV48Schema,
  layoutV49Schema,
  projectInfoSchema,
  sheetSchema,
} from "../views/layouts.ts";
import {
  anyModelViewSchema,
  modelViewSchema,
  type ModelView,
  drawingDocumentSchema,
  drawingDocumentV17Schema,
  documentFolderSchema,
} from "../views/documents.ts";
import { workingPlanScale } from "../views/scale.ts";
import { hatchCellSize } from "../elements/hatch/sizing.ts";
import { penSetSchema } from "../pens/model.ts";
import { validateHatchPattern } from "../elements/hatch/pattern.ts";
import { validateLineStyle } from "../elements/line/style.ts";
import { validateLineGeometry, validateWindowGeometry } from "./geometry-validation.ts";
import {
  imageAssetSchema,
  imageReferenceSchema,
  validateReferenceExtent,
} from "../elements/reference/model.ts";
import { connectedWallSolids, type WallSolidReuse } from "../elements/wall/connections.ts";
import { wallBody } from "../elements/wall/body.ts";
import { z } from "zod";
import {
  hatchV18Schema,
  hatchV19Schema,
  hatchV15Schema,
  hatchV12Schema,
  solidHatchSchema,
  legacyHatchSchema,
  defaultHatchAppearance,
} from "../elements/hatch/model.ts";
import { layerSchema, defaultLayerIdsSchema } from "../layers/model.ts";

/** Includes a duplicated closing point for closed polylines. */
export const MAX_LINE_POINTS = 10000;

const id = z.string().trim().min(1);
const positive = z.number().finite().positive();
const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const lineSchema = z
  .object({
    id,
    kind: z.enum(["line", "polyline"]),
    points: z.array(pointSchema).min(2).max(MAX_LINE_POINTS),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    // Pen width is a display attribute in millimetres; geometry remains metres.
    penWidth: z.number().finite().min(0.05).max(2),
    style: z.enum(["solid", "dashed", "break"]),
  })
  .strict();
const wallSchema = z
  .object({
    id,
    start: pointSchema,
    end: pointSchema,
    thickness: positive,
    height: positive,
  })
  .strict();
const windowSchema = z
  .object({
    id,
    wallId: id,
    width: positive,
    height: positive,
    sillHeight: z.number().finite().nonnegative(),
    // Centre of the opening, measured from wall.start (0) to wall.end (1).
    position: z.number().finite().min(0).max(1),
  })
  .strict();
const legacyProjectSchema = z
  .object({
    schemaVersion: z.literal(1),
    unit: z.literal("m"),
    id,
    storey: z
      .object({
        id,
        walls: z.array(wallSchema),
        windows: z.array(windowSchema),
        lines: z.array(lineSchema).optional(),
      })
      .strict(),
  })
  .strict();

const currentWallSchema = wallSchema.extend({ layerId: id });
const currentWindowSchema = windowSchema.extend({ layerId: id });
const markedWindowSchema = currentWindowSchema.extend({ mark: openingMarkSchema.optional() });
/** Schema 42: optionally a window element in the opening (docs/FENSTER_TUEREN.md, FT1). */
const insertedWindowSchema = markedWindowSchema.extend({ insert: windowInsertSchema.optional() });
const legacyCurrentLineSchema = lineSchema.extend({ layerId: id });
const currentLineSchema = legacyCurrentLineSchema.extend({
  style: z.enum(["solid", "dashed", "break", "custom"]),
  pattern: z
    .object({
      id,
      name: z.string().trim().min(1).max(80),
      dashes: z.array(z.number().finite()).max(32),
      color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
      colorEditable: z.boolean().optional(),
      period: positive.max(32000),
      segments: z
        .array(z.object({ start: pointSchema, end: pointSchema }).strict())
        .min(1)
        .max(128),
    })
    .strict()
    .optional(),
  repeatLength: positive.min(0.000001).max(1000000).optional(),
});
const projectV2Schema = legacyProjectSchema.extend({
  schemaVersion: z.literal(2),
  layers: z.array(layerSchema).min(1),
  defaultLayerIds: defaultLayerIdsSchema,
  storey: legacyProjectSchema.shape.storey.extend({
    walls: z.array(currentWallSchema),
    windows: z.array(currentWindowSchema),
    lines: z.array(legacyCurrentLineSchema).optional(),
  }),
});
const projectV3Schema = projectV2Schema.extend({
  schemaVersion: z.literal(3),
  bimVisibility: z.object({ hiddenLayerIds: z.array(id) }).strict(),
});
const projectV4Schema = projectV3Schema.extend({
  schemaVersion: z.literal(4),
  storey: projectV3Schema.shape.storey.extend({ hatches: z.array(legacyHatchSchema) }),
});
const offsetWallSchema = currentWallSchema.extend({ bodyOffset: z.number().finite() });
const projectV5Schema = projectV4Schema.extend({
  schemaVersion: z.literal(5),
  storey: projectV4Schema.shape.storey.extend({ walls: z.array(offsetWallSchema) }),
});
const wallEndSchema = z
  .object({ wallId: id, endpoint: z.union([z.literal(0), z.literal(1)]) })
  .strict();
const projectV6Schema = projectV5Schema.extend({
  schemaVersion: z.literal(6),
  storey: projectV5Schema.shape.storey.extend({
    wallJoins: z.array(z.object({ first: wallEndSchema, second: wallEndSchema }).strict()),
  }),
});
const projectV7Schema = projectV6Schema.extend({
  schemaVersion: z.literal(7),
  storey: projectV6Schema.shape.storey.extend({ hatches: z.array(solidHatchSchema) }),
});
const projectV8Schema = projectV7Schema.extend({
  schemaVersion: z.literal(8),
  storey: projectV7Schema.shape.storey.extend({
    wallTJunctions: z.array(z.object({ hostWallId: id, incoming: wallEndSchema }).strict()),
  }),
});
const projectV9Schema = projectV8Schema.extend({
  schemaVersion: z.literal(9),
  assets: z.array(imageAssetSchema),
  storey: projectV8Schema.shape.storey.extend({ references: z.array(imageReferenceSchema) }),
});
const projectV10Schema = projectV9Schema.extend({
  schemaVersion: z.literal(10),
  storey: projectV9Schema.shape.storey.extend({ lines: z.array(currentLineSchema).optional() }),
});
const embeddedPatternSchema = z
  .object({
    id: z.string().min(1).max(128),
    name: z.string().min(1).max(80),
    width: positive,
    height: positive,
    lines: z
      .array(z.object({ start: pointSchema, end: pointSchema }).strict())
      .min(1)
      .max(256),
  })
  .strict();
const projectV11Schema = projectV10Schema.extend({
  schemaVersion: z.literal(11),
  hatchPatterns: z.array(embeddedPatternSchema).max(100),
  storey: projectV10Schema.shape.storey.extend({ hatches: z.array(hatchV12Schema) }),
});
const projectV12Schema = projectV11Schema.extend({
  schemaVersion: z.literal(12),
  // Omission means unknown provenance (legacy or independently created content).
  hatchPatterns: z
    .array(
      embeddedPatternSchema.extend({
        revision: z.number().int().min(1).max(Number.MAX_SAFE_INTEGER).optional(),
      }),
    )
    .max(100),
});
const projectV13Schema = projectV12Schema.extend({
  schemaVersion: z.literal(13),
  storey: projectV12Schema.shape.storey.extend({ hatches: z.array(hatchV15Schema) }),
});
const projectV14Schema = projectV13Schema.extend({
  schemaVersion: z.literal(14),
  penSet: penSetSchema.optional(),
});
const projectV15Schema = projectV14Schema.extend({
  schemaVersion: z.literal(15),
  workingViews: z
    .array(
      z
        .object({
          kind: z.literal("working-plan"),
          storeyId: id,
          denominator: positive,
        })
        .strict(),
    )
    .max(1)
    .optional(),
});
const projectV16Schema = projectV15Schema.extend({
  schemaVersion: z.literal(16),
  storey: projectV15Schema.shape.storey.extend({ hatches: z.array(hatchV18Schema) }),
});
const projectV17Schema = projectV16Schema.extend({
  schemaVersion: z.literal(17),
  modelViews: z.array(modelViewSchema).optional(),
  drawingDocuments: z.array(drawingDocumentV17Schema).optional(),
});
const projectV18Schema = projectV17Schema.extend({
  schemaVersion: z.literal(18),
  drawingDocuments: z.array(drawingDocumentSchema).optional(),
  documentFolders: z.array(documentFolderSchema).optional(),
});
const scopedLineSchema = currentLineSchema.extend({ documentId: id.optional() });
export const projectV19Schema = projectV18Schema.extend({
  schemaVersion: z.literal(19),
  storey: projectV18Schema.shape.storey.extend({
    lines: z.array(scopedLineSchema).optional(),
    hatches: z.array(hatchV19Schema),
  }),
});
export const projectV20Schema = projectV18Schema.extend({
  schemaVersion: z.literal(20),
});
export const projectV21Schema = projectV20Schema.extend({
  schemaVersion: z.literal(21),
  storey: projectV20Schema.shape.storey.extend({ name: z.string().trim().min(1).max(120) }),
});
export const projectV22Schema = projectV21Schema.extend({
  schemaVersion: z.literal(22),
  storey: projectV21Schema.shape.storey.extend({ height: positive.nullable() }),
});
export const projectV23Schema = projectV22Schema.extend({
  schemaVersion: z.literal(23),
  groundDatum: z.number().finite(),
});
export const projectV24Schema = projectV23Schema.omit({ storey: true }).extend({
  schemaVersion: z.literal(24),
  groundStoreyId: id,
  workingStoreyId: id.optional(),
  storeys: z.array(projectV22Schema.shape.storey).min(1),
});
const raisedWallSchema = offsetWallSchema.extend({ baseOffset: z.number().finite().optional() });
export const projectV25Schema = projectV24Schema.extend({
  schemaVersion: z.literal(25),
  storeys: z
    .array(projectV22Schema.shape.storey.extend({ walls: z.array(raisedWallSchema) }))
    .min(1),
});
const boundWall = <B extends z.ZodTypeAny, E extends z.ZodRawShape = Record<never, never>>(
  binding: B,
  extra?: E,
) =>
  raisedWallSchema
    .extend({ height: positive.optional(), topBinding: binding.optional(), ...(extra as E) })
    .refine((w) => w.topBinding !== undefined || w.height !== undefined, "Feste Wandhöhe fehlt.")
    .transform(({ height, ...w }) => ({ ...w, height: height ?? 0 }));
/** Schema 26–29: walls bound to the underside of an assumed raw slab. */
const legacyBoundWallSchema = boundWall(legacyWallTopBindingSchema);
/** Schema 30: walls bound to their own storey height plus extra height (29.10.2026). */
const boundWallSchema = boundWall(wallTopBindingSchema);
const finite = z.number().finite();
/** Schema 35: optional trim reference to a roof (docs/TRIMMEN_L04B.md, L04b). `trimPlane` is
 * the derived cut (resolveRoofTrims), recomputed on every validation and never stored. */
const trimShape = {
  roofTrim: z.object({ roofId: id }).strict().optional(),
  trimPlane: z
    .object({ a: finite, b: finite, c: finite, top: finite, bottom: finite })
    .strict()
    .optional(),
};
const trimmableWallSchema = boundWall(wallTopBindingSchema, trimShape);
/** Schema 36: renovation status Bestand/Neubau/Abbruch (docs/BAUZUSTAND.md); absent = Bestand. */
const renovatedWallSchema = boundWall(wallTopBindingSchema, {
  ...trimShape,
  renovation: z.enum(WALL_RENOVATIONS).optional(),
});
/** Schema 43: optional wall build-up reference (docs/WANDAUFBAU.md, SA1). */
const assembledWallSchema = boundWall(wallTopBindingSchema, {
  ...trimShape,
  renovation: z.enum(WALL_RENOVATIONS).optional(),
  assemblyId: id.optional(),
  assemblyFlipped: z.boolean().optional(),
});
export const projectV26Schema = projectV25Schema.extend({
  schemaVersion: z.literal(26),
  storeys: z
    .array(projectV22Schema.shape.storey.extend({ walls: z.array(legacyBoundWallSchema) }))
    .min(1),
});
/** Schema 27 adds hosted single-leaf doors per storey (user decision 24.10.2026). */
export const projectV27Schema = projectV26Schema.extend({
  schemaVersion: z.literal(27),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(legacyBoundWallSchema),
        doors: z.array(doorV27Schema).optional(),
      }),
    )
    .min(1),
});
/** Schema 28 adds optional position numbers to windows and doors (user decision 25.10.2026). */
export const projectV28Schema = projectV27Schema.extend({
  schemaVersion: z.literal(28),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(legacyBoundWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 29 adds floor slabs per storey (user decision 28.10.2026). */
export const projectV29Schema = projectV28Schema.extend({
  schemaVersion: z.literal(29),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(legacyBoundWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 30 binds wall tops to the storey height instead of an assumed slab (29.10.2026). */
export const projectV30Schema = projectV29Schema.extend({
  schemaVersion: z.literal(30),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(boundWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 31 adds single inclined roof surfaces per storey (docs/ROOF_ELEMENT.md, 29.10.2026). */
export const projectV31Schema = projectV30Schema.extend({
  schemaVersion: z.literal(31),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(boundWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 32 adds rooms per storey (docs/ROOM_ELEMENT.md, 29.10.2026). */
export const projectV32Schema = projectV31Schema.extend({
  schemaVersion: z.literal(32),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(boundWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV32Schema).optional(),
      }),
    )
    .min(1),
});
/** Schema 33 adds optional height lines per room (docs/ROOM_ELEMENT.md, R3). */
export const projectV33Schema = projectV32Schema.extend({
  schemaVersion: z.literal(33),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(boundWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV33Schema).optional(),
      }),
    )
    .min(1),
});
/** Schema 34: height lines with colour, line style and references (R3b). */
export const projectV34Schema = projectV33Schema.extend({
  schemaVersion: z.literal(34),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(boundWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
      }),
    )
    .min(1),
});
/** Schema 35: walls may be trimmed at a roof (docs/TRIMMEN_L04B.md, L04b). */
export const projectV35Schema = projectV34Schema.extend({
  schemaVersion: z.literal(35),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(trimmableWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
      }),
    )
    .min(1),
});
/** Schema 36: walls carry a renovation status (docs/BAUZUSTAND.md, S2). */
export const projectV36Schema = projectV35Schema.extend({
  schemaVersion: z.literal(36),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(renovatedWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
      }),
    )
    .min(1),
});
/** Schema 37: columns per storey (docs/STUETZEN.md, L05). */
export const projectV37Schema = projectV36Schema.extend({
  schemaVersion: z.literal(37),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(renovatedWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
        columns: z.array(columnSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 38: dimension chains per storey (docs/MASSKETTE.md, L12). */
export const projectV38Schema = projectV37Schema.extend({
  schemaVersion: z.literal(38),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(renovatedWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
        columns: z.array(columnSchema).optional(),
        dimensions: z.array(dimensionSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 39: texts per storey (docs/TEXT.md, L12). */
export const projectV39Schema = projectV38Schema.extend({
  schemaVersion: z.literal(39),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(renovatedWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
        columns: z.array(columnSchema).optional(),
        dimensions: z.array(dimensionSchema).optional(),
        texts: z.array(textSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 40: stairs per storey (docs/TREPPE.md, L06). */
export const projectV40Schema = projectV39Schema.extend({
  schemaVersion: z.literal(40),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(renovatedWallSchema),
        windows: z.array(markedWindowSchema),
        doors: z.array(doorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
        columns: z.array(columnSchema).optional(),
        dimensions: z.array(dimensionSchema).optional(),
        texts: z.array(textSchema).optional(),
        stairs: z.array(stairSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 41: sections of the building (docs/SCHNITT.md, SC2). */
export const projectV41Schema = projectV40Schema.extend({
  schemaVersion: z.literal(41),
  sections: z.array(sectionSchema).optional(),
});
/** Schema 42: window and door elements in their openings (docs/FENSTER_TUEREN.md, FT1). */
export const projectV42Schema = projectV41Schema.extend({
  schemaVersion: z.literal(42),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(renovatedWallSchema),
        windows: z.array(insertedWindowSchema),
        doors: z.array(insertedDoorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
        columns: z.array(columnSchema).optional(),
        dimensions: z.array(dimensionSchema).optional(),
        texts: z.array(textSchema).optional(),
        stairs: z.array(stairSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 43: materials, wall assemblies and walls referencing them (docs/WANDAUFBAU.md). */
export const projectV43Schema = projectV42Schema.extend({
  schemaVersion: z.literal(43),
  materials: materialsSchema.optional(),
  wallAssemblies: wallAssembliesSchema.optional(),
  storeys: z
    .array(
      projectV22Schema.shape.storey.extend({
        walls: z.array(assembledWallSchema),
        windows: z.array(insertedWindowSchema),
        doors: z.array(insertedDoorSchema).optional(),
        slabs: z.array(slabSchema).optional(),
        roofs: z.array(roofSchema).optional(),
        rooms: z.array(roomV64Schema).optional(),
        columns: z.array(columnSchema).optional(),
        dimensions: z.array(dimensionSchema).optional(),
        texts: z.array(textSchema).optional(),
        stairs: z.array(stairSchema).optional(),
      }),
    )
    .min(1),
});
/** Schema 44: layouts, layout folders and master layouts (docs/LAYOUTS.md, L13). */
export const projectV44Schema = projectV43Schema.extend({
  schemaVersion: z.literal(44),
  layoutFolders: z.array(layoutFolderSchema).max(2000).optional(),
  layouts: z.array(layoutSchema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutSchema).max(500).optional(),
});
/**
 * Schema 45: title blocks (Planköpfe, docs/PLANKOPF.md, PK1). Each carries a storey-shaped
 * drawing sheet at 1:1 that never belongs to the building: only lines, texts, hatches and
 * dimensions. Its storey id is the title block id.
 */
const titleBlockSchema = z
  .object({
    id,
    name: z.string().trim().min(1).max(120),
    sheet: sheetSchema,
    storey: projectV43Schema.shape.storeys.element,
  })
  .strict();
export type TitleBlock = z.infer<typeof titleBlockSchema>;
export const projectV45Schema = projectV44Schema.extend({
  schemaVersion: z.literal(45),
  titleBlocks: z.array(titleBlockSchema).max(200).optional(),
});
/** Schema 46: drawing documents of sections and elevations (docs/ABBILDER.md, AB1). */
export const projectV46Schema = projectV45Schema.extend({
  schemaVersion: z.literal(46),
  modelViews: z.array(anyModelViewSchema).optional(),
});
/**
 * Schema 47: what is drawn on a layout or master layout (docs/LAYOUTS.md, LZ1), a storey
 * shaped sheet in paper size at 1:1 like a title block. Absent: nothing drawn.
 */
const layoutDrawingSchema = z
  .object({ layoutId: id, storey: projectV43Schema.shape.storeys.element })
  .strict();
export type LayoutDrawing = z.infer<typeof layoutDrawingSchema>;
/** Schema 47 as stored before master layouts could carry a title block. */
export const projectV47Schema = projectV45Schema.extend({
  schemaVersion: z.literal(47),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingSchema).max(5000).optional(),
});
/** Schema 48: a master layout may carry a title block (docs/PLANKOPF.md, PK4). */
export const projectV48Schema = projectV45Schema.extend({
  schemaVersion: z.literal(48),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingSchema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
});
// Built from v45 directly: one more extend level is too deep for the type checker.
/** Schema 49: project information and layout fields for automatic texts (PLANKOPF.md, AT1). */
export const projectV49Schema = projectV45Schema.extend({
  schemaVersion: z.literal(49),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingSchema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 50: drawings placed on layouts (docs/ZEICHNUNG.md, ZW1). */
const drawingStoreySchema = projectV43Schema.shape.storeys.element.extend({
  drawings: z.array(placedDrawingSchema).max(500).optional(),
});
const layoutDrawingV50Schema = z.object({ layoutId: id, storey: drawingStoreySchema }).strict();
// Built from v45 directly: one more extend level is too deep for the type checker.
export const projectV50Schema = projectV45Schema.extend({
  schemaVersion: z.literal(50),
  storeys: z.array(drawingStoreySchema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV50Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 51: openings in slabs (Deckendurchbrüche, docs/DECKENDURCHBRUCH.md, L40). */
const storeyV51Schema = drawingStoreySchema.extend({
  slabOpenings: z.array(slabOpeningV51Schema).max(5000).optional(),
});
const layoutDrawingV51Schema = z.object({ layoutId: id, storey: storeyV51Schema }).strict();
export const projectV51Schema = projectV45Schema.extend({
  schemaVersion: z.literal(51),
  storeys: z.array(storeyV51Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV51Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 52: round slab openings (circle with centre and diameter). Schema 53: same structure,
 * a slab is the floor of its storey (docs/SLAB_ELEMENT.md). */
const storeyV53Schema = drawingStoreySchema.extend({
  slabOpenings: z.array(slabOpeningSchema).max(5000).optional(),
});
const layoutDrawingV52Schema = z.object({ layoutId: id, storey: storeyV53Schema }).strict();
export const projectV53Schema = projectV45Schema.extend({
  schemaVersion: z.literal(53),
  storeys: z.array(storeyV53Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV52Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 54: railings (Geländer, docs/GELAENDER.md, L42). */
const storeyV54Schema = storeyV53Schema.extend({
  railings: z.array(railingSchema).max(5000).optional(),
});
const layoutDrawingV54Schema = z.object({ layoutId: id, storey: storeyV54Schema }).strict();
export const projectV54Schema = projectV45Schema.extend({
  schemaVersion: z.literal(54),
  storeys: z.array(storeyV54Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV54Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 55: roof windows (Dachflächenfenster, docs/DACHFLAECHENFENSTER.md, L41). */
const storeyV55Schema = storeyV54Schema.extend({
  roofWindows: z.array(roofWindowV55Schema).max(5000).optional(),
});
const layoutDrawingV55Schema = z.object({ layoutId: id, storey: storeyV55Schema }).strict();
export const projectV55Schema = projectV45Schema.extend({
  schemaVersion: z.literal(55),
  storeys: z.array(storeyV55Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV55Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 56: roof window reveals (upper horizontal, lower plumb; docs/DACHFLAECHENFENSTER.md). */
const storeyV56Schema = storeyV54Schema.extend({
  roofWindows: z.array(roofWindowSchema).max(5000).optional(),
});
const layoutDrawingV56Schema = z.object({ layoutId: id, storey: storeyV56Schema }).strict();
export const projectV56Schema = projectV45Schema.extend({
  schemaVersion: z.literal(56),
  storeys: z.array(storeyV56Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV56Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 57: placed objects (Objektbibliothek, docs/OBJEKTBIBLIOTHEK.md, L44). */
const storeyV57Schema = storeyV56Schema.extend({
  objects: z.array(objectV58Schema).max(20000).optional(),
});
const layoutDrawingV57Schema = z.object({ layoutId: id, storey: storeyV57Schema }).strict();
export const projectV57Schema = projectV45Schema.extend({
  schemaVersion: z.literal(57),
  storeys: z.array(storeyV57Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV57Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
});
/** Schema 58: the user's keyboard shortcuts travel with the project (docs/TASTENKUERZEL.md). */
export const projectV58Schema = projectV45Schema.extend({
  schemaVersion: z.literal(58),
  storeys: z.array(storeyV57Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV57Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
/** Schema 59: objects carry options and finishes (docs/OBJEKTBIBLIOTHEK.md, M2). */
const storeyV59Schema = storeyV56Schema.extend({
  objects: z.array(objectV59Schema).max(20000).optional(),
});
const layoutDrawingV59Schema = z.object({ layoutId: id, storey: storeyV59Schema }).strict();
export const projectV59Schema = projectV45Schema.extend({
  schemaVersion: z.literal(59),
  storeys: z.array(storeyV59Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV59Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
/** Schema 60: car and television (docs/OBJEKTBIBLIOTHEK.md, M3). */
const storeyV60Schema = storeyV56Schema.extend({
  objects: z.array(objectV60Schema).max(20000).optional(),
});
const layoutDrawingV60Schema = z.object({ layoutId: id, storey: storeyV60Schema }).strict();
export const projectV60Schema = projectV45Schema.extend({
  schemaVersion: z.literal(60),
  storeys: z.array(storeyV60Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV60Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
/** Schema 61: five more furniture entries, doors and boards (docs/OBJEKTBIBLIOTHEK.md, M4). */
const storeyV61Schema = storeyV56Schema.extend({
  objects: z.array(objectV61Schema).max(20000).optional(),
});
const layoutDrawingV61Schema = z.object({ layoutId: id, storey: storeyV61Schema }).strict();
export const projectV61Schema = projectV45Schema.extend({
  schemaVersion: z.literal(61),
  storeys: z.array(storeyV61Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV61Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
/** Schema 62: options of kitchen and bathroom pieces (docs/OBJEKTBIBLIOTHEK.md, M5). */
const storeyV62Schema = storeyV56Schema.extend({
  objects: z.array(objectSchema).max(20000).optional(),
});
const layoutDrawingV62Schema = z.object({ layoutId: id, storey: storeyV62Schema }).strict();
export const projectV62Schema = projectV45Schema.extend({
  schemaVersion: z.literal(62),
  storeys: z.array(storeyV62Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV62Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
/**
 * Schema 63: elements drawn above or below all kinds (docs/DARSTELLUNGSREIHENFOLGE.md, K3), in
 * drawing order. Ids of deleted elements are ignored and dropped at the next change.
 */
const storeyV63Schema = storeyV62Schema.extend({
  displayBands: z
    .object({ front: z.array(id).max(20000), back: z.array(id).max(20000) })
    .strict()
    .optional(),
});
const layoutDrawingV63Schema = z.object({ layoutId: id, storey: storeyV63Schema }).strict();
export const projectV63Schema = projectV45Schema.extend({
  schemaVersion: z.literal(63),
  storeys: z.array(storeyV63Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV63Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
/** Schema 64: the terrain of the project, in its ground storey (docs/GELAENDE.md). */
const storeyV64Schema = storeyV63Schema.extend({
  terrains: z.array(terrainSchema).max(1).optional(),
});
const layoutDrawingV64Schema = z.object({ layoutId: id, storey: storeyV64Schema }).strict();
export const projectV64Schema = projectV45Schema.extend({
  schemaVersion: z.literal(64),
  storeys: z.array(storeyV64Schema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV64Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
/** Schema 65: how a room counts for the living area (docs/WOHNFLAECHE.md). */
const storeySchema = storeyV64Schema.extend({
  rooms: z.array(roomSchema).optional(),
});
const layoutDrawingV65Schema = z.object({ layoutId: id, storey: storeySchema }).strict();
const projectSchema = projectV45Schema.extend({
  schemaVersion: z.literal(PROJECT_SCHEMA_VERSION),
  storeys: z.array(storeySchema).min(1),
  modelViews: z.array(anyModelViewSchema).optional(),
  layoutDrawings: z.array(layoutDrawingV65Schema).max(5000).optional(),
  masterLayouts: z.array(masterLayoutV48Schema).max(500).optional(),
  layouts: z.array(layoutV49Schema).max(5000).optional(),
  projectInfo: projectInfoSchema.optional(),
  hotkeys: hotkeysSchema.optional(),
});
type SingleProject = z.infer<typeof projectV23Schema>;
export function validateProjectV18(value: unknown) {
  const old = projectV18Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV17(value: unknown) {
  const old = projectV17Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV16(value: unknown) {
  const old = projectV16Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV15(value: unknown) {
  const old = projectV15Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV14(value: unknown) {
  const old = projectV14Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV13(value: unknown) {
  const old = projectV13Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV12(value: unknown) {
  const old = projectV12Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV11(value: unknown) {
  const old = projectV11Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
  });
  return old;
}
export function validateProjectV10(value: unknown) {
  const old = projectV10Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
    hatchPatterns: [],
  });
  return old;
}
export function validateProjectV9(value: unknown) {
  const old = projectV9Schema.parse(value);
  validateStoreyScope({
    ...old,
    storey: { ...old.storey, name: "Level 01", height: null },
    schemaVersion: 23,
    groundDatum: 0,
    hatchPatterns: [],
  });
  return old;
}
export function validateProjectV8(value: unknown) {
  const old = projectV8Schema.parse(value);
  validateStoreyScope({
    ...old,
    schemaVersion: 23,
    groundDatum: 0,
    hatchPatterns: [],
    assets: [],
    storey: { ...old.storey, references: [], name: "Level 01", height: null },
  });
  return old;
}
export function validateProjectV7(value: unknown) {
  const project = projectV7Schema.parse(value);
  validateProjectV8({
    ...project,
    schemaVersion: 8,
    storey: { ...project.storey, wallTJunctions: [] },
  });
  return project;
}
type ProjectV6 = z.infer<typeof projectV6Schema>;
export function validateProjectV6(value: unknown): ProjectV6 {
  const project = projectV6Schema.parse(value);
  // Reuse current relation validation on a disposable explicitly converted view.
  validateProjectV8({
    ...project,
    schemaVersion: 8,
    storey: {
      ...project.storey,
      wallTJunctions: [],
      hatches: project.storey.hatches.map((h) => ({ ...h, ...defaultHatchAppearance })),
    },
  });
  return project;
}
type ProjectV5 = z.infer<typeof projectV5Schema>;
export function validateProjectV5(value: unknown): ProjectV5 {
  const project = projectV5Schema.parse(value);
  validateGeometry(project);
  validateLayers(project);
  validateVisibility(project);
  return project;
}

type ProjectV4 = z.infer<typeof projectV4Schema>;
export function validateProjectV4(value: unknown): ProjectV4 {
  const project = projectV4Schema.parse(value);
  validateGeometry(project);
  validateLayers(project);
  validateVisibility(project);
  return project;
}
type ProjectV3 = z.infer<typeof projectV3Schema>;
export function validateProjectV3(value: unknown): ProjectV3 {
  const project = projectV3Schema.parse(value);
  validateGeometry(project);
  validateLayers(project);
  validateVisibility(project);
  return project;
}
type ProjectV2 = z.infer<typeof projectV2Schema>;
export function validateProjectV2(value: unknown): ProjectV2 {
  const project = projectV2Schema.parse(value);
  validateGeometry(project);
  validateLayers(project);
  return project;
}
export type LegacyProject = z.infer<typeof legacyProjectSchema>;
export function validateLegacyProject(value: unknown): LegacyProject {
  const project = legacyProjectSchema.parse(value);
  validateGeometry(project);
  return project;
}

/** All lengths and coordinates are in metres; position is dimensionless. */
export type Wall = z.infer<typeof assembledWallSchema>;
export type BimWindow = z.infer<typeof insertedWindowSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Point = z.infer<typeof pointSchema>;
export type DrawingLine = z.infer<typeof currentLineSchema>;

export function wallLength(wall: { start: Point; end: Point }): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

/** Reuse of a storey's scope result; only provenance-holding callers may provide one. */
export type StoreyValidationMemo = {
  /** Pattern IDs used by an identical, previously validated storey under the same key. */
  lookup(storey: unknown, key: readonly unknown[]): readonly string[] | undefined;
  record(index: number, used: readonly string[]): void;
  /** True only for an element object an earlier validation produced and nobody can change. */
  knownElement?(element: unknown): boolean;
};

// Element lists whose entries parse independently of each other and of the storey context, so
// a known element of a changed storey may skip parsing (docs/performance/EDIT_CYCLE.md, Teil B).
// Walls stay out: their bound heights depend on the storey levels and are resolved after
// parsing. Every check over the whole storey still runs on the reassembled lists.
export const REUSABLE_ELEMENT_LISTS = [
  "windows",
  "doors",
  "slabs",
  "roofs",
  "rooms",
  "lines",
  "hatches",
  "references",
] as const;

/** The changed storeys with known elements taken out of their lists, and where they were. */
function withoutKnownElements(
  input: Record<string, unknown> & { storeys: unknown[] },
  memo: StoreyValidationMemo,
  skip: readonly (readonly string[] | undefined)[] | undefined,
) {
  const removed = new Map<number, Map<string, Map<number, unknown>>>();
  const storeys = input.storeys.map((storey, index) => {
    if (skip?.[index] || !storey || typeof storey !== "object") return storey;
    const lists = new Map<string, Map<number, unknown>>();
    const copy: Record<string, unknown> = { ...(storey as Record<string, unknown>) };
    for (const name of REUSABLE_ELEMENT_LISTS) {
      const list = copy[name];
      if (!Array.isArray(list)) continue;
      const known = new Map<number, unknown>();
      list.forEach((element, i) => {
        if (memo.knownElement!(element)) known.set(i, element);
      });
      if (!known.size) continue;
      lists.set(name, known);
      copy[name] = list.filter((_, i) => !known.has(i));
    }
    if (!lists.size) return storey;
    removed.set(index, lists);
    return copy;
  });
  return removed.size ? { value: { ...input, storeys }, removed } : undefined;
}

/** Put known elements back at their original positions in the parsed lists. */
function restoreKnownElements(
  storeys: Record<string, unknown>[],
  removed: ReadonlyMap<number, ReadonlyMap<string, ReadonlyMap<number, unknown>>>,
) {
  for (const [index, lists] of removed) {
    const storey = storeys[index]!;
    for (const [name, known] of lists) {
      const parsed = [...(storey[name] as unknown[])];
      for (const [position, element] of [...known].sort((a, b) => a[0] - b[0]))
        parsed.splice(position, 0, element);
      storey[name] = parsed;
    }
  }
}

/** Everything a storey's scope validation reads besides the storey itself: its own and the next
 * storey's resolved levels (bound wall heights) and every other project value by identity.
 * Any difference forces full validation of that storey. Extend this when a new rule reads more.
 */
/**
 * Project values the scope check of one storey reads besides the storey itself
 * (validateStoreyScope; docs/performance/STOREY_KEYS.md). A value read there must be listed
 * here, or a changed value would reuse a stale check. Layouts, title blocks, sections, other
 * storeys' views and documents, project information and the visibility are not read (the
 * visibility is checked once for the project).
 */
const STOREY_SCOPE_FIELDS = [
  "id",
  "layers",
  "defaultLayerIds",
  "assets",
  "hatchPatterns",
  "documentFolders",
] as const;
type ViewLike = { id: string; kind?: string; storeyId?: string };
function storeyKeys(
  identity: Record<string, unknown>,
  storeys: readonly { id: string; height: number | null }[],
  groundStoreyId: string,
): unknown[][] {
  const levels = new Map(
    resolveStoreyLevels(storeys, groundStoreyId).map((s) => [s.storeyId, s.elevation]),
  );
  const shared = STOREY_SCOPE_FIELDS.flatMap((name) => [name, identity[name]]);
  const working = (identity["workingViews"] as readonly ViewLike[] | undefined) ?? [];
  const plans = ((identity["modelViews"] as readonly ViewLike[] | undefined) ?? []).filter(
    (v) => v.kind === "floor-plan",
  );
  const documents =
    (identity["drawingDocuments"] as readonly { modelViewId: string }[] | undefined) ?? [];
  return storeys.map((storey, index) => {
    const next = storeys[index + 1];
    // The storey's own working views, plan views and their documents, as the scope gets them.
    const views = plans.filter((v) => v.storeyId === storey.id);
    const ids = new Set(views.map((v) => v.id));
    return [
      levels.get(storey.id),
      next?.id,
      next && levels.get(next.id),
      ...shared,
      "working",
      ...working.filter((v) => v.storeyId === storey.id),
      "plans",
      ...views,
      "documents",
      ...documents.filter((d) => ids.has(d.modelViewId)),
    ];
  });
}

const sameKey = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((value, i) => Object.is(value, b[i]));

/** Decide reuse before parsing, from the caller's storey objects and unparsed levels.
 * Malformed input that cannot even yield levels simply parses in full.
 */
function reusableStoreys(
  input: Record<string, unknown> & { storeys: unknown[] },
  memo: StoreyValidationMemo,
) {
  let keys: unknown[][];
  try {
    keys = storeyKeys(
      input,
      input.storeys as { id: string; height: number | null }[],
      input["groundStoreyId"] as string,
    );
  } catch {
    return undefined;
  }
  const known = input.storeys.map((storey, i) => memo.lookup(storey, keys[i]!));
  return known.some(Boolean) ? { keys, known } : undefined;
}

/** Same storey identity and scalar fields for parsing, with its element lists left empty. */
function withoutReusedContent(
  input: Record<string, unknown> & { storeys: unknown[] },
  known: readonly (readonly string[] | undefined)[],
) {
  return {
    ...input,
    storeys: input.storeys.map((storey, i) =>
      known[i]
        ? Object.fromEntries(
            Object.entries(storey as object).map(([k, v]) => [k, Array.isArray(v) ? [] : v]),
          )
        : storey,
    ),
  };
}

/** Keys of a validated project, for registering its storeys after validation. */
export function storeyValidationKeys(project: Project): unknown[][] {
  return storeyKeys(project, project.storeys, project.groundStoreyId);
}

/** Validates unknown data; owned immutable asset handles may be shared. Other data is copied.
 * With a memo, project-wide checks still run in full; a storey's own scope result is reused
 * only for the identical storey object under an identical key.
 */
export function validateProject(
  value: unknown,
  reuse?: WallSolidReuse,
  memo?: StoreyValidationMemo,
): Project {
  // Identities come from the caller's value; parsing copies them.
  const input = memo ? (value as Record<string, unknown> & { storeys: unknown[] }) : undefined;
  const early = input && reusableStoreys(input, memo!);
  const reduced = early ? withoutReusedContent(input!, early.known) : value;
  const elements =
    input && memo!.knownElement
      ? withoutKnownElements(reduced as typeof input, memo!, early?.known)
      : undefined;
  const parsed = projectSchema.parse(elements ? elements.value : reduced);
  if (elements) restoreKnownElements(parsed.storeys as Record<string, unknown>[], elements.removed);
  // A reused storey is the validated output of an identical earlier parse; put it back.
  if (early)
    parsed.storeys = parsed.storeys.map((storey, i) =>
      early.known[i] ? (input!.storeys[i] as typeof storey) : storey,
    );
  // Two commands on one shortcut would make one of them unreachable (docs/TASTENKUERZEL.md).
  if (parsed.hotkeys && hotkeyConflicts(resolvedHotkeys(parsed.hotkeys)).length)
    throw new Error("Zwei Befehle haben dasselbe Tastenkürzel.");
  const project = resolveRoofTrims(resolveBoundWallHeights(parsed));
  const levels = resolveStoreyLevels(project.storeys, project.groundStoreyId, project.groundDatum);
  if (
    project.workingStoreyId &&
    levels.find((s) => s.storeyId === project.workingStoreyId)?.elevation === null
  )
    throw new Error("Die Höhe des Arbeitsgeschosses ist nicht aufgelöst.");
  const storeyIds = new Set(project.storeys.map((s) => s.id));
  if (project.workingStoreyId && !storeyIds.has(project.workingStoreyId))
    throw new Error("Unbekanntes Arbeitsgeschoss.");
  for (const view of [...(project.workingViews ?? []), ...floorPlanViews(project)])
    if (!storeyIds.has(view.storeyId)) throw new Error("Unbekanntes Geschoss im Ansichtskontext.");
  const sectionIds = new Set((project.sections ?? []).map((s) => s.id));
  for (const view of project.modelViews ?? [])
    if (view.kind === "section" && !sectionIds.has(view.sectionId))
      throw new Error("Der Schnitt bzw. die Ansicht eines Abbilds fehlt.");
  for (const doc of project.drawingDocuments ?? []) {
    const view = project.modelViews?.find((v) => v.id === doc.modelViewId);
    if (!view) throw new Error("Unbekannte Modellansicht im Abbild.");
    // A section document is checked here; plan documents with their storey below.
    if (view.kind !== "section") continue;
    if (doc.folderId && !project.documentFolders?.some((f) => f.id === doc.folderId))
      throw new Error("Unbekannter Abbildordner.");
    if (
      new Set(doc.hiddenLayerIds).size !== doc.hiddenLayerIds.length ||
      doc.hiddenLayerIds.some((id) => !project.layers.some((l) => l.id === id))
    )
      throw new Error("Ungültige Ebenensichtbarkeit im Abbild.");
  }
  const ids = new Set<string>();
  const entities = [
    project,
    ...project.layers,
    ...project.assets,
    ...(project.modelViews ?? []),
    ...(project.drawingDocuments ?? []),
    ...(project.documentFolders ?? []),
    ...(project.sections ?? []),
    ...(project.layoutFolders ?? []),
    ...(project.layouts ?? []),
    ...(project.masterLayouts ?? []),
    ...[
      ...project.storeys,
      ...(project.titleBlocks ?? []).map((t) => t.storey),
      ...(project.layoutDrawings ?? []).map((d) => d.storey),
    ].flatMap((s) => [
      s,
      ...s.walls,
      ...s.windows,
      ...(s.doors ?? []),
      ...(s.slabs ?? []),
      ...((s as { slabOpenings?: readonly { id: string }[] }).slabOpenings ?? []),
      ...(s.roofs ?? []),
      ...(s.rooms ?? []),
      ...(s.columns ?? []),
      ...(s.dimensions ?? []),
      ...(s.texts ?? []),
      ...(s.stairs ?? []),
      ...((s as { railings?: readonly { id: string }[] }).railings ?? []),
      ...((s as { roofWindows?: readonly { id: string }[] }).roofWindows ?? []),
      ...((s as { objects?: readonly { id: string }[] }).objects ?? []),
      ...(s.lines ?? []),
      ...s.hatches,
      ...s.references,
      // Title block sheets (schema 43 storeys) hold no placed drawings.
      ...((s as { drawings?: readonly { id: string }[] }).drawings ?? []),
    ]),
  ];
  for (const entity of entities) {
    if (ids.has(entity.id)) throw new Error("Duplicate ID: " + entity.id);
    ids.add(entity.id);
  }
  const used = new Set<string>();
  const { storeys, groundStoreyId: _ground, ...shared } = project;
  // Hidden layers exist: checked here once, not per storey (not part of the storey key).
  validateVisibility(project as unknown as SingleProject);
  validateRoomNumbers(storeys);
  // Drawings lie on layouts only (ZW1). A layout's sheet seen as a storey (the drawing space
  // of a layout tab) carries the id „sheet-<layout>“; a storey of the building never does.
  const sheetIds = new Set(
    [...projectLayouts(project), ...projectMasterLayouts(project)].map((l) => `sheet-${l.id}`),
  );
  if (storeys.some((storey) => storey.drawings?.length && !sheetIds.has(storey.id)))
    throw new Error("Zeichnungen gehören auf ein Layout, nicht in ein Geschoss.");
  const localLevels = new Map(
    resolveStoreyLevels(storeys, project.groundStoreyId).map((s) => [s.storeyId, s.elevation]),
  );
  // The early decision used unparsed levels; it stands only if parsed levels give the same key.
  const keys = early && storeyKeys(input!, storeys, project.groundStoreyId);
  for (const [index, storey] of storeys.entries()) {
    const known = early?.known[index];
    if (known && sameKey(early!.keys[index]!, keys![index]!)) {
      known.forEach((id) => used.add(id));
      memo!.record(index, known);
      continue;
    }
    const elevation = localLevels.get(storey.id);
    for (const wall of storey.walls) wallHeights(wall, elevation ?? 0);
    const modelViews = floorPlanViews(project).filter((v) => v.storeyId === storey.id);
    const scopeInput: SingleProject = {
      ...shared,
      schemaVersion: 23,
      groundDatum: 0,
      storey,
      workingViews: project.workingViews?.filter((v) => v.storeyId === storey.id),
      modelViews,
      drawingDocuments: project.drawingDocuments?.filter((d) =>
        modelViews?.some((v) => v.id === d.modelViewId),
      ),
    };
    const scope = validateStoreyScope(scopeInput, scopeInput, reuse);
    validateStoreyDoors(storey, project.layers);
    validateStoreyInserts(storey);
    validateStoreySlabs(storey, project.layers);
    validateStoreyRoofs(storey, project.layers);
    validateStoreyRooms(storey, project.layers);
    validateStoreyColumns(storey, project.layers);
    validateStoreyRailings(storey, project.layers);
    validateStoreyObjects(storey, project.layers);
    validateStoreyRoofWindows(storey, project.layers);
    // Stairs: existing layer and a climbable height (docs/TREPPE.md).
    for (const stair of storey.stairs ?? []) {
      if (!project.layers.some((l) => l.id === stair.layerId))
        throw new Error("Unknown layer: " + stair.layerId);
      if (!stairGeometry(stair, storey.height))
        throw new Error(`Treppe ${stair.id}: Höhe unbekannt oder nicht positiv.`);
    }
    for (const annotation of [...(storey.dimensions ?? []), ...(storey.texts ?? [])])
      if (!project.layers.some((l) => l.id === annotation.layerId))
        throw new Error("Unknown layer: " + annotation.layerId);
    scope.hatchPatterns.forEach((p) => used.add(p.id));
    memo?.record(
      index,
      scope.hatchPatterns.map((p) => p.id),
    );
  }
  for (const block of project.titleBlocks ?? []) {
    if (block.storey.id !== block.id)
      throw new Error(`Plankopf ${block.name}: Zeichenblatt passt nicht.`);
    drawingSheetPatterns(
      project,
      shared,
      block.storey,
      `Plankopf ${block.name}`,
      true,
      reuse,
    ).forEach((id) => used.add(id));
  }
  // Layout drawings (LZ1): one sheet per layout or master layout, no dimension chains.
  const sheetOwners = new Set([
    ...projectLayouts(project).map((l) => l.id),
    ...projectMasterLayouts(project).map((m) => m.id),
  ]);
  const drawn = new Set<string>();
  for (const drawing of project.layoutDrawings ?? []) {
    if (!sheetOwners.has(drawing.layoutId) || drawn.has(drawing.layoutId))
      throw new Error("Zeichnung ohne Layout oder doppelt.");
    drawn.add(drawing.layoutId);
    drawingSheetPatterns(project, shared, drawing.storey, "Layoutzeichnung", false, reuse).forEach(
      (id) => used.add(id),
    );
  }
  validateWallAssemblies(project);
  // A layout's drawing document exists (AT1).
  for (const layout of project.layouts ?? [])
    if (layout.documentId && !project.drawingDocuments?.some((d) => d.id === layout.documentId))
      throw new Error(`Layout ${layout.name}: Abbild fehlt.`);
  // A master layout's title block exists (PK4).
  for (const master of project.masterLayouts ?? [])
    if (master.titleBlockId && !project.titleBlocks?.some((t) => t.id === master.titleBlockId))
      throw new Error(`Masterlayout ${master.name}: Plankopf fehlt.`);
  const layoutProblem = layoutLibraryProblem(project);
  if (layoutProblem) throw new Error(layoutProblem);
  return { ...project, hatchPatterns: project.hatchPatterns.filter((p) => used.has(p.id)) };
}

/** Library rules; a wall with a build-up has its thickness (docs/WANDAUFBAU.md, SA1). */
function validateWallAssemblies(project: Project): void {
  const assemblies = projectWallAssemblies(project);
  const problem = assemblyLibraryProblem(projectMaterials(project), assemblies);
  if (problem) throw new Error(problem);
  const byId = new Map(assemblies.map((a) => [a.id, a]));
  for (const wall of project.storeys.flatMap((s) => s.walls)) {
    if (wall.assemblyId === undefined) {
      if (wall.assemblyFlipped !== undefined)
        throw new Error(`Wand ${wall.id}: gespiegelt ohne Wandaufbau.`);
      continue;
    }
    const assembly = byId.get(wall.assemblyId);
    if (!assembly) throw new Error(`Wand ${wall.id}: unbekannter Wandaufbau ${wall.assemblyId}.`);
    if (Math.abs(assemblyThickness(assembly) - wall.thickness) > 1e-6)
      throw new Error(
        `Wand ${wall.id}: Wandstärke ${wall.thickness} m passt nicht zum Aufbau ${assembly.name} (${assemblyThickness(assembly)} m).`,
      );
  }
}

/** Doors fit their host wall in length and height; underside is relative to the storey level. */
function validateStoreyDoors(storey: Project["storeys"][number], layers: { id: string }[]): void {
  if (!storey.doors?.length) return;
  const walls = new Map(storey.walls.map((w) => [w.id, w]));
  const layerIds = new Set(layers.map((l) => l.id));
  for (const door of storey.doors) {
    const wall = walls.get(door.wallId);
    if (!wall) throw new Error(`Tür ${door.id}: unbekannte Wand ${door.wallId}.`);
    if (!layerIds.has(door.layerId)) throw new Error("Unknown layer: " + door.layerId);
    const length = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
    const centre = door.position * length;
    if (door.width > length || centre < door.width / 2 || length - centre < door.width / 2)
      throw new Error(`Tür ${door.id} muss in die Wandlänge passen.`);
    const bottom = door.zOffset - wallBase(wall);
    if (bottom < 0 || bottom + door.height > wall.height)
      throw new Error(`Tür ${door.id} muss in die Wandhöhe passen.`);
  }
}

/** Window and door elements fit their opening and the wall thickness (FT1). */
function validateStoreyInserts(storey: Project["storeys"][number]): void {
  const walls = new Map(storey.walls.map((w) => [w.id, w]));
  for (const window of storey.windows) {
    const wall = walls.get(window.wallId);
    const problem =
      window.insert && wall ? windowInsertProblem(window.insert, window, wall.thickness) : null;
    if (problem) throw new Error(`Fenster ${window.mark ?? window.id}: ${problem}`);
  }
  for (const door of storey.doors ?? []) {
    const wall = walls.get(door.wallId);
    const problem =
      door.insert && wall ? doorInsertProblem(door.insert, door, wall.thickness) : null;
    if (problem) throw new Error(`Tür ${door.mark ?? door.id}: ${problem}`);
  }
}

/** Slabs reference an existing layer; their outline and values are checked by the schema.
 * Slab openings (L40) belong to a slab of the same storey and lie strictly inside it. */
function validateStoreySlabs(storey: Project["storeys"][number], layers: { id: string }[]): void {
  if (!storey.slabs?.length && !storey.slabOpenings?.length) return;
  const layerIds = new Set(layers.map((l) => l.id));
  for (const slab of storey.slabs ?? [])
    if (!layerIds.has(slab.layerId)) throw new Error("Unknown layer: " + slab.layerId);
  const openings = storey.slabOpenings ?? [];
  for (const opening of openings) {
    if (!layerIds.has(opening.layerId)) throw new Error("Unknown layer: " + opening.layerId);
    if (!storey.slabs?.some((slab) => slab.id === opening.slabId))
      throw new Error(`Deckendurchbruch ${opening.id}: Decke fehlt.`);
  }
  for (const slab of openings.length ? (storey.slabs ?? []) : []) {
    const problem = slabOpeningProblem(
      slab,
      openings.filter((o) => o.slabId === slab.id),
    );
    if (problem) throw new Error(problem);
  }
}

/** Rooms reference an existing layer; their numbers are unique in the whole project (N32). */
function validateStoreyRooms(storey: Project["storeys"][number], layers: { id: string }[]): void {
  if (!storey.rooms?.length) return;
  const layerIds = new Set(layers.map((l) => l.id));
  for (const room of storey.rooms)
    if (!layerIds.has(room.layerId)) throw new Error("Unknown layer: " + room.layerId);
}

/** Room numbers across all storeys, also reused ones: a cheap text comparison per room. */
function validateRoomNumbers(storeys: readonly Project["storeys"][number][]): void {
  const numbers = new Set<string>();
  for (const storey of storeys)
    for (const room of storey.rooms ?? []) {
      const key = roomNumberKey(room.number);
      if (numbers.has(key))
        throw new Error(`Raumnummer ${room.number.trim()} ist bereits vergeben.`);
      numbers.add(key);
    }
}

/** Columns reference an existing layer and keep a positive height; a bound top needs the storey
 * height (docs/STUETZEN.md). */
function validateStoreyColumns(storey: Project["storeys"][number], layers: { id: string }[]): void {
  if (!storey.columns?.length) return;
  const layerIds = new Set(layers.map((l) => l.id));
  for (const column of storey.columns) {
    if (!layerIds.has(column.layerId)) throw new Error("Unknown layer: " + column.layerId);
    const levels = columnLevels(column, storey.height);
    if (!levels) throw new Error(`Stütze ${column.id}: Geschossbindung braucht eine Geschosshöhe.`);
    if (levels.top - levels.bottom <= 1e-9)
      throw new Error(`Stütze ${column.id}: Oberkante muss über dem Fuß liegen.`);
  }
}

/** Railings reference an existing layer; line and values are checked by the schema
 * (docs/GELAENDER.md). */
function validateStoreyRailings(
  storey: Project["storeys"][number],
  layers: { id: string }[],
): void {
  if (!storey.railings?.length) return;
  const layerIds = new Set(layers.map((l) => l.id));
  for (const railing of storey.railings)
    if (!layerIds.has(railing.layerId)) throw new Error("Unknown layer: " + railing.layerId);
}

/** Objects reference an existing layer; catalogue entry and values are checked by the schema
 * (docs/OBJEKTBIBLIOTHEK.md). */
function validateStoreyObjects(storey: Project["storeys"][number], layers: { id: string }[]): void {
  if (!storey.objects?.length) return;
  const layerIds = new Set(layers.map((l) => l.id));
  for (const object of storey.objects)
    if (!layerIds.has(object.layerId)) throw new Error("Unknown layer: " + object.layerId);
}

/** Roof windows reference an existing layer and a roof of the same storey and lie strictly
 * inside it, apart from each other (docs/DACHFLAECHENFENSTER.md). */
function validateStoreyRoofWindows(
  storey: Project["storeys"][number],
  layers: { id: string }[],
): void {
  const windows = storey.roofWindows ?? [];
  if (!windows.length) return;
  const layerIds = new Set(layers.map((l) => l.id));
  for (const w of windows) {
    if (!layerIds.has(w.layerId)) throw new Error("Unknown layer: " + w.layerId);
    if (!storey.roofs?.some((roof) => roof.id === w.roofId))
      throw new Error(`Dachflächenfenster ${w.id}: Dach fehlt.`);
  }
  for (const roof of storey.roofs ?? []) {
    const own = windows.filter((w) => w.roofId === roof.id);
    const problem = own.length ? roofWindowProblem(roof, own) : null;
    if (problem) throw new Error(problem);
  }
}

/** Roofs reference an existing layer; outline, values and end cuts are checked by the schema. */
function validateStoreyRoofs(storey: Project["storeys"][number], layers: { id: string }[]): void {
  if (!storey.roofs?.length) return;
  const layerIds = new Set(layers.map((l) => l.id));
  for (const roof of storey.roofs)
    if (!layerIds.has(roof.layerId)) throw new Error("Unknown layer: " + roof.layerId);
}

function validateStoreyScope(
  value: unknown,
  parsed?: SingleProject,
  reuse?: WallSolidReuse,
): SingleProject {
  const project = parsed ?? projectV23Schema.parse(value);
  resolveStoreyLevels([project.storey], project.storey.id, project.groundDatum);
  if (project.workingViews?.some((view) => view.storeyId !== project.storey.id))
    throw new Error("Unbekanntes Geschoss im Arbeitsmaßstab.");
  const views = new Map((project.modelViews ?? []).map((v) => [v.id, v]));
  for (const view of views.values())
    if (view.storeyId !== project.storey.id) throw new Error("Unbekanntes Geschoss im Abbild.");
  for (const doc of project.drawingDocuments ?? []) {
    if (doc.folderId && !project.documentFolders?.some((f) => f.id === doc.folderId))
      throw new Error("Unbekannter Abbildordner.");
    if (!views.has(doc.modelViewId)) throw new Error("Unbekannte Modellansicht im Abbild.");
    if (
      new Set(doc.hiddenLayerIds).size !== doc.hiddenLayerIds.length ||
      doc.hiddenLayerIds.some((id) => !project.layers.some((l) => l.id === id))
    )
      throw new Error("Ungültige Ebenensichtbarkeit im Abbild.");
  }
  validateGeometry(project);
  connectedWallSolids(project, reuse);
  validateLayers(project);
  validateVisibility(project);
  const assets = new Map(project.assets.map((a) => [a.id, a]));
  for (const reference of project.storey.references) {
    const asset = assets.get(reference.assetId);
    if (!asset) throw new Error("Unknown image asset: " + reference.assetId);
    validateReferenceExtent(reference, asset);
  }
  const patterns = new Map(project.hatchPatterns.map((p) => [p.id, validateHatchPattern(p)]));
  if (patterns.size !== project.hatchPatterns.length)
    throw new Error("Doppelte Schraffurmuster-ID.");
  const used = new Set<string>();
  for (const hatch of project.storey.hatches) {
    if (!hatch.pattern) continue;
    const definition = patterns.get(hatch.pattern.patternId);
    if (!definition) throw new Error("Unbekanntes Schraffurmuster.");
    const cell = hatchCellSize(
      definition,
      hatch.pattern,
      workingPlanScale(project.id, project.storey.id, project.workingViews?.[0]?.denominator),
    );
    if (
      ![hatch.pattern.origin.x + cell.width, hatch.pattern.origin.y + cell.height].every(
        Number.isFinite,
      )
    )
      throw new Error("Ungültige Musterausdehnung.");
    for (const doc of project.drawingDocuments ?? []) {
      const size = hatchCellSize(definition, hatch.pattern, {
        view: { kind: "drawing-document", projectId: project.id, documentId: doc.id },
        denominator: doc.denominator,
      });
      if (
        ![hatch.pattern.origin.x + size.width, hatch.pattern.origin.y + size.height].every(
          Number.isFinite,
        )
      )
        throw new Error("Ungültige Musterausdehnung im Abbild.");
    }
    used.add(definition.id);
  }
  return { ...project, hatchPatterns: project.hatchPatterns.filter((p) => used.has(p.id)) };
}
function validateVisibility(project: SingleProject | ProjectV5 | ProjectV4 | ProjectV3): void {
  const hidden = project.bimVisibility.hiddenLayerIds;
  if (
    new Set(hidden).size !== hidden.length ||
    hidden.some((id) => !project.layers.some((l) => l.id === id))
  )
    throw new Error("Invalid hidden layer IDs");
}
function validateLayers(
  project: SingleProject | ProjectV5 | ProjectV4 | ProjectV2 | ProjectV3,
): void {
  const layerIds = new Set(project.layers.map((layer) => layer.id));
  for (const layerId of Object.values(project.defaultLayerIds)) {
    if (!layerIds.has(layerId)) throw new Error("Unknown default layer: " + layerId);
  }
  for (const element of [
    ...(project.schemaVersion === 23 ? project.storey.references : []),
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
    ...(project.schemaVersion === 4 || project.schemaVersion === 5 || project.schemaVersion === 23
      ? project.storey.hatches
      : []),
  ]) {
    if (!layerIds.has(element.layerId)) throw new Error("Unknown layer: " + element.layerId);
  }
}

function validateGeometry(
  project: LegacyProject | ProjectV5 | ProjectV4 | ProjectV2 | ProjectV3 | SingleProject,
): void {
  const ids = new Set<string>();
  for (const entity of [
    project,
    project.storey,
    ...(project.schemaVersion === 23
      ? [
          ...(project.modelViews ?? []),
          ...(project.drawingDocuments ?? []),
          ...(project.documentFolders ?? []),
        ]
      : []),
    ...(project.schemaVersion === 23 ? project.assets : []),
    ...(project.schemaVersion !== 1 ? project.layers : []),
    ...(project.schemaVersion === 23 ? project.storey.references : []),
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
    ...(project.schemaVersion === 4 || project.schemaVersion === 5 || project.schemaVersion === 23
      ? project.storey.hatches
      : []),
  ]) {
    if (ids.has(entity.id)) throw new Error(`Duplicate ID: ${entity.id}`);
    ids.add(entity.id);
  }
  for (const line of project.storey.lines ?? []) {
    validateLineGeometry(line);
    if (project.schemaVersion === 23) {
      const current = line as DrawingLine;
      if (current.style === "custom") {
        if (!current.pattern || !current.repeatLength)
          throw new Error("Custom line needs an embedded definition and repeat length.");
        validateLineStyle(current.pattern);
        if (
          current.pattern.colorEditable === false &&
          current.color.toLowerCase() !== current.pattern.color.toLowerCase()
        )
          throw new Error("Diese Linienart hat eine feste Farbe.");
        if (!Number.isFinite((current.repeatLength / current.pattern.period) * 10))
          throw new Error("Invalid pattern extent.");
      } else if (current.pattern !== undefined || current.repeatLength !== undefined)
        throw new Error("Only custom lines may carry a pattern.");
    }
  }
  if (project.schemaVersion === 5 || project.schemaVersion === 23)
    for (const wall of project.storey.walls) wallBody(wall);
  const walls = new Map(project.storey.walls.map((wall) => [wall.id, wall]));
  for (const wall of walls.values()) {
    const length = wallLength(wall);
    if (!Number.isFinite(length) || length <= 0)
      throw new Error(`Wall ${wall.id} must have a finite positive length`);
  }
  for (const opening of project.storey.windows) {
    const wall = walls.get(opening.wallId);
    if (!wall) throw new Error(`Unknown wall: ${opening.wallId}`);
    validateWindowGeometry(opening, wall);
  }
}

/** Plan views only; section views have no storey (docs/ABBILDER.md). */
function floorPlanViews(project: { modelViews?: readonly ModelView[] | undefined }) {
  return (project.modelViews ?? []).filter(
    (v): v is Extract<ModelView, { kind: "floor-plan" }> => v.kind === "floor-plan",
  );
}

/**
 * A drawing sheet outside the building (title block, layout): only drawing elements, checked
 * like a storey. Returns the hatch patterns it uses.
 */
function drawingSheetPatterns(
  project: Project,
  shared: Omit<Project, "storeys" | "groundStoreyId">,
  storey: Project["storeys"][number],
  label: string,
  dimensions: boolean,
  reuse?: WallSolidReuse,
): string[] {
  const building = [
    storey.walls,
    storey.windows,
    storey.doors,
    storey.slabs,
    storey.slabOpenings,
    storey.roofs,
    storey.rooms,
    storey.columns,
    storey.stairs,
    storey.railings,
    storey.roofWindows,
    storey.objects,
    storey.references,
    storey.wallJoins,
    storey.wallTJunctions,
    ...(dimensions ? [] : [storey.dimensions]),
    // Placed drawings belong on layouts, not in title blocks (ZW1).
    ...(dimensions ? [storey.drawings] : []),
  ];
  if (building.some((list) => list?.length))
    throw new Error(
      dimensions
        ? `${label}: nur Linien, Texte, Schraffuren und Maßketten.`
        : `${label}: nur Linien, Texte und Schraffuren.`,
    );
  const scope: SingleProject = {
    ...shared,
    schemaVersion: 23,
    groundDatum: 0,
    storey,
    workingViews: [],
    modelViews: [],
    drawingDocuments: [],
  };
  const checked = validateStoreyScope(scope, scope, reuse);
  for (const annotation of [
    ...(storey.dimensions ?? []),
    ...(storey.texts ?? []),
    ...(storey.drawings ?? []),
  ])
    if (!project.layers.some((l) => l.id === annotation.layerId))
      throw new Error("Unknown layer: " + annotation.layerId);
  for (const drawing of storey.drawings ?? [])
    if (!project.drawingDocuments?.some((d) => d.id === drawing.documentId))
      throw new Error("Zeichnung ohne Abbild.");
  return checked.hatchPatterns.map((p) => p.id);
}
