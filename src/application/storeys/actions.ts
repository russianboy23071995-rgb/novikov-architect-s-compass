import { changeStoreyHeight } from "../../domain/storeys/heights.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";

export type RenameStorey = { projectId: string; storeyId: string; name: string };
/** Shared action for navigator and future command adapters. Identity is never a label. */
export function renameStorey(base: Project, current: Project, request: RenameStorey): Project {
  if (
    base !== current ||
    current.id !== request.projectId ||
    current.storey.id !== request.storeyId
  )
    throw new Error("Der Geschosskontext wurde geändert. Vorgang erneut beginnen.");
  const name = request.name.trim();
  if (!name || name.length > 120)
    throw new Error("Geschossname: Bitte 1 bis 120 Zeichen eingeben.");
  if (name === current.storey.name) return current;
  return validateProject({ ...current, storey: { ...current.storey, name } });
}

export type SetStoreyHeight = { projectId: string; storeyId: string; height: number };
export function setStoreyHeight(
  base: Project,
  current: Project,
  request: SetStoreyHeight,
): Project {
  if (
    base !== current ||
    request.projectId !== current.id ||
    request.storeyId !== current.storey.id
  )
    throw new Error("Der Geschosskontext wurde geändert. Vorgang erneut beginnen.");
  const [storey] = changeStoreyHeight(
    [current.storey],
    current.storey.id,
    request.storeyId,
    request.height,
  );
  if (storey === current.storey) return current;
  return validateProject({ ...current, storey });
}
