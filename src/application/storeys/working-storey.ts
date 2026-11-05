import { snapshotWithWorkingStorey } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { resolveStoreyLevels } from "../../domain/storeys/heights.ts";
import { ELEMENT_KINDS, storeyElements, type ElementKind } from "../../domain/elements/registry.ts";
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
  return snapshotWithWorkingStorey(current, storeyId);
}

/** Resolve a picked BIM target by stable ID before invoking the existing storey-bound actions. */
export function workingStoreyForTarget(
  project: Project,
  target: { kind: string; id: string },
): string | null {
  // Every registered element kind (rooms and future kinds included), not a fixed list.
  if (!(target.kind in ELEMENT_KINDS)) return null;
  const kind = target.kind as ElementKind;
  return (
    project.storeys.find((s) => [...storeyElements(s, kind)].some((e) => e.id === target.id))?.id ??
    null
  );
}
