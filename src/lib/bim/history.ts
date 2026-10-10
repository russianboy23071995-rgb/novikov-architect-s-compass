import { sameProjectModel } from "../../domain/project/model-equality.ts";
import { assertProjectFileSize } from "../../interop/project-file/size.ts";
import { deserializeProject, serializeProject, validateProject } from "./model.ts";
import type { Project } from "./model.ts";
export type ProjectHistory = { past: Project[]; present: Project; future: Project[] };
export const HISTORY_LIMIT = 100;
export { PROJECT_FILE_LIMIT } from "../../interop/project-file/size.ts";
export function createHistory(project: Project): ProjectHistory {
  return { past: [], present: validateProject(project), future: [] };
}
export function commitProject(history: ProjectHistory, project: Project): ProjectHistory {
  const next = validateProject(project);
  // next is the independent, normalized result of the full validation above.
  // Serialize it directly instead of validating/deriving the same snapshot twice.
  const nextJson = JSON.stringify(next);
  assertProjectFileSize(nextJson);
  if (nextJson === serializeProject(history.present)) return history;
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
  assertProjectFileSize(text);
  try {
    return deserializeProject(text);
  } catch {
    throw new Error(
      "Ungültige Projektdatei: erwartet wird ein NOVIKOV-JSON-Projekt (Version 1 bis 19, Meter) mit gültigen Bauteilen.",
    );
  }
}

/** Model undo never rewinds the independent palette settings. Deleted IDs cannot survive. */
function retainViewSettings(snapshot: Project, current: Project): Project {
  const ids = new Set(snapshot.layers.map((l) => l.id));
  const hiddenLayerIds = current.bimVisibility.hiddenLayerIds.filter((id) => ids.has(id));
  const workingViews =
    snapshot.id === current.id
      ? current.workingViews?.filter((view) => view.storeyId === snapshot.storey.id)
      : snapshot.workingViews;
  const drawingDocuments = snapshot.drawingDocuments?.map((doc) => {
    const latest =
      snapshot.id === current.id
        ? current.drawingDocuments?.find((d) => d.id === doc.id)
        : undefined;
    return { ...doc, hiddenLayerIds: (latest ?? doc).hiddenLayerIds.filter((id) => ids.has(id)) };
  });
  if (
    JSON.stringify(drawingDocuments) === JSON.stringify(snapshot.drawingDocuments) &&
    JSON.stringify(workingViews) === JSON.stringify(snapshot.workingViews) &&
    JSON.stringify(hiddenLayerIds) === JSON.stringify(snapshot.bimVisibility.hiddenLayerIds)
  )
    return snapshot;
  const { workingViews: _previousViews, ...model } = snapshot;
  return {
    ...model,
    ...(drawingDocuments ? { drawingDocuments } : {}),
    ...(workingViews ? { workingViews } : {}),
    bimVisibility: { hiddenLayerIds },
  };
}
