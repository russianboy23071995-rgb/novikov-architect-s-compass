import { z } from "zod";

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
const projectSchema = z
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

/** All lengths and coordinates are in metres; position is dimensionless. */
export type Wall = z.infer<typeof wallSchema>;
export type BimWindow = z.infer<typeof windowSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Point = z.infer<typeof pointSchema>;
export type DrawingLine = z.infer<typeof lineSchema>;

export function wallLength(wall: Wall): number {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
}

/** Validates unknown data and returns an independent copy. Throws on invalid data. */
export function validateProject(value: unknown): Project {
  const project = projectSchema.parse(value);
  const ids = new Set<string>();
  for (const entity of [
    project,
    project.storey,
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
  return project;
}

export function createProject(projectId: string, storeyId: string): Project {
  return validateProject({
    schemaVersion: 1,
    unit: "m",
    id: projectId,
    storey: { id: storeyId, walls: [], windows: [] },
  });
}

/** Commands return new validated snapshots; the input is never mutated, even on failure. */
export function addWall(project: Project, wall: Wall): Project {
  return validateProject({
    ...project,
    storey: { ...project.storey, walls: [...project.storey.walls, wall] },
  });
}

export function updateWall(
  project: Project,
  wallId: string,
  changes: Partial<Omit<Wall, "id">>,
): Project {
  if (!project.storey.walls.some((wall) => wall.id === wallId))
    throw new Error(`Unknown wall: ${wallId}`);
  return validateProject({
    ...project,
    storey: {
      ...project.storey,
      walls: project.storey.walls.map((wall) =>
        wall.id === wallId ? { ...wall, ...changes, id: wall.id } : wall,
      ),
    },
  });
}

export function addWindow(project: Project, opening: BimWindow): Project {
  return validateProject({
    ...project,
    storey: { ...project.storey, windows: [...project.storey.windows, opening] },
  });
}

export function updateWindow(
  project: Project,
  windowId: string,
  changes: Partial<Omit<BimWindow, "id">>,
): Project {
  if (!project.storey.windows.some((opening) => opening.id === windowId))
    throw new Error(`Unknown window: ${windowId}`);
  return validateProject({
    ...project,
    storey: {
      ...project.storey,
      windows: project.storey.windows.map((opening) =>
        opening.id === windowId ? { ...opening, ...changes, id: opening.id } : opening,
      ),
    },
  });
}

export function windowCentre(project: Project, windowId: string): Point {
  const validated = validateProject(project);
  const opening = validated.storey.windows.find((item) => item.id === windowId);
  if (!opening) throw new Error(`Unknown window: ${windowId}`);
  const wall = validated.storey.walls.find((item) => item.id === opening.wallId)!;
  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * opening.position,
    y: wall.start.y + (wall.end.y - wall.start.y) * opening.position,
  };
}

export function serializeProject(project: Project): string {
  return JSON.stringify(validateProject(project));
}

export function deserializeProject(json: string): Project {
  return validateProject(JSON.parse(json));
}

export function addLine(project: Project, line: DrawingLine): Project {
  return validateProject({
    ...project,
    storey: { ...project.storey, lines: [...(project.storey.lines ?? []), line] },
  });
}

export function updateLine(
  project: Project,
  lineId: string,
  changes: Partial<Omit<DrawingLine, "id">>,
): Project {
  if (!project.storey.lines?.some((line) => line.id === lineId))
    throw new Error(`Unknown line: ${lineId}`);
  return validateProject({
    ...project,
    storey: {
      ...project.storey,
      lines: project.storey.lines.map((line) =>
        line.id === lineId ? { ...line, ...changes, id: line.id } : line,
      ),
    },
  });
}
