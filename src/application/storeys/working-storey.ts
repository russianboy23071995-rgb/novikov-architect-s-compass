import { validateProject, type Project } from "../../domain/project/schema.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
/** View setting, outside model Undo. Snapshot identity invalidates old editing sessions. */
export function selectWorkingStorey(base: Project, current: Project, storeyId: string): Project {
  if (base !== current) throw new Error("Der Geschosskontext wurde geändert.");
  const level = resolveStoreyLevels(current.storeys, current.groundStoreyId).find(
    (s) => s.storeyId === storeyId,
  );
  if (!level) throw new Error("Unbekanntes Arbeitsgeschoss.");
  if (level.elevation === null)
    throw new Error("Zunächst die Geschosshöhen bis zu diesem Geschoss festlegen.");
  if ((current.workingStoreyId ?? current.groundStoreyId) === storeyId) return current;
  return validateProject({ ...current, workingStoreyId: storeyId });
}
