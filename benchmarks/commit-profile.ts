import { validateProject, serializeProject, type Project } from "../src/lib/bim/model";
import { commitProject, HISTORY_LIMIT, type ProjectHistory } from "../src/lib/bim/history";
import { connectedWallSolids } from "../src/domain/elements/wall/connections";
import { assertProjectFileSize } from "../src/interop/project-file/size";

/** Frozen pre-A03 commit for same-session comparisons; diagnostics only. */
function legacyCommit(history: ProjectHistory, project: Project): ProjectHistory {
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

export function commitProfileCases(history: ProjectHistory, next: Project) {
  return [
    // Validation includes schema parsing (including image base64), geometry and solids.
    ["validateInclusive", () => validateProject(next)],
    // Fresh root bypasses the existing WeakMap cache, without timing a deep copy.
    ["wallSolidsCold", () => connectedWallSolids({ ...next })],
    [
      "jsonCompareAndSize",
      () => {
        const a = JSON.stringify(next),
          b = JSON.stringify(history.present);
        assertProjectFileSize(a);
        assertProjectFileSize(b);
        return a === b;
      },
    ],
    [
      "modelOnlyCompare",
      () => {
        const { bimVisibility: a, ...previousModel } = history.present;
        const { bimVisibility: b, ...nextModel } = next;
        return JSON.stringify(previousModel) === JSON.stringify(nextModel);
      },
    ],
    ["commitLegacy", () => legacyCommit(history, next)],
    ["commitCurrent", () => commitProject(history, next)],
  ] satisfies [string, () => unknown][];
}
