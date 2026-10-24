import { PROJECT_MIN_READ_VERSION, PROJECT_SCHEMA_VERSION } from "../../domain/project/format.ts";
import { assertRasterBudgetChange } from "../../domain/project/raster-budget.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { sameProjectModel, sameProjectContent } from "../../domain/project/model-equality.ts";
import {
  ProjectFileSizeError,
  assertValidatedProjectSize,
} from "../../interop/project-file/size.ts";
import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
} from "../../domain/project/owned-snapshot.ts";
import { deserializeProject, validateProject } from "./model.ts";
import type { Project } from "./model.ts";
export type ProjectHistory = { past: Project[]; present: Project; future: Project[] };
export const HISTORY_LIMIT = 100;
export { PROJECT_FILE_LIMIT } from "../../interop/project-file/size.ts";
// Size is fixed for an owned immutable snapshot, so its budget check is needed only once.
const sizeChecked = new WeakSet<Project>();
function assertSnapshotSize(project: Project): void {
  if (sizeChecked.has(project)) return;
  assertValidatedProjectSize(project);
  if (isOwnedProjectSnapshot(project)) sizeChecked.add(project);
}
export function createHistory(project: Project): ProjectHistory {
  return { past: [], present: createProjectSnapshot(project), future: [] };
}
export function commitProject(
  history: ProjectHistory,
  project: Project,
  options: { legacyFileOpen?: boolean } = {},
): ProjectHistory {
  // Only factory-owned snapshots skip re-validation; anything else keeps the full check.
  const owned = isOwnedProjectSnapshot(history.present) ? history.present : undefined;
  const next = createProjectSnapshot(project, undefined, owned);
  assertSnapshotSize(next);
  const previous = owned ?? validateProject(history.present);
  assertSnapshotSize(previous);
  if (!options.legacyFileOpen) assertRasterBudgetChange(previous, next);
  if (sameProjectContent(next, previous)) return history;
  if (sameProjectModel(history.present, next)) return { ...history, present: next };
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}
export function undoProject(history: ProjectHistory): ProjectHistory {
  const previous = history.past.at(-1);
  return previous
    ? {
        past: history.past.slice(0, -1),
        present: retainViewSettings(previous, history.present),
        future: [history.present, ...history.future],
      }
    : history;
}
export function redoProject(history: ProjectHistory): ProjectHistory {
  const next = history.future[0];
  return next
    ? {
        past: [...history.past, history.present].slice(-HISTORY_LIMIT),
        present: retainViewSettings(next, history.present),
        future: history.future.slice(1),
      }
    : history;
}
export function readProjectFile(text: string): Project {
  try {
    return deserializeProject(text);
  } catch (error) {
    if (error instanceof ProjectFileSizeError) throw error;
    throw new Error(
      `Ungültige Projektdatei: erwartet wird ein NOVIKOV-JSON-Projekt (Version ${PROJECT_MIN_READ_VERSION} bis ${PROJECT_SCHEMA_VERSION}, Meter) mit gültigen Bauteilen.`,
    );
  }
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
  return {
    ...model,
    ...(workingStoreyId ? { workingStoreyId } : {}),
    ...(drawingDocuments ? { drawingDocuments } : {}),
    ...(workingViews ? { workingViews } : {}),
    bimVisibility: { hiddenLayerIds },
  };
}
