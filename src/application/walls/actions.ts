import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
  validateLike,
  type ProjectResultMode,
} from "../../domain/project/owned-snapshot.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { reconcileTJunctions } from "../../domain/elements/wall/t-relations.ts";
import { reconcileWallJoins } from "../../domain/elements/wall/connections.ts";
import { assertAxisInside, offsetAtThickness } from "../../domain/elements/wall/axis-position.ts";
import type { WallSolidReuse } from "../../domain/elements/wall/connections.ts";
import type { Project, Wall } from "../../domain/project/schema.ts";

/** Wall creation and editing, moved unchanged from lib/bim/model.ts (25.10.2026). */
type Creation<T extends { layerId: string }> = Omit<T, "layerId"> & { layerId?: string };

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
