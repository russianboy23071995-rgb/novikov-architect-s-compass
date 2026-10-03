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
        present: previous,
        future: [history.present, ...history.future],
      }
    : history;
}
export function redoProject(history: ProjectHistory): ProjectHistory {
  const next = history.future[0];
  return next
    ? {
        past: [...history.past, history.present].slice(-HISTORY_LIMIT),
        present: next,
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
      "Ungültige Projektdatei: erwartet wird ein NOVIKOV-JSON-Projekt (Version 1, Meter) mit gültigen Bauteilen.",
    );
  }
}
