/**
 * Canvas tabs (docs/SCHNITT.md, SC1/SC2): the views open over the canvas. The active tab is the
 * current view; switching to a view that has no tab opens one. A section opens as its own tab.
 * Session state only: not part of the project and no undo step.
 */
export const CANVAS_VIEWS = ["plan", "3d"] as const;
export type ModelView = (typeof CANVAS_VIEWS)[number];
/** A layout or master layout opens as `layout:<id>` (docs/LAYOUTS.md, LA4). */
export type CanvasView = ModelView | `section:${string}` | `layout:${string}`;

export const CANVAS_VIEW_LABELS: Record<ModelView, string> = {
  plan: "Grundriss",
  "3d": "3D-Ansicht",
};

export const canvasViewOf = (mode: "2D" | "3D"): ModelView => (mode === "3D" ? "3d" : "plan");
export const canvasModeOf = (view: ModelView): "2D" | "3D" => (view === "3d" ? "3D" : "2D");

export const sectionTab = (id: string): CanvasView => `section:${id}`;
/** The section id of a section tab, else null. */
export const tabSectionId = (view: CanvasView): string | null =>
  view.startsWith("section:") ? view.slice("section:".length) : null;

export const layoutTab = (id: string): CanvasView => `layout:${id}`;
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
  const sectionId = tabSectionId(view);
  if (sectionId !== null) return sections.find((s) => s.id === sectionId)?.name ?? "Schnitt";
  return view === "plan" ? `${CANVAS_VIEW_LABELS.plan} ${storeyName}` : CANVAS_VIEW_LABELS["3d"];
}

/** The tabs with `view` open; an open view keeps its place. */
export const withCanvasTab = (tabs: readonly CanvasView[], view: CanvasView): CanvasView[] =>
  tabs.includes(view) ? [...tabs] : [...tabs, view];

/** Tabs of sections or layouts that no longer exist are dropped (deleted, or undone). */
export const existingCanvasTabs = (
  tabs: readonly CanvasView[],
  sectionIds: ReadonlySet<string>,
  layoutIds: ReadonlySet<string> = new Set(),
): CanvasView[] =>
  tabs.filter((view) => {
    const id = tabSectionId(view),
      layout = tabLayoutId(view);
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
