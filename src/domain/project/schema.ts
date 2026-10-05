import { connectedWallSolids } from "../elements/wall/connections.ts";
import { wallBody } from "../elements/wall/body.ts";
import { z } from "zod";
import { hatchSchema } from "../elements/hatch/model.ts";
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
const projectV3Schema = projectV2Schema.extend({
  schemaVersion: z.literal(3),
  bimVisibility: z.object({ hiddenLayerIds: z.array(id) }).strict(),
});
const projectV4Schema = projectV3Schema.extend({
  schemaVersion: z.literal(4),
  storey: projectV3Schema.shape.storey.extend({ hatches: z.array(hatchSchema) }),
});
const offsetWallSchema = currentWallSchema.extend({ bodyOffset: z.number().finite() });
const projectV5Schema = projectV4Schema.extend({
  schemaVersion: z.literal(5),
  storey: projectV4Schema.shape.storey.extend({ walls: z.array(offsetWallSchema) }),
});
const wallEndSchema = z
  .object({ wallId: id, endpoint: z.union([z.literal(0), z.literal(1)]) })
  .strict();
const projectSchema = projectV5Schema.extend({
  schemaVersion: z.literal(6),
  storey: projectV5Schema.shape.storey.extend({
    wallJoins: z.array(z.object({ first: wallEndSchema, second: wallEndSchema }).strict()),
  }),
});
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
export type DrawingLine = z.infer<typeof currentLineSchema>;

export function wallLength(wall: { start: Point; end: Point }): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

/** Validates unknown data and returns an independent copy. Throws on invalid data. */
export function validateProject(value: unknown): Project {
  const project = projectSchema.parse(value);
  validateGeometry(project);
  connectedWallSolids(project);
  validateLayers(project);
  validateVisibility(project);
  return project;
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
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
    ...(project.schemaVersion === 4 || project.schemaVersion === 5 || project.schemaVersion === 6
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
    ...(project.schemaVersion !== 1 ? project.layers : []),
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
    ...(project.schemaVersion === 4 || project.schemaVersion === 5 || project.schemaVersion === 6
      ? project.storey.hatches
      : []),
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
  if (project.schemaVersion === 5 || project.schemaVersion === 6)
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
