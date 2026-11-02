import type { Project } from "../../domain/project/schema.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { commitProject, createHistory } from "../history/project-history.ts";
import { editingReducer, type EditingEvent, type EditingState } from "../direct-edit/controller.ts";
import { emptyTitleBlockStorey, titleBlockOf, titleBlockUnderlay } from "./title-blocks.ts";
import { layoutUnderlay } from "./layouts.ts";
import { setSheetFrames, type SheetFrames } from "../snapping/sheet-frames.ts";
import { layoutSheet, projectLayouts, projectMasterLayouts } from "../../domain/views/layouts.ts";

/**
 * Drawing spaces (docs/PLANKOPF.md, PK2; docs/LAYOUTS.md, LZ1): a title block or a layout
 * (also a master layout). While its tab is active, every plan tool works on its drawing
 * sheet: the workspace sees a lens project whose only storey is that sheet at 1:1, and each
 * change is written back into the real project as one undo step. The building never sees it.
 */
export type DrawingSpace = { kind: "title-block" | "layout"; id: string };

const lenses = new WeakMap<Project, Map<string, Project>>();
const key = (space: DrawingSpace) => `${space.kind}:${space.id}`;
/** Storey id of a layout's sheet; distinct from the layout's own id. */
export const layoutSheetId = (layoutId: string) => `sheet-${layoutId}`;

/** The drawing sheet of a space; a layout without drawing has an empty one. */
export function spaceSheet(real: Project, space: DrawingSpace): Project["storeys"][number] {
  if (space.kind === "title-block") return titleBlockOf(real, space.id).storey;
  const owner =
    projectLayouts(real).find((l) => l.id === space.id) ??
    projectMasterLayouts(real).find((m) => m.id === space.id);
  if (!owner) throw new Error("Das Layout existiert nicht mehr.");
  return (
    real.layoutDrawings?.find((d) => d.layoutId === space.id)?.storey ??
    emptyTitleBlockStorey(layoutSheetId(space.id), owner.name)
  );
}

/** The real project seen through a drawing space: one storey (its sheet), scale 1:1. */
export function spaceLens(real: Project, space: DrawingSpace): Project {
  let byKey = lenses.get(real);
  const cached = byKey?.get(key(space));
  if (cached) return cached;
  const sheet = spaceSheet(real, space);
  const {
    sections: _sections,
    modelViews: _views,
    drawingDocuments: _documents,
    titleBlocks: _blocks,
    layoutDrawings: _drawings,
    workingStoreyId: _working,
    ...shared
  } = real;
  // Identity stays stable per real project, so base checks of the tools keep working.
  const lens = createProjectSnapshot({
    ...shared,
    storeys: [sheet],
    groundStoreyId: sheet.id,
    workingViews: [{ kind: "working-plan", storeyId: sheet.id, denominator: 1 }],
  });
  if (!byKey) lenses.set(real, (byKey = new Map()));
  byKey.set(key(space), lens);
  setSheetFrames(lens, spaceFrames(real, space));
  return lens;
}
export const titleBlockLens = (real: Project, id: string) =>
  spaceLens(real, { kind: "title-block", id });

/** Writes a changed lens back: the sheet into its owner, shared settings into the project. */
export function fromSpaceLens(real: Project, space: DrawingSpace, next: Project): Project {
  const before = spaceSheet(real, space);
  const {
    storeys: _storeys,
    groundStoreyId: _ground,
    workingStoreyId: _working,
    workingViews: _views,
    sections: _sections,
    modelViews: _models,
    drawingDocuments: _documents,
    titleBlocks: _blocks,
    layoutDrawings: _drawings,
    hatchPatterns,
    ...shared
  } = next;
  // The lens only keeps the patterns its sheet uses; the building's stay with the project.
  const patterns = new Map(real.hatchPatterns.map((p) => [p.id, p]));
  for (const p of hatchPatterns) patterns.set(p.id, p);
  const sheet = { ...storeyOf(next), id: before.id, name: before.name };
  const base = { ...real, ...shared, hatchPatterns: [...patterns.values()] };
  if (space.kind === "title-block")
    return {
      ...base,
      titleBlocks: real.titleBlocks!.map((t) => (t.id === space.id ? { ...t, storey: sheet } : t)),
    };
  // A layout keeps a drawing only while something is drawn on it.
  const empty = !sheet.lines?.length && !sheet.texts?.length && !sheet.hatches.length;
  const rest = (real.layoutDrawings ?? []).filter((d) => d.layoutId !== space.id);
  const drawings = empty ? rest : [...rest, { layoutId: space.id, storey: sheet }];
  const { layoutDrawings: _old, ...without } = base;
  return drawings.length ? { ...without, layoutDrawings: drawings } : without;
}
export const fromTitleBlockLens = (real: Project, id: string, next: Project) =>
  fromSpaceLens(real, { kind: "title-block", id }, next);

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
    if (event.space) spaceSheet(state.history.present, event.space);
    return { ...rest, ...(event.space ? { space: event.space } : {}), session: null, error: "" };
  }
  const space = state.space;
  if (!space || REAL_EVENTS.has(event.type)) {
    const next = editingReducer(state, event);
    if (!space) return next;
    // An undo or a load may remove the title block: the space closes with it.
    try {
      spaceSheet(next.history.present, space);
      return { ...next, space };
    } catch {
      return withoutSpace(next);
    }
  }
  const real = state.history.present;
  const lens = spaceLens(real, space);
  const inner = editingReducer({ ...state, history: createHistory(lens) }, event);
  const changed = inner.history.present;
  if (changed === lens || inner.error) return { ...inner, history: state.history, space };
  try {
    const history = commitProject(state.history, fromSpaceLens(real, space, changed));
    return { ...inner, history, space };
  } catch (cause) {
    return { ...inner, history: state.history, space, error: (cause as Error).message };
  }
}
function withoutSpace(state: SpaceEditingState): SpaceEditingState {
  const { space: _space, ...rest } = state;
  return rest;
}

/** Paper and margin frame of a space, for snapping (the same rectangles as its underlay). */
function spaceFrames(real: Project, space: DrawingSpace): SheetFrames {
  if (space.kind === "title-block") return titleBlockUnderlay(titleBlockOf(real, space.id).sheet);
  const layout = projectLayouts(real).find((l) => l.id === space.id);
  const sheet = layout
    ? layoutSheet(real, layout)
    : projectMasterLayouts(real).find((m) => m.id === space.id)!.sheet;
  return layoutUnderlay(sheet);
}
