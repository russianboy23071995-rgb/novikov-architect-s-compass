import type { ElementTarget } from "./target.ts";

/**
 * Pre-selection among overlapping elements under the cursor (docs/TAB_AUSWAHL.md).
 * Two states (user decision 30.10.2026): collapsed = only a minimal hint that several elements
 * lie here; expanded after the first Tab = the list with the pre-selection to step through.
 */
export type OverlapCycle = {
  targets: readonly ElementTarget[];
  index: number;
  expanded: boolean;
};

const key = (targets: readonly ElementTarget[]) =>
  targets.map((t) => `${t.kind}:${t.id}`).join("|");

/** New hover result: keeps the pre-selection while the same elements lie under the cursor,
 * starts again collapsed at the topmost one when the set changes; null with fewer than two. */
export function hoverCycle(
  previous: OverlapCycle | null,
  targets: readonly ElementTarget[],
): OverlapCycle | null {
  if (targets.length < 2) return null;
  if (previous && key(previous.targets) === key(targets)) return previous;
  return { targets, index: 0, expanded: false };
}

/** The first Tab only opens the list (topmost pre-selected); then Tab steps forward,
 * Shift+Tab backward, once around. */
export function stepCycle(cycle: OverlapCycle, backward = false): OverlapCycle {
  if (!cycle.expanded) return { ...cycle, expanded: true };
  const n = cycle.targets.length;
  return { ...cycle, index: (cycle.index + (backward ? n - 1 : 1)) % n };
}

export function cycleTarget(cycle: OverlapCycle): ElementTarget {
  return cycle.targets[cycle.index]!;
}
