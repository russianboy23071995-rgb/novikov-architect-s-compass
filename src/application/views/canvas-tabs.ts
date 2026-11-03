/**
 * Canvas tabs (docs/SCHNITT.md, SC1/SC2; docs/TABS.md, user decision 03.11.2026): the views open
 * over the canvas, at most one tab per kind – Draufsicht (plans and plan documents), Schnitt /
 * Ansicht (sections, elevations and their documents), 3D and Layoutbuch (layouts, master layouts,
 * Plankopfplaner). Opening a view replaces the content of its kind's tab, which keeps its place.
 * Session state only: not part of the project and no undo step.
 */
export const CANVAS_VIEWS = ["plan", "3d"] as const;
export type ModelView = (typeof CANVAS_VIEWS)[number];
/** A layout or master layout opens as `layout:<id>` (docs/LAYOUTS.md, LA4). */
export type CanvasView =
  ModelView | `section:${string}` | `layout:${string}` | `titleblock:${string}`;

export const CANVAS_VIEW_LABELS: Record<ModelView, string> = {
  plan: "Grundriss",
  "3d": "3D-Ansicht",
};

export const canvasViewOf = (mode: "2D" | "3D"): ModelView => (mode === "3D" ? "3d" : "plan");
export const canvasModeOf = (view: ModelView): "2D" | "3D" => (view === "3d" ? "3D" : "2D");

/** The kind whose single tab shows a view. Reserved for later: evaluations (Auswertungen,
 * Bauteilnachweise) as a fifth kind. */
export type CanvasTabKind = "plan" | "section" | "3d" | "layout";
export const CANVAS_TAB_KINDS: readonly CanvasTabKind[] = ["plan", "section", "3d", "layout"];
export const CANVAS_TAB_KIND_LABELS: Record<CanvasTabKind, string> = {
  plan: "Draufsicht",
  section: "Schnitt / Ansicht",
  "3d": "3D-Ansicht",
  layout: "Layoutbuch",
};
export function canvasTabKind(view: CanvasView): CanvasTabKind {
  if (view === "plan" || view === "3d") return view;
  return view.startsWith("section:") ? "section" : "layout";
}

export const sectionTab = (id: string): CanvasView => `section:${id}`;
/** The section id of a section tab, else null. */
export const tabSectionId = (view: CanvasView): string | null =>
  view.startsWith("section:") ? view.slice("section:".length) : null;

export const layoutTab = (id: string): CanvasView => `layout:${id}`;
/** The Plankopfplaner of a title block (docs/PLANKOPF.md, PK2). */
export const titleBlockTab = (id: string): CanvasView => `titleblock:${id}`;
export const tabTitleBlockId = (view: CanvasView): string | null =>
  view.startsWith("titleblock:") ? view.slice("titleblock:".length) : null;
/** The layout or master layout id of a layout tab, else null. */
export const tabLayoutId = (view: CanvasView): string | null =>
  view.startsWith("layout:") ? view.slice("layout:".length) : null;

/** Tab caption; the plan names the working storey, a section or layout its name. */
export function canvasTabLabel(
  view: CanvasView,
  storeyName: string,
  sections: readonly { id: string; name: string }[] = [],
  layouts: readonly { id: string; name: string }[] = [],
): string {
  const layoutId = tabLayoutId(view);
  if (layoutId !== null) return layouts.find((l) => l.id === layoutId)?.name ?? "Layout";
  const blockId = tabTitleBlockId(view);
  if (blockId !== null)
    return `Plankopfplaner – ${layouts.find((l) => l.id === blockId)?.name ?? "Plankopf"}`;
  const sectionId = tabSectionId(view);
  if (sectionId !== null) return sections.find((s) => s.id === sectionId)?.name ?? "Schnitt";
  return view === "plan" ? `${CANVAS_VIEW_LABELS.plan} ${storeyName}` : CANVAS_VIEW_LABELS["3d"];
}

/** The tabs with `view` open: it takes the place of its kind's tab, or a new one at the end. */
export function withCanvasTab(tabs: readonly CanvasView[], view: CanvasView): CanvasView[] {
  const kind = canvasTabKind(view);
  const index = tabs.findIndex((t) => canvasTabKind(t) === kind);
  if (index < 0) return [...tabs, view];
  // Older states could hold several tabs of a kind; only the first stays.
  return tabs.flatMap((t, i) => (i === index ? [view] : canvasTabKind(t) === kind ? [] : [t]));
}

/** Tabs of sections or layouts that no longer exist are dropped (deleted, or undone). */
export const existingCanvasTabs = (
  tabs: readonly CanvasView[],
  sectionIds: ReadonlySet<string>,
  layoutIds: ReadonlySet<string> = new Set(),
): CanvasView[] =>
  tabs.filter((view) => {
    const id = tabSectionId(view),
      layout = tabLayoutId(view) ?? tabTitleBlockId(view);
    return layout !== null ? layoutIds.has(layout) : id === null || sectionIds.has(id);
  });

/**
 * Closes `view`. The last tab stays open. Closing the active tab activates its right neighbour,
 * at the end the left one.
 */
export function closeCanvasTab(
  tabs: readonly CanvasView[],
  view: CanvasView,
  active: CanvasView,
): { tabs: CanvasView[]; active: CanvasView } {
  const index = tabs.indexOf(view);
  if (index < 0 || tabs.length < 2) return { tabs: [...tabs], active };
  const rest = tabs.filter((t) => t !== view);
  return { tabs: rest, active: view === active ? rest[Math.min(index, rest.length - 1)]! : active };
}
