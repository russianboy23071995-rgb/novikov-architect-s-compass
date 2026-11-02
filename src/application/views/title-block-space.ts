import type { Project } from "../../domain/project/schema.ts";
import { createProjectSnapshot } from "../../domain/project/owned-snapshot.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { commitProject, createHistory } from "../history/project-history.ts";
import { editingReducer, type EditingEvent, type EditingState } from "../direct-edit/controller.ts";
import { emptyTitleBlockStorey, titleBlockOf, titleBlockUnderlay } from "./title-blocks.ts";
import { layoutUnderlay } from "./layouts.ts";
import { setSheetFrames, type SheetFrames } from "../snapping/sheet-frames.ts";
import { autoTextValues, resolveAutoText } from "./auto-texts.ts";
import {
  layoutSheet,
  projectLayouts,
  projectMasterLayouts,
  sheetSize,
} from "../../domain/views/layouts.ts";

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
  // The lens has no title blocks, so master layouts point at none there (PK4).
  const lens = createProjectSnapshot({
    ...shared,
    ...(shared.masterLayouts
      ? {
          masterLayouts: shared.masterLayouts.map(({ titleBlockId: _block, ...master }) => master),
        }
      : {}),
    // Nor drawing documents: layouts point at none there (AT1).
    ...(shared.layouts
      ? { layouts: shared.layouts.map(({ documentId: _document, ...layout }) => layout) }
      : {}),
    storeys: [sheet],
    groundStoreyId: sheet.id,
    workingViews: [{ kind: "working-plan", storeyId: sheet.id, denominator: 1 }],
  });
  if (!byKey) lenses.set(real, (byKey = new Map()));
  byKey.set(key(space), lens);
  setSheetFrames(lens, { ...spaceFrames(real, space), backdrop: spaceBackdrop(real, space) });
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
    // Master layouts change only by project steps; the real ones keep their title blocks.
    masterLayouts: _masters,
    layouts: _layouts,
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
  const empty =
    !sheet.lines?.length &&
    !sheet.texts?.length &&
    !sheet.hatches.length &&
    !sheet.drawings?.length;
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
  "project-info",
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

/** Ids of drawn-under elements: never model elements, never pickable (docs/PLANKOPF.md). */
const BACKDROP_PREFIX = "@bg:";
const backdrops = new WeakMap<Project, Map<string, Project | null>>();

/**
 * What lies under a layout's own drawing (docs/LAYOUTS.md, LZ2; docs/PLANKOPF.md, PK4): the
 * drawing of its master layout and the master's title block, its lower right corner on the
 * lower right corner of the margin frame. A master layout shows its title block under its
 * own drawing. Undefined for title blocks and layouts without a master.
 */
export function spaceBackdrop(real: Project, space: DrawingSpace): Project | undefined {
  if (space.kind !== "layout") return undefined;
  let byId = backdrops.get(real);
  if (byId?.has(space.id)) return byId.get(space.id) ?? undefined;
  const result = buildBackdrop(real, space.id);
  if (!byId) backdrops.set(real, (byId = new Map()));
  byId.set(space.id, result);
  return result ?? undefined;
}

function buildBackdrop(real: Project, id: string): Project | null {
  const masters = projectMasterLayouts(real);
  const layout = projectLayouts(real).find((l) => l.id === id);
  const master = layout
    ? masters.find((m) => m.id === layout.masterId)
    : masters.find((m) => m.id === id);
  if (!master) return null;
  const block = master.titleBlockId
    ? real.titleBlocks?.find((t) => t.id === master.titleBlockId)
    : undefined;
  // A layout sees its master's drawing; the master itself draws that sheet on top.
  const base = layout ? spaceSheet(real, { kind: "layout", id: master.id }) : null;
  if (
    !block &&
    !base?.lines?.length &&
    !base?.texts?.length &&
    !base?.hatches.length &&
    !base?.drawings?.length
  )
    return null;
  const { width, height: _h } = sheetSize(master.sheet);
  const shift = {
    x: (width - master.sheet.margins.right) / 1000,
    y: master.sheet.margins.bottom / 1000,
  };
  const moved = (p: { x: number; y: number }, d: { x: number; y: number }) => ({
    x: p.x + d.x,
    y: p.y + d.y,
  });
  const none = { x: 0, y: 0 };
  type Sheet = Project["storeys"][number];
  // Automatic texts read this sheet's values; a master keeps missing names visible (AT3).
  const values = autoTextValues(real, id, new Date());
  const text = (content: string) => resolveAutoText(content, values, !layout);
  const copy = (sheet: Sheet | null | undefined, d: { x: number; y: number }, tag: string) => ({
    lines: (sheet?.lines ?? []).map((l) => ({
      ...l,
      id: `${BACKDROP_PREFIX}${tag}${l.id}`,
      points: l.points.map((p) => moved(p, d)),
    })),
    texts: (sheet?.texts ?? []).map((t) => ({
      ...t,
      id: `${BACKDROP_PREFIX}${tag}${t.id}`,
      position: moved(t.position, d),
      content: text(t.content),
    })),
    hatches: (sheet?.hatches ?? []).map((h) => ({
      ...h,
      id: `${BACKDROP_PREFIX}${tag}${h.id}`,
      points: h.points.map((p) => moved(p, d)),
      ...(h.pattern ? { pattern: { ...h.pattern, origin: moved(h.pattern.origin, d) } } : {}),
    })),
  });
  const own = copy(base, none, "m:");
  // The master's placed drawings show on every layout that follows it (ZW2).
  const drawings = (base?.drawings ?? []).map((d) => ({ ...d, id: `${BACKDROP_PREFIX}m:${d.id}` }));
  const head = copy(block?.storey, shift, "t:");
  const storey: Sheet = {
    ...emptyTitleBlockStorey(`${BACKDROP_PREFIX}${id}`, master.name),
    lines: [...own.lines, ...head.lines],
    texts: [...own.texts, ...head.texts],
    hatches: [...own.hatches, ...head.hatches],
    ...(drawings.length ? { drawings } : {}),
  };
  // Drawing only: the shared settings (layers, pens, patterns) of the real project.
  return { ...real, storeys: [storey], groundStoreyId: storey.id };
}
