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
  /** The element chosen with Tab while the cursor is off it; a click lets it go. */
  pin?: ElementTarget;
};

const same = (a: ElementTarget, b: ElementTarget) => a.kind === b.kind && a.id === b.id;
const key = (targets: readonly ElementTarget[]) =>
  targets.map((t) => `${t.kind}:${t.id}`).join("|");

/** New hover result: keeps the pre-selection while the same elements lie under the cursor,
 * starts again collapsed at the topmost one when the set changes; null with fewer than two.
 * An element chosen with Tab stays chosen wherever the cursor goes inside it, alone there too;
 * off it the choice waits and comes back on the way in (docs/ANPASSUNGSLISTE.md, 6). */
export function hoverCycle(
  previous: OverlapCycle | null,
  targets: readonly ElementTarget[],
): OverlapCycle | null {
  const pin = previous?.expanded ? previous.targets[previous.index] : previous?.pin;
  if (pin) {
    const index = targets.findIndex((t) => same(t, pin));
    return index >= 0
      ? { targets, index, expanded: true }
      : { targets, index: 0, expanded: false, pin };
  }
  if (targets.length < 2) return null;
  if (previous && key(previous.targets) === key(targets)) return previous;
  return { targets, index: 0, expanded: false };
}

/** The first Tab only opens the list (topmost pre-selected); then Tab steps forward,
 * Shift+Tab backward, once around. */
export function stepCycle(cycle: OverlapCycle, backward = false): OverlapCycle {
  const n = cycle.targets.length;
  if (!n) return cycle;
  if (!cycle.expanded) return { targets: cycle.targets, index: cycle.index, expanded: true };
  return { ...cycle, index: (cycle.index + (backward ? n - 1 : 1)) % n };
}

export function cycleTarget(cycle: OverlapCycle): ElementTarget {
  return cycle.targets[cycle.index]!;
}
