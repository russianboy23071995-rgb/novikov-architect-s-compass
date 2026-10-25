import { storeyOf } from "../src/domain/storeys/access.ts";
import { addWindow } from "../src/application/windows/actions.ts";
import { updateLine } from "../src/application/lines/actions.ts";
import { type Project } from "../src/domain/project/schema.ts";
import { updateWall } from "../src/application/walls/actions.ts";
import {
  commitProject,
  createHistory,
  undoProject,
  type ProjectHistory,
} from "../src/lib/bim/history.ts";
import { legacyCommitProject, legacyCreateHistory } from "./legacy-commit.ts";

type Commit = (history: ProjectHistory, project: Project) => ProjectHistory;
export const paths = {
  legacy: { create: legacyCreateHistory, commit: legacyCommitProject as Commit },
  current: { create: createHistory, commit: commitProject as Commit },
};

/** Representative edits on the working storey; `i` alternates so each step is a real change. */
export const operations = {
  wallReshape: (p: Project, i: number) => {
    const wall = storeyOf(p).walls[1]!;
    return updateWall(p, wall.id, {
      end: { x: wall.start.x, y: wall.start.y + (i % 2 ? 4.5 : 5) },
    });
  },
  windowPlace: (p: Project, i: number) =>
    addWindow(p, {
      ...storeyOf(p).windows[0]!,
      id: `placed-${i}`,
      wallId: storeyOf(p).walls[(1 + 2 * i) % storeyOf(p).walls.length]!.id,
    }),
  lineColour: (p: Project, i: number) =>
    updateLine(p, storeyOf(p).lines![0]!.id, { color: i % 2 ? "#abcdef" : "#123456" }),
  visibility: (p: Project, i: number) => ({
    ...p,
    bimVisibility: { hiddenLayerIds: i % 2 ? [p.defaultLayerIds.line] : [] },
  }),
  noop: (p: Project) => p,
};
export type OperationName = keyof typeof operations;

/** One step for both paths with the same input; returns comparable observations. */
export function observe(history: ProjectHistory) {
  return {
    present: JSON.stringify(history.present),
    past: history.past.map((p) => JSON.stringify(p)),
    future: history.future.map((p) => JSON.stringify(p)),
  };
}

export function scriptedRun(path: keyof typeof paths, base: Project) {
  const { create, commit } = paths[path];
  let history = create(base);
  const steps: { op: string; sameHistory: boolean; observed: ReturnType<typeof observe> }[] = [];
  const names: OperationName[] = [
    "wallReshape",
    "windowPlace",
    "lineColour",
    "visibility",
    "noop",
    "wallReshape",
  ];
  names.forEach((name, i) => {
    const next = commit(history, operations[name](history.present, i));
    steps.push({ op: name, sameHistory: next === history, observed: observe(next) });
    history = next;
  });
  history = undoProject(undoProject(history));
  const branched = commit(history, operations.windowPlace(history.present, 99));
  steps.push({ op: "undo2+branch", sameHistory: false, observed: observe(branched) });
  return { steps, history: branched };
}
