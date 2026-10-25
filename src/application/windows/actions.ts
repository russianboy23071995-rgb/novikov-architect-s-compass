import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import {
  validateProject,
  type BimWindow,
  type Point,
  type Project,
} from "../../domain/project/schema.ts";
import { wallBody } from "../../domain/elements/wall/body.ts";

type Creation<T extends { layerId: string }> = Omit<T, "layerId"> & { layerId?: string };

/** Shared window edit for commands and future adapters: same rule as the former lib/bim
 * action (whole-project validation, own snapshot), without a dependency on lib/bim.
 */
export function updateWindow(
  project: Project,
  windowId: string,
  changes: Partial<Omit<BimWindow, "id">>,
): Project {
  const storey = storeyOf(project);
  if (!storey.windows.some((opening) => opening.id === windowId))
    throw new Error(`Unknown window: ${windowId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storey,
      windows: storey.windows.map((opening) =>
        opening.id === windowId ? { ...opening, ...changes, id: opening.id } : opening,
      ),
    }),
  });
}

/** Moved unchanged from lib/bim/model.ts (25.10.2026). */
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
