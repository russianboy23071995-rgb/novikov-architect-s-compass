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
