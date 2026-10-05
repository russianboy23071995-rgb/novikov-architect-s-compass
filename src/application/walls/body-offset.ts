import { updateWall } from "../../lib/bim/model.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { ElementTarget } from "../selection/target.ts";
import { commitProject, type ProjectHistory } from "../../lib/bim/history.ts";

export type WallOffsetRequest = { projectId: string; wallId: string; offset: number };
export function previewWallOffset(
  base: Project,
  current: Project,
  selection: ElementTarget | null,
  request: WallOffsetRequest,
): Project {
  if (
    base !== current ||
    request.projectId !== current.id ||
    selection?.kind !== "wall" ||
    selection.id !== request.wallId
  )
    throw new Error("Projekt oder Auswahl geändert. Wandversatz erneut beginnen.");
  if (!Number.isFinite(request.offset))
    throw new Error("Der Wandversatz muss eine endliche Meterzahl sein.");
  const wall = current.storey.walls.find((w) => w.id === request.wallId);
  if (!wall) throw new Error("Wand nicht gefunden.");
  return wall.bodyOffset === request.offset
    ? current
    : updateWall(current, wall.id, { bodyOffset: request.offset });
}
export function commitWallOffset(
  history: ProjectHistory,
  base: Project,
  selection: ElementTarget | null,
  request: WallOffsetRequest,
) {
  return commitProject(history, previewWallOffset(base, history.present, selection, request));
}
