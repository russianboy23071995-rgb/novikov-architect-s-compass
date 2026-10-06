import { reconcileWallJoins } from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { assertAxisInside, offsetAtThickness } from "../../domain/elements/wall/axis-position.ts";
import { validateProject, wallLength } from "../../domain/project/schema.ts";
import type { Project, Wall, BimWindow, DrawingLine, Point } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";
export { validateProject, wallLength } from "../../domain/project/schema.ts";
export type { Project, Wall, BimWindow, DrawingLine, Point } from "../../domain/project/schema.ts";
export { deserializeProject } from "../../interop/project-file/load.ts";
type Creation<T extends { layerId: string }> = Omit<T, "layerId"> & { layerId?: string };

export function createProject(projectId: string, storeyId: string): Project {
  return validateProject({
    schemaVersion: 7,
    bimVisibility: { hiddenLayerIds: [] },
    ...createStandardLayers([projectId.trim(), storeyId.trim()]),
    unit: "m",
    id: projectId,
    storey: { id: storeyId, walls: [], windows: [], hatches: [], wallJoins: [] },
  });
}

/** Commands return new validated snapshots; the input is never mutated, even on failure. */
export function addWall(
  project: Project,
  wall: Creation<Omit<Wall, "bodyOffset">> & { bodyOffset?: number },
): Project {
  assertAxisInside(wall.thickness, wall.bodyOffset ?? 0);
  return validateProject(
    reconcileWallJoins(
      {
        ...project,
        storey: {
          ...project.storey,
          walls: [
            ...project.storey.walls,
            { layerId: project.defaultLayerIds.wall, bodyOffset: 0, ...wall },
          ],
        },
      },
      wall.id,
    ),
  );
}

export function updateWall(
  project: Project,
  wallId: string,
  changes: Partial<Omit<Wall, "id">>,
): Project {
  const previous = project.storey.walls.find((wall) => wall.id === wallId);
  if (!previous) throw new Error(`Unknown wall: ${wallId}`);
  const bodyOffset =
    changes.bodyOffset ??
    (changes.thickness !== undefined && changes.thickness !== previous.thickness
      ? offsetAtThickness(previous, changes.thickness)
      : previous.bodyOffset);
  // Historical V5 files may contain outside axes: loading/moving preserves them.
  // Every new axis placement or thickness change must satisfy the new rule.
  if (changes.bodyOffset !== undefined || changes.thickness !== undefined)
    assertAxisInside(changes.thickness ?? previous.thickness, bodyOffset);
  const proposed: Project = {
    ...project,
    storey: {
      ...project.storey,
      walls: project.storey.walls.map((wall) =>
        wall.id === wallId ? { ...wall, ...changes, bodyOffset, id: wall.id } : wall,
      ),
    },
  };
  const axisChanged = ["start", "end"].some((k) => {
    const name = k as "start" | "end";
    const p = changes[name];
    return p && (p.x !== previous[name].x || p.y !== previous[name].y);
  });
  return validateProject(axisChanged ? reconcileWallJoins(proposed, wallId, previous) : proposed);
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
  const body = wallBody(wall);
  return {
    x: body.start.x + (wall.end.x - wall.start.x) * opening.position,
    y: body.start.y + (wall.end.y - wall.start.y) * opening.position,
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
