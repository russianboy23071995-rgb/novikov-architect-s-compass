import type { ElementTarget } from "./target.ts";

/** Pre-selection among overlapping elements under the cursor (docs/TAB_AUSWAHL.md). */
export type OverlapCycle = { targets: readonly ElementTarget[]; index: number };

const key = (targets: readonly ElementTarget[]) =>
  targets.map((t) => `${t.kind}:${t.id}`).join("|");

/** New hover result: keeps the pre-selection while the same elements lie under the cursor,
 * starts again at the topmost one when the set changes; null with fewer than two elements. */
export function hoverCycle(
  previous: OverlapCycle | null,
  targets: readonly ElementTarget[],
): OverlapCycle | null {
  if (targets.length < 2) return null;
  if (previous && key(previous.targets) === key(targets)) return previous;
  return { targets, index: 0 };
}

/** Tab steps forward, Shift+Tab backward, once around. */
export function stepCycle(cycle: OverlapCycle, backward = false): OverlapCycle {
  const n = cycle.targets.length;
  return { ...cycle, index: (cycle.index + (backward ? n - 1 : 1)) % n };
}

export function cycleTarget(cycle: OverlapCycle): ElementTarget {
  return cycle.targets[cycle.index]!;
}
