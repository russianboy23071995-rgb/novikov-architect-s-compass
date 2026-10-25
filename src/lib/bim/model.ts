import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { projectStorageData } from "../../domain/project/storage-data.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { assertValidatedProjectSize } from "../../interop/project-file/size.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { validateProject, wallLength } from "../../domain/project/schema.ts";
import type { Project, BimWindow, DrawingLine, Point } from "../../domain/project/schema.ts";
import { createStandardLayers } from "../../domain/layers/model.ts";
export { validateProject, wallLength } from "../../domain/project/schema.ts";
export type { Project, Wall, BimWindow, DrawingLine, Point } from "../../domain/project/schema.ts";
export { deserializeProject } from "../../interop/project-file/load.ts";
type Creation<T extends { layerId: string }> = Omit<T, "layerId"> & { layerId?: string };

export function createProject(projectId: string, storeyId: string): Project {
  return validateProject({
    schemaVersion: PROJECT_SCHEMA_VERSION,
    groundStoreyId: storeyId,
    groundDatum: 0,
    hatchPatterns: [],
    assets: [],
    bimVisibility: { hiddenLayerIds: [] },
    ...createStandardLayers([projectId.trim(), storeyId.trim()]),
    unit: "m",
    id: projectId,
    storeys: [
      {
        id: storeyId,
        name: "Level 01",
        height: null,
        references: [],
        walls: [],
        windows: [],
        hatches: [],
        wallJoins: [],
        wallTJunctions: [],
      },
    ],
  });
}

export function addWindow(project: Project, opening: Creation<BimWindow>): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      windows: [
        ...storeyOf(project).windows,
        { layerId: project.defaultLayerIds.window, ...opening },
      ],
    }),
  });
}

export function updateWindow(
  project: Project,
  windowId: string,
  changes: Partial<Omit<BimWindow, "id">>,
): Project {
  if (!storeyOf(project).windows.some((opening) => opening.id === windowId))
    throw new Error(`Unknown window: ${windowId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      windows: storeyOf(project).windows.map((opening) =>
        opening.id === windowId ? { ...opening, ...changes, id: opening.id } : opening,
      ),
    }),
  });
}

export function windowCentre(project: Project, windowId: string): Point {
  const validated = validateProject(project);
  const opening = storeyOf(validated).windows.find((item) => item.id === windowId);
  if (!opening) throw new Error(`Unknown window: ${windowId}`);
  const wall = storeyOf(validated).walls.find((item) => item.id === opening.wallId)!;
  const body = wallBody(wall);
  return {
    x: body.start.x + (wall.end.x - wall.start.x) * opening.position,
    y: body.start.y + (wall.end.y - wall.start.y) * opening.position,
  };
}

export function serializeProject(project: Project): string {
  const checked = validateProject(project);
  assertValidatedProjectSize(checked);
  return JSON.stringify(projectStorageData(checked));
}

export function addLine(project: Project, line: Creation<DrawingLine>): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      lines: [
        ...(storeyOf(project).lines ?? []),
        { layerId: project.defaultLayerIds.line, ...line },
      ],
    }),
  });
}

export function updateLine(
  project: Project,
  lineId: string,
  changes: Partial<Omit<DrawingLine, "id">>,
): Project {
  if (!storeyOf(project).lines?.some((line) => line.id === lineId))
    throw new Error(`Unknown line: ${lineId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      lines: storeyOf(project).lines!.map((line) =>
        line.id === lineId ? { ...line, ...changes, id: line.id } : line,
      ),
    }),
  });
}
