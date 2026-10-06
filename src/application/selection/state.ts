import type { ElementTarget } from "./target.ts";
import type { Project } from "../../domain/project/schema.ts";
import { isLayerVisible, type LayerVisibilityPolicy } from "../layers/visibility.ts";
export type SelectionSet = readonly ElementTarget[];
export const targetKey = (target: ElementTarget) => `${target.kind}:${target.id}`;
const indexes = new WeakMap<Project, ReadonlyMap<string, ElementTarget>>();
/** Model index reused by eligibility and Navigator; no per-tool kind discovery. */
export function selectionIndex(project: Project): ReadonlyMap<string, ElementTarget> {
  const cached = indexes.get(project);
  if (cached) return cached;
  const ids = new Map<string, ElementTarget>();
  for (const [kind, elements] of [
    ["wall", project.storey.walls],
    ["window", project.storey.windows],
    ["line", project.storey.lines ?? []],
    ["hatch", project.storey.hatches],
  ] as const)
    for (const element of elements) ids.set(element.id, { kind, id: element.id });
  indexes.set(project, ids);
  return ids;
}
export function eligibleSelection(
  project: Project,
  policy: LayerVisibilityPolicy | undefined,
  targets: SelectionSet,
): ElementTarget[] {
  const ids = selectionIndex(project);
  const seen = new Set<string>();
  return targets.filter((t) => {
    const key = targetKey(t);
    if (seen.has(key) || ids.get(t.id)?.kind !== t.kind || !isLayerVisible(project, policy, t.id))
      return false;
    seen.add(key);
    return true;
  });
}
export function selectTargets(
  current: SelectionSet,
  targets: SelectionSet,
  mode: "replace" | "toggle" = "replace",
): ElementTarget[] {
  const next = new Map((mode === "replace" ? [] : current).map((t) => [targetKey(t), t]));
  for (const t of new Map(targets.map((t) => [targetKey(t), t])).values()) {
    const key = targetKey(t);
    if (mode === "toggle" && next.has(key)) next.delete(key);
    else next.set(key, t);
  }
  return [...next.values()];
}
export function singleTarget(targets: SelectionSet): ElementTarget | null {
  return targets.length === 1 ? targets[0]! : null;
}
