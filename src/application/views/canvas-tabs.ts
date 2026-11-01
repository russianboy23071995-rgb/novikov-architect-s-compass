/**
 * Canvas tabs (docs/SCHNITT.md, SC1): the views open over the canvas. The active tab is the
 * current view; switching to a view that has no tab opens one. Session state only: not part of
 * the project and no undo step. Sections join as their own tab kind in SC2.
 */
export const CANVAS_VIEWS = ["plan", "3d"] as const;
export type CanvasView = (typeof CANVAS_VIEWS)[number];

export const CANVAS_VIEW_LABELS: Record<CanvasView, string> = {
  plan: "Grundriss",
  "3d": "3D-Ansicht",
};

export const canvasViewOf = (mode: "2D" | "3D"): CanvasView => (mode === "3D" ? "3d" : "plan");
export const canvasModeOf = (view: CanvasView): "2D" | "3D" => (view === "3d" ? "3D" : "2D");

/** Tab caption; the plan names the working storey. */
export const canvasTabLabel = (view: CanvasView, storeyName: string) =>
  view === "plan" ? `${CANVAS_VIEW_LABELS.plan} ${storeyName}` : CANVAS_VIEW_LABELS[view];

/** The tabs with `view` open; an open view keeps its place. */
export const withCanvasTab = (tabs: readonly CanvasView[], view: CanvasView): CanvasView[] =>
  tabs.includes(view) ? [...tabs] : [...tabs, view];

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
