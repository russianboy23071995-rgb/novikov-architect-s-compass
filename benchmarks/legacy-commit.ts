import { assertRasterBudgetChange } from "../src/domain/project/raster-budget.ts";
import { sameProjectModel, sameProjectContent } from "../src/domain/project/model-equality.ts";
import { assertValidatedProjectSize } from "../src/interop/project-file/size.ts";
import { validateProject, type Project } from "../src/lib/bim/model.ts";
import { HISTORY_LIMIT, type ProjectHistory } from "../src/lib/bim/history.ts";

/** Frozen pre-sharing commit (main 04bdd24) for same-session comparison; diagnostics only. */
export function legacyCreateHistory(project: Project): ProjectHistory {
  return { past: [], present: validateProject(project), future: [] };
}
export function legacyCommitProject(
  history: ProjectHistory,
  project: Project,
  options: { legacyFileOpen?: boolean } = {},
): ProjectHistory {
  const next = validateProject(project);
  assertValidatedProjectSize(next);
  const previous = validateProject(history.present);
  assertValidatedProjectSize(previous);
  if (!options.legacyFileOpen) assertRasterBudgetChange(previous, next);
  if (sameProjectContent(next, previous)) return history;
  if (sameProjectModel(history.present, next)) return { ...history, present: next };
  return {
    past: [...history.past, history.present].slice(-HISTORY_LIMIT),
    present: next,
    future: [],
  };
}
