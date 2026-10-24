import { PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
  validateLike,
  type ProjectResultMode,
} from "../../domain/project/owned-snapshot.ts";
import { projectStorageData } from "../../domain/project/storage-data.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { assertValidatedProjectSize } from "../../interop/project-file/size.ts";
import { reconcileTJunctions } from "../../domain/elements/wall/t-relations.ts";
import { reconcileWallJoins } from "../../domain/elements/wall/connections.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";
import { assertAxisInside, offsetAtThickness } from "../../domain/elements/wall/axis-position.ts";
import { validateProject, wallLength } from "../../domain/project/schema.ts";
import type { WallSolidReuse } from "../../domain/elements/wall/connections.ts";
import type { Project, Wall, BimWindow, DrawingLine, Point } from "../../domain/project/schema.ts";
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

/** Commands return new validated snapshots; the input is never mutated, even on failure. */
export function addWall(
  project: Project,
  wall: Creation<Omit<Wall, "bodyOffset">> & { bodyOffset?: number },
): Project {
  assertAxisInside(wall.thickness, wall.bodyOffset ?? 0);
  return validateLike(
    project,
    reconcileWallJoins(
      {
        ...replaceStorey(project, {
          ...storeyOf(project),
          walls: [
            ...storeyOf(project).walls,
            { layerId: project.defaultLayerIds.wall, bodyOffset: 0, ...wall },
          ],
        }),
      },
      wall.id,
    ),
  );
}

export function updateWall(
  project: Project,
  wallId: string,
  changes: Partial<Omit<Wall, "id" | "topBinding">>,
  intent: "reshape" | "move" = "reshape",
  reuse?: WallSolidReuse,
  resultMode: ProjectResultMode = "mutable",
): Project {
  const previous = storeyOf(project).walls.find((wall) => wall.id === wallId);
  if (!previous) throw new Error(`Unknown wall: ${wallId}`);
  if ("topBinding" in changes)
    throw new Error("Höhenbindung über die gemeinsame Höhenaktion ändern.");
  if (previous.topBinding && changes.height !== undefined && changes.height !== previous.height)
    throw new Error("Gebundene Wandhöhe über die gemeinsame Höhenaktion ändern.");
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
    ...replaceStorey(project, {
      ...storeyOf(project),
      walls: storeyOf(project).walls.map((wall) =>
        wall.id === wallId ? { ...wall, ...changes, bodyOffset, id: wall.id } : wall,
      ),
    }),
  };
  const axisChanged = ["start", "end"].some((k) => {
    const name = k as "start" | "end";
    const p = changes[name];
    return p && (p.x !== previous[name].x || p.y !== previous[name].y);
  });
  // A detached T must not silently turn into an automatic corner in the same edit.
  const tPartners = storeyOf(project).wallTJunctions.flatMap((r) =>
    r.hostWallId === wallId
      ? [r.incoming.wallId]
      : r.incoming.wallId === wallId
        ? [r.hostWallId]
        : [],
  );
  const reconciled = axisChanged ? reconcileTJunctions(proposed, wallId, intent) : proposed;
  // Output ownership never skips validation; the factory validates and owns in one step.
  const result = axisChanged
    ? reconcileWallJoins(reconciled, wallId, previous, tPartners)
    : reconciled;
  return resultMode === "owned"
    ? createProjectSnapshot(result, reuse, isOwnedProjectSnapshot(project) ? project : undefined)
    : validateLike(project, result, reuse);
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
