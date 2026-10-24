import { snapshotWithWorkingStorey } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
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
  return snapshotWithWorkingStorey(current, storeyId);
}

/** Resolve a picked BIM target by stable ID before invoking the existing storey-bound actions. */
export function workingStoreyForTarget(
  project: Project,
  target: { kind: string; id: string },
): string | null {
  return (
    project.storeys.find((s) =>
      target.kind === "wall"
        ? s.walls.some((w) => w.id === target.id)
        : target.kind === "window"
          ? s.windows.some((w) => w.id === target.id)
          : target.kind === "door"
            ? (s.doors ?? []).some((d) => d.id === target.id)
            : false,
    )?.id ?? null
  );
}
