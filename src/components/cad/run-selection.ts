import type { PlanRun } from "@/rendering/viewport/plan-scene";

type RunKind = PlanRun["kind"];
/** Elements drawn in another kind's run: windows and doors in the run of their wall. */
const DRAWN_IN: Partial<Record<string, RunKind>> = { window: "wall", door: "wall" };

/** The runs that draw at least one of the selected elements (docs/TABS.md, Auswahlklick). */
export function selectedRunKinds(targets: readonly { kind: string }[]): ReadonlySet<string> {
  return new Set(targets.map((t) => DRAWN_IN[t.kind] ?? t.kind));
}

/**
 * The selection a run gets: the selected ids when it draws a selected element, else `none`, the
 * same empty set every time. A click then re-renders only the runs whose highlight changes.
 */
export function runSelection(
  kind: RunKind,
  kinds: ReadonlySet<string>,
  selectedIds: ReadonlySet<string>,
  none: ReadonlySet<string>,
): ReadonlySet<string> {
  return kinds.has(kind) ? selectedIds : none;
}
