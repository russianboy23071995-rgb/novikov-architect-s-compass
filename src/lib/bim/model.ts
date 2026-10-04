import { validateProject, wallLength } from "../../domain/project/schema.ts";
import type { Project, Wall, BimWindow, DrawingLine, Point } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";
export { validateProject, wallLength } from "../../domain/project/schema.ts";
export type { Project, Wall, BimWindow, DrawingLine, Point } from "../../domain/project/schema.ts";
export { deserializeProject } from "../../interop/project-file/load.ts";
type Creation<T extends { layerId: string }> = Omit<T, "layerId"> & { layerId?: string };

export function createProject(projectId: string, storeyId: string): Project {
  return validateProject({
    schemaVersion: 2,
    ...createStandardLayers([projectId.trim(), storeyId.trim()]),
    unit: "m",
    id: projectId,
    storey: { id: storeyId, walls: [], windows: [] },
  });
}

/** Commands return new validated snapshots; the input is never mutated, even on failure. */
export function addWall(project: Project, wall: Creation<Wall>): Project {
  return validateProject({
    ...project,
    storey: {
      ...project.storey,
      walls: [...project.storey.walls, { layerId: project.defaultLayerIds.wall, ...wall }],
    },
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

export function addWindow(project: Project, opening: Creation<BimWindow>): Project {
  return validateProject({
    ...project,
    storey: {
      ...project.storey,
      windows: [...project.storey.windows, { layerId: project.defaultLayerIds.window, ...opening }],
    },
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

export function addLine(project: Project, line: Creation<DrawingLine>): Project {
  return validateProject({
    ...project,
    storey: {
      ...project.storey,
      lines: [...(project.storey.lines ?? []), { layerId: project.defaultLayerIds.line, ...line }],
    },
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
