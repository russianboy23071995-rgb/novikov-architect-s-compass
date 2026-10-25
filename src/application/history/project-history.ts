/** Undo/Redo history of owned project snapshots, moved from lib/bim/history.ts (25.10.2026). */
import { assertRasterBudgetChange } from "../../domain/project/raster-budget.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { sameProjectModel, sameProjectContent } from "../../domain/project/model-equality.ts";
import { assertValidatedProjectSize } from "../../interop/project-file/size.ts";
import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
} from "../../domain/project/owned-snapshot.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import { releaseDerivedData } from "../../domain/project/derived-cache.ts";
import { storeyStorageData } from "../../domain/project/storage-data.ts";
/** `trimmed`: older steps were dropped to stay within the byte budget. */
export type ProjectHistory = {
  past: Project[];
  present: Project;
  future: Project[];
  trimmed?: boolean;
};
export const HISTORY_LIMIT = 100;
/** Model data (storeys and images, each counted once) the undo history may hold. */
export const HISTORY_BYTE_BUDGET = 256 * 1024 * 1024;
// Size is fixed for an owned immutable snapshot, so its budget check is needed only once.
const sizeChecked = new WeakSet<Project>();
// Byte lengths of deeply frozen storeys of owned snapshots; unchanged storeys are not re-encoded.
const storeyBytes = new WeakMap<object, number>();
function assertSnapshotSize(project: Project): void {
  if (sizeChecked.has(project)) return;
  const owned = isOwnedProjectSnapshot(project);
  assertValidatedProjectSize(project, owned ? storeyBytes : undefined);
  if (owned) sizeChecked.add(project);
}
// Owned model snapshot behind an Undo/Redo result that only received current view settings.
// Used solely as a sharing base; the result itself is never trusted without validation.
const viewSource = new WeakMap<Project, Project>();
export function createHistory(project: Project): ProjectHistory {
  return { past: [], present: createProjectSnapshot(project), future: [] };
}
export function commitProject(
  history: ProjectHistory,
  project: Project,
  // byteBudget: tests and diagnostics only; the workspace always uses HISTORY_BYTE_BUDGET.
  options: { legacyFileOpen?: boolean; byteBudget?: number } = {},
): ProjectHistory {
  // Only factory-owned snapshots skip re-validation; anything else keeps the full check.
  const owned = isOwnedProjectSnapshot(history.present) ? history.present : undefined;
  // A view-settings transition is not owned, but its model source may still be shared.
  const next = createProjectSnapshot(project, undefined, owned ?? viewSource.get(history.present));
  assertSnapshotSize(next);
  const previous = owned ?? validateProject(history.present);
  assertSnapshotSize(previous);
  if (!options.legacyFileOpen) assertRasterBudgetChange(previous, next);
  if (sameProjectContent(next, previous)) return history;
  if (sameProjectModel(history.present, next)) return { ...history, present: next };
  return withinBudget(
    {
      past: [...history.past, history.present].slice(-HISTORY_LIMIT),
      present: next,
      future: [],
      ...(history.trimmed ? { trimmed: true } : {}),
    },
    options.byteBudget ?? HISTORY_BYTE_BUDGET,
  );
}
export function undoProject(history: ProjectHistory): ProjectHistory {
  const previous = history.past.at(-1);
  return previous
    ? settled({
        ...history,
        past: history.past.slice(0, -1),
        present: retainViewSettings(previous, history.present),
        future: [history.present, ...history.future],
      })
    : history;
}
export function redoProject(history: ProjectHistory): ProjectHistory {
  const next = history.future[0];
  return next
    ? settled({
        ...history,
        past: [...history.past, history.present].slice(-HISTORY_LIMIT),
        present: retainViewSettings(next, history.present),
        future: history.future.slice(1),
      })
    : history;
}

/** Only the present keeps derived data (indexes, geometry); kept steps hold the model alone and
 * rebuild their derived data when they become present again (docs/performance/HISTORY_MEMORY.md).
 * Releasing every kept step also catches entries a late request recreated for a former present.
 */
function settled(history: ProjectHistory): ProjectHistory {
  for (const step of [...history.past, ...history.future])
    if (step !== history.present) releaseDerivedData(step);
  return history;
}

/** Model data the history holds: each storey and image once, however many steps share it. */
export function historyModelBytes(history: ProjectHistory): number {
  const storeys = new Set<object>(),
    assets = new Set<object>();
  let bytes = 0;
  for (const step of [history.present, ...history.past, ...history.future]) {
    for (const storey of step.storeys) {
      if (storeys.has(storey)) continue;
      storeys.add(storey);
      let size = storeyBytes.get(storey);
      if (size === undefined) {
        size = new TextEncoder().encode(JSON.stringify(storeyStorageData(storey))).byteLength;
        if (Object.isFrozen(storey)) storeyBytes.set(storey, size);
      }
      bytes += size;
    }
    for (const asset of step.assets)
      if (!assets.has(asset)) {
        assets.add(asset);
        bytes += asset.data.length;
      }
  }
  return bytes;
}

/** Beyond the byte budget the oldest steps go first; the present and redo steps always stay. */
function withinBudget(history: ProjectHistory, budget: number): ProjectHistory {
  let past = history.past;
  while (past.length && historyModelBytes({ ...history, past }) > budget) past = past.slice(1);
  return settled(past === history.past ? history : { ...history, past, trimmed: true });
}

/** Model undo never rewinds the independent palette settings. Deleted IDs cannot survive. */
function retainViewSettings(snapshot: Project, current: Project): Project {
  const requested = snapshot.id === current.id ? current.workingStoreyId : snapshot.workingStoreyId;
  const workingStoreyId =
    requested && snapshot.storeys.some((s) => s.id === requested) ? requested : undefined;
  const ids = new Set(snapshot.layers.map((l) => l.id));
  const hiddenLayerIds = current.bimVisibility.hiddenLayerIds.filter((id) => ids.has(id));
  const workingViews =
    snapshot.id === current.id
      ? current.workingViews?.filter((view) => snapshot.storeys.some((s) => s.id === view.storeyId))
      : snapshot.workingViews;
  const drawingDocuments = snapshot.drawingDocuments?.map((doc) => {
    const latest =
      snapshot.id === current.id
        ? current.drawingDocuments?.find((d) => d.id === doc.id)
        : undefined;
    return { ...doc, hiddenLayerIds: (latest ?? doc).hiddenLayerIds.filter((id) => ids.has(id)) };
  });
  if (
    workingStoreyId === snapshot.workingStoreyId &&
    JSON.stringify(drawingDocuments) === JSON.stringify(snapshot.drawingDocuments) &&
    JSON.stringify(workingViews) === JSON.stringify(snapshot.workingViews) &&
    JSON.stringify(hiddenLayerIds) === JSON.stringify(snapshot.bimVisibility.hiddenLayerIds)
  )
    return snapshot;
  const { workingViews: _previousViews, workingStoreyId: _previousStorey, ...model } = snapshot;
  const result = {
    ...model,
    ...(workingStoreyId ? { workingStoreyId } : {}),
    ...(drawingDocuments ? { drawingDocuments } : {}),
    ...(workingViews ? { workingViews } : {}),
    bimVisibility: { hiddenLayerIds },
  };
  if (isOwnedProjectSnapshot(snapshot)) viewSource.set(result, snapshot);
  return result;
}
