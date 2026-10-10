import {
  modelViewSchema,
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
import { connectedWallSolids } from "../elements/wall/connections.ts";
import { wallBody } from "../elements/wall/body.ts";
import { z } from "zod";
import {
  hatchSchema,
  hatchV18Schema,
  hatchV15Schema,
  hatchV12Schema,
  solidHatchSchema,
  legacyHatchSchema,
  defaultHatchAppearance,
} from "../elements/hatch/model.ts";
import { layerSchema, defaultLayerIdsSchema } from "../layers/model.ts";

const id = z.string().trim().min(1);
const positive = z.number().finite().positive();
const pointSchema = z.object({ x: z.number().finite(), y: z.number().finite() }).strict();
const lineSchema = z
  .object({
    id,
    kind: z.enum(["line", "polyline"]),
    points: z.array(pointSchema).min(2).max(10000),
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
const projectSchema = projectV18Schema.extend({
  schemaVersion: z.literal(19),
  storey: projectV18Schema.shape.storey.extend({
    lines: z.array(scopedLineSchema).optional(),
    hatches: z.array(hatchSchema),
  }),
});
export function validateProjectV18(value: unknown) {
  const old = projectV18Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV17(value: unknown) {
  const old = projectV17Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV16(value: unknown) {
  const old = projectV16Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV15(value: unknown) {
  const old = projectV15Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV14(value: unknown) {
  const old = projectV14Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV13(value: unknown) {
  const old = projectV13Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV12(value: unknown) {
  const old = projectV12Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV11(value: unknown) {
  const old = projectV11Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19 });
  return old;
}
export function validateProjectV10(value: unknown) {
  const old = projectV10Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19, hatchPatterns: [] });
  return old;
}
export function validateProjectV9(value: unknown) {
  const old = projectV9Schema.parse(value);
  validateProject({ ...old, schemaVersion: 19, hatchPatterns: [] });
  return old;
}
export function validateProjectV8(value: unknown) {
  const old = projectV8Schema.parse(value);
  validateProject({
    ...old,
    schemaVersion: 19,
    hatchPatterns: [],
    assets: [],
    storey: { ...old.storey, references: [] },
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
export type Wall = z.infer<typeof offsetWallSchema>;
export type BimWindow = z.infer<typeof currentWindowSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Point = z.infer<typeof pointSchema>;
export type DrawingLine = z.infer<typeof scopedLineSchema>;

export function wallLength(wall: { start: Point; end: Point }): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

/** Validates unknown data; owned immutable asset handles may be shared. Other data is copied. */
export function validateProject(value: unknown): Project {
  const project = projectSchema.parse(value);
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
  const documents = new Set((project.drawingDocuments ?? []).map((d) => d.id));
  for (const element of [...(project.storey.lines ?? []), ...project.storey.hatches])
    if (element.documentId && !documents.has(element.documentId))
      throw new Error("Unbekanntes Abbild für 2D-Zeichnung.");
  validateGeometry(project);
  connectedWallSolids(project);
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
function validateVisibility(project: Project | ProjectV5 | ProjectV4 | ProjectV3): void {
  const hidden = project.bimVisibility.hiddenLayerIds;
  if (
    new Set(hidden).size !== hidden.length ||
    hidden.some((id) => !project.layers.some((l) => l.id === id))
  )
    throw new Error("Invalid hidden layer IDs");
}
function validateLayers(project: Project | ProjectV5 | ProjectV4 | ProjectV2 | ProjectV3): void {
  const layerIds = new Set(project.layers.map((layer) => layer.id));
  for (const layerId of Object.values(project.defaultLayerIds)) {
    if (!layerIds.has(layerId)) throw new Error("Unknown default layer: " + layerId);
  }
  for (const element of [
    ...(project.schemaVersion === 19 ? project.storey.references : []),
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
    ...(project.schemaVersion === 4 || project.schemaVersion === 5 || project.schemaVersion === 19
      ? project.storey.hatches
      : []),
  ]) {
    if (!layerIds.has(element.layerId)) throw new Error("Unknown layer: " + element.layerId);
  }
}

function validateGeometry(
  project: LegacyProject | ProjectV5 | ProjectV4 | ProjectV2 | ProjectV3 | Project,
): void {
  const ids = new Set<string>();
  for (const entity of [
    project,
    project.storey,
    ...(project.schemaVersion === 19
      ? [
          ...(project.modelViews ?? []),
          ...(project.drawingDocuments ?? []),
          ...(project.documentFolders ?? []),
        ]
      : []),
    ...(project.schemaVersion === 19 ? project.assets : []),
    ...(project.schemaVersion !== 1 ? project.layers : []),
    ...(project.schemaVersion === 19 ? project.storey.references : []),
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
    ...(project.schemaVersion === 4 || project.schemaVersion === 5 || project.schemaVersion === 19
      ? project.storey.hatches
      : []),
  ]) {
    if (ids.has(entity.id)) throw new Error(`Duplicate ID: ${entity.id}`);
    ids.add(entity.id);
  }
  for (const line of project.storey.lines ?? []) {
    validateLineGeometry(line);
    if (project.schemaVersion === 19) {
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
  if (project.schemaVersion === 5 || project.schemaVersion === 19)
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
