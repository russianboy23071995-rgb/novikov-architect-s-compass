/**
 * Split canvas (docs/SPLITSCREEN.md, Stufe 1): two tabs of different kinds side by side or one
 * above the other. The tab rule stays (one tab per kind), so a split pairs two kinds. The active
 * tab is the active field; the other field shows its tab live and becomes active on a click.
 * The layout book stays outside in Stufe 1. Session state only: not part of the project and no
 * undo step.
 */
import { canvasTabKind, type CanvasTabKind, type CanvasView } from "./canvas-tabs.ts";

export type SplitDirection = "row" | "column";
export type CanvasSplit = {
  /** Left or upper field, then right or lower field; always two different kinds. */
  kinds: readonly [CanvasTabKind, CanvasTabKind];
  direction: SplitDirection;
  /** Share of the first field, within SPLIT_RATIO. */
  ratio: number;
};

export const SPLIT_KINDS: readonly CanvasTabKind[] = ["plan", "section", "3d"];
export const SPLIT_RATIO = { min: 0.2, max: 0.8, initial: 0.5 } as const;
export const SPLIT_DIRECTION_LABELS: Record<SplitDirection, string> = {
  row: "Rechts daneben öffnen",
  column: "Darunter öffnen",
};

export const clampSplitRatio = (ratio: number) =>
  Number.isFinite(ratio)
    ? Math.min(SPLIT_RATIO.max, Math.max(SPLIT_RATIO.min, ratio))
    : SPLIT_RATIO.initial;

/**
 * The partner of `view` when it opens beside another tab: the active tab, when it is of another
 * kind, else the first other tab of the bar. Null when `view` cannot be split or no partner exists.
 */
export function splitPartner(
  tabs: readonly CanvasView[],
  view: CanvasView,
  active: CanvasView,
): CanvasView | null {
  const kind = canvasTabKind(view);
  if (!SPLIT_KINDS.includes(kind)) return null;
  const fits = (t: CanvasView) =>
    canvasTabKind(t) !== kind && SPLIT_KINDS.includes(canvasTabKind(t));
  if (fits(active)) return active;
  return tabs.find(fits) ?? null;
}

/** `view` opens in the second field next to its partner; null when it cannot be split. */
export function openSplit(
  tabs: readonly CanvasView[],
  view: CanvasView,
  active: CanvasView,
  direction: SplitDirection,
): CanvasSplit | null {
  const partner = splitPartner(tabs, view, active);
  if (!partner) return null;
  return {
    kinds: [canvasTabKind(partner), canvasTabKind(view)],
    direction,
    ratio: SPLIT_RATIO.initial,
  };
}

/**
 * The split as it is shown now: only while both kinds have a tab and the active tab is one of
 * them. Another active kind (the layout book) shows alone; the split returns with its kinds.
 */
export function shownSplit(
  split: CanvasSplit | null,
  tabs: readonly CanvasView[],
  active: CanvasView,
): CanvasSplit | null {
  if (!split) return null;
  const open = (kind: CanvasTabKind) => tabs.some((t) => canvasTabKind(t) === kind);
  if (!split.kinds.every(open)) return null;
  return split.kinds.includes(canvasTabKind(active)) ? split : null;
}

/** A split whose kind lost its tab (closed) is dropped; it does not come back by itself. */
export const keptSplit = (split: CanvasSplit | null, tabs: readonly CanvasView[]) =>
  split && split.kinds.every((kind) => tabs.some((t) => canvasTabKind(t) === kind)) ? split : null;

/** The tab a field shows: the bar's tab of its kind. */
export const splitFieldTab = (tabs: readonly CanvasView[], kind: CanvasTabKind) =>
  tabs.find((t) => canvasTabKind(t) === kind) ?? null;

/** Position of a field in per cent of the drawing area. */
export function splitFieldRect(split: CanvasSplit, field: 0 | 1) {
  const share = field === 0 ? split.ratio : 1 - split.ratio;
  const start = field === 0 ? 0 : split.ratio;
  const pct = (v: number) => `${(v * 100).toFixed(3)}%`;
  return split.direction === "row"
    ? { left: pct(start), top: "0%", width: pct(share), height: "100%" }
    : { left: "0%", top: pct(start), width: "100%", height: pct(share) };
}
