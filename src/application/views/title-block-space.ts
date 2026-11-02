import type { Project } from "../../domain/project/schema.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { commitProject, createHistory } from "../history/project-history.ts";
import { editingReducer, type EditingEvent, type EditingState } from "../direct-edit/controller.ts";
import { titleBlockOf } from "./title-blocks.ts";

/**
 * Drawing space of a title block (docs/PLANKOPF.md, PK2). While the Plankopfplaner tab is
 * active, every plan tool works on the title block's drawing sheet: the workspace sees a lens
 * project whose only storey is that sheet at 1:1, and each change is written back into the
 * title block of the real project as one undo step. The building never sees the sheet.
 */
export type DrawingSpace = { kind: "title-block"; id: string };

const lenses = new WeakMap<Project, Map<string, Project>>();

/** The real project seen through a title block: one storey (its sheet), scale 1:1. */
export function titleBlockLens(real: Project, id: string): Project {
  let byId = lenses.get(real);
  const cached = byId?.get(id);
  if (cached) return cached;
  const block = titleBlockOf(real, id);
  const {
    sections: _sections,
    modelViews: _views,
    drawingDocuments: _documents,
    titleBlocks: _blocks,
    workingStoreyId: _working,
    ...shared
  } = real;
  // Identity stays stable per real project, so base checks of the tools keep working.
  const lens = createProjectSnapshot({
    ...shared,
    storeys: [block.storey],
    groundStoreyId: id,
    workingViews: [{ kind: "working-plan", storeyId: id, denominator: 1 }],
  });
  if (!byId) lenses.set(real, (byId = new Map()));
  byId.set(id, lens);
  return lens;
}

/** Writes a changed lens back: the sheet into its title block, shared settings into the project. */
export function fromTitleBlockLens(real: Project, id: string, next: Project): Project {
  const block = titleBlockOf(real, id);
  const {
    storeys: _storeys,
    groundStoreyId: _ground,
    workingStoreyId: _working,
    workingViews: _views,
    sections: _sections,
    modelViews: _models,
    drawingDocuments: _documents,
    titleBlocks: _blocks,
    hatchPatterns,
    ...shared
  } = next;
  // The lens only keeps the patterns its sheet uses; the building's stay with the project.
  const patterns = new Map(real.hatchPatterns.map((p) => [p.id, p]));
  for (const p of hatchPatterns) patterns.set(p.id, p);
  return {
    ...real,
    ...shared,
    hatchPatterns: [...patterns.values()],
    titleBlocks: real.titleBlocks!.map((t) =>
      t === block ? { ...t, storey: { ...storeyOf(next), id, name: t.name } } : t,
    ),
  };
}

/** Events about the project as a whole: they always act on the real project. */
const REAL_EVENTS = new Set<EditingEvent["type"]>([
  "load-project",
  "undo",
  "redo",
  "patterns-changed",
  "building",
  "set-ground-datum",
  "set-storey-height",
  "rename-storey",
  "document",
  "layout",
  "title-block",
  "working-storey",
]);

export type SpaceEditingState = EditingState & { space?: DrawingSpace };
export type SpaceEditingEvent = EditingEvent | { type: "space"; space: DrawingSpace | null };

/** The editing reducer with drawing spaces; without a space it is the plain reducer. */
export function spaceEditingReducer(
  state: SpaceEditingState,
  event: SpaceEditingEvent,
): SpaceEditingState {
  if (event.type === "space") {
    const { space: _old, ...rest } = state;
    if (event.space) titleBlockOf(state.history.present, event.space.id);
    return { ...rest, ...(event.space ? { space: event.space } : {}), session: null, error: "" };
  }
  const space = state.space;
  if (!space || REAL_EVENTS.has(event.type)) {
    const next = editingReducer(state, event);
    if (!space) return next;
    // An undo or a load may remove the title block: the space closes with it.
    return next.history.present.titleBlocks?.some((t) => t.id === space.id)
      ? { ...next, space }
      : withoutSpace(next);
  }
  const real = state.history.present;
  const lens = titleBlockLens(real, space.id);
  const inner = editingReducer({ ...state, history: createHistory(lens) }, event);
  const changed = inner.history.present;
  if (changed === lens || inner.error) return { ...inner, history: state.history, space };
  try {
    const history = commitProject(state.history, fromTitleBlockLens(real, space.id, changed));
    return { ...inner, history, space };
  } catch (cause) {
    return { ...inner, history: state.history, space, error: (cause as Error).message };
  }
}
function withoutSpace(state: SpaceEditingState): SpaceEditingState {
  const { space: _space, ...rest } = state;
  return rest;
}
