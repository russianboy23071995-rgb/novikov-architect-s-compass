import { z } from "zod";
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
const currentLineSchema = lineSchema.extend({ layerId: id });
const projectV2Schema = legacyProjectSchema.extend({
  schemaVersion: z.literal(2),
  layers: z.array(layerSchema).min(1),
  defaultLayerIds: defaultLayerIdsSchema,
  storey: legacyProjectSchema.shape.storey.extend({
    walls: z.array(currentWallSchema),
    windows: z.array(currentWindowSchema),
    lines: z.array(currentLineSchema).optional(),
  }),
});
const projectSchema = projectV2Schema.extend({
  schemaVersion: z.literal(3),
  bimVisibility: z.object({ hiddenLayerIds: z.array(id) }).strict(),
});
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
export type Wall = z.infer<typeof currentWallSchema>;
export type BimWindow = z.infer<typeof currentWindowSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Point = z.infer<typeof pointSchema>;
export type DrawingLine = z.infer<typeof currentLineSchema>;

export function wallLength(wall: { start: Point; end: Point }): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

/** Validates unknown data and returns an independent copy. Throws on invalid data. */
export function validateProject(value: unknown): Project {
  const project = projectSchema.parse(value);
  validateGeometry(project);
  validateLayers(project);
  const hidden = project.bimVisibility.hiddenLayerIds;
  if (
    new Set(hidden).size !== hidden.length ||
    hidden.some((id) => !project.layers.some((l) => l.id === id))
  )
    throw new Error("Invalid hidden layer IDs");
  return project;
}
function validateLayers(project: Project | ProjectV2): void {
  const layerIds = new Set(project.layers.map((layer) => layer.id));
  for (const layerId of Object.values(project.defaultLayerIds)) {
    if (!layerIds.has(layerId)) throw new Error("Unknown default layer: " + layerId);
  }
  for (const element of [
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
  ]) {
    if (!layerIds.has(element.layerId)) throw new Error("Unknown layer: " + element.layerId);
  }
}

function validateGeometry(project: LegacyProject | ProjectV2 | Project): void {
  const ids = new Set<string>();
  for (const entity of [
    project,
    project.storey,
    ...(project.schemaVersion !== 1 ? project.layers : []),
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
  ]) {
    if (ids.has(entity.id)) throw new Error(`Duplicate ID: ${entity.id}`);
    ids.add(entity.id);
  }
  for (const line of project.storey.lines ?? []) {
    if (line.kind === "line" && line.points.length !== 2)
      throw new Error("A line needs exactly two points");
    let total = 0;
    for (let i = 1; i < line.points.length; i++) {
      const a = line.points[i - 1]!,
        b = line.points[i]!;
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      if (!Number.isFinite(length) || length <= 0)
        throw new Error("Line segments must have finite positive length");
      total += length;
    }
    if (!Number.isFinite(total)) throw new Error("Line length must be finite");
  }
  const walls = new Map(project.storey.walls.map((wall) => [wall.id, wall]));
  for (const wall of walls.values()) {
    const length = wallLength(wall);
    if (!Number.isFinite(length) || length <= 0)
      throw new Error(`Wall ${wall.id} must have a finite positive length`);
  }
  for (const opening of project.storey.windows) {
    const wall = walls.get(opening.wallId);
    if (!wall) throw new Error(`Unknown wall: ${opening.wallId}`);
    const length = wallLength(wall);
    const centre = opening.position * length;
    if (
      opening.width > length ||
      centre < opening.width / 2 ||
      length - centre < opening.width / 2
    ) {
      throw new Error(`Window ${opening.id} must fit within its wall length`);
    }
    if (opening.sillHeight + opening.height > wall.height) {
      throw new Error(`Window ${opening.id} must fit within its wall height`);
    }
  }
}
