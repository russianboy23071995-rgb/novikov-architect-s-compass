import { deserializeProject, serializeProject, validateProject } from "./model.ts";
import type { Project } from "./model.ts";
export type ProjectHistory = { past: Project[]; present: Project; future: Project[] };
export const HISTORY_LIMIT = 100;
export const PROJECT_FILE_LIMIT = 10 * 1024 * 1024;
export function createHistory(project: Project): ProjectHistory {
  return { past: [], present: validateProject(project), future: [] };
}
export function commitProject(history: ProjectHistory, project: Project): ProjectHistory {
  const next = validateProject(project);
  if (serializeProject(next) === serializeProject(history.present)) return history;
  const { bimVisibility: previousVisibility, ...previousModel } = history.present;
  const { bimVisibility: nextVisibility, ...nextModel } = next;
  if (JSON.stringify(previousModel) === JSON.stringify(nextModel))
    return { ...history, present: next };
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
        present: retainVisibility(previous, history.present),
        future: [history.present, ...history.future],
      }
    : history;
}
export function redoProject(history: ProjectHistory): ProjectHistory {
  const next = history.future[0];
  return next
    ? {
        past: [...history.past, history.present].slice(-HISTORY_LIMIT),
        present: retainVisibility(next, history.present),
        future: history.future.slice(1),
      }
    : history;
}
export function readProjectFile(text: string): Project {
  if (new TextEncoder().encode(text).byteLength > PROJECT_FILE_LIMIT)
    throw new Error("Projektdatei ist größer als 10 MB.");
  try {
    return deserializeProject(text);
  } catch {
    throw new Error(
      "Ungültige Projektdatei: erwartet wird ein NOVIKOV-JSON-Projekt (Version 1, 2 oder 3, Meter) mit gültigen Bauteilen.",
    );
  }
}

/** Model undo never rewinds the independent palette settings. Deleted IDs cannot survive. */
function retainVisibility(snapshot: Project, current: Project): Project {
  const ids = new Set(snapshot.layers.map((l) => l.id));
  const hiddenLayerIds = current.bimVisibility.hiddenLayerIds.filter((id) => ids.has(id));
  if (JSON.stringify(hiddenLayerIds) === JSON.stringify(snapshot.bimVisibility.hiddenLayerIds))
    return snapshot;
  return { ...snapshot, bimVisibility: { hiddenLayerIds } };
}
