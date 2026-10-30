import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { ELEMENT_KINDS, elementKinds, storeyElements } from "../../domain/elements/registry.ts";
import type { ElementTarget } from "../selection/target.ts";

/** Display order step (docs/DARSTELLUNGSREIHENFOLGE.md, K2). */
export type DisplayOrder = "front" | "forward" | "backward" | "back";

export const DISPLAY_ORDER_LABELS: Record<DisplayOrder, string> = {
  front: "Ganz nach vorne",
  forward: "Nach vorne",
  backward: "Nach hinten",
  back: "Ganz nach hinten",
};

/** New order of one list: selected entries move as a block, keeping their relative order;
 * "forward"/"backward" pass one unselected neighbour. Later in the list = drawn on top. */
function reorder<T extends { id: string }>(
  list: readonly T[],
  chosen: ReadonlySet<string>,
  step: DisplayOrder,
): T[] {
  const picked = list.filter((e) => chosen.has(e.id));
  if (!picked.length) return [...list];
  const rest = list.filter((e) => !chosen.has(e.id));
  if (step === "front") return [...rest, ...picked];
  if (step === "back") return [...picked, ...rest];
  const result = [...list];
  if (step === "forward")
    for (let i = result.length - 2; i >= 0; i--) {
      if (chosen.has(result[i]!.id) && !chosen.has(result[i + 1]!.id))
        [result[i], result[i + 1]] = [result[i + 1]!, result[i]!];
    }
  else
    for (let i = 1; i < result.length; i++) {
      if (chosen.has(result[i]!.id) && !chosen.has(result[i - 1]!.id))
        [result[i], result[i - 1]] = [result[i - 1]!, result[i]!];
    }
  return result;
}

/**
 * Display order of the selected elements within their own kind (K2): the plan draws each kind
 * in its stored order, so moving an element in its list puts it above or below others of the
 * same kind (line over line, hatch over hatch, room over room). Works for every kind of the
 * element registry. Between kinds the fixed plan order stays (material priority later, C3).
 * One checked change, one undo step; unchanged when nothing can move.
 */
export function changeDisplayOrder(
  project: Project,
  targets: readonly ElementTarget[],
  step: DisplayOrder,
): Project {
  const chosen = new Set(targets.map((t) => t.id));
  let changed = false;
  const storeys = project.storeys.map((storey) => {
    let next = storey;
    for (const kind of elementKinds) {
      const list = storeyElements(storey, kind) as readonly { id: string }[];
      if (!list.some((e) => chosen.has(e.id))) continue;
      const ordered = reorder(list, chosen, step);
      if (ordered.every((e, i) => e === list[i])) continue;
      changed = true;
      next = { ...next, [ELEMENT_KINDS[kind].list]: ordered };
    }
    return next;
  });
  return changed ? validateLike(project, { ...project, storeys }) : project;
}

/** Whether a step would change anything (to grey out menu entries); no model check, cheap. */
export function canChangeDisplayOrder(
  project: Project,
  targets: readonly ElementTarget[],
  step: DisplayOrder,
): boolean {
  const chosen = new Set(targets.map((t) => t.id));
  return (
    chosen.size > 0 &&
    project.storeys.some((storey) =>
      elementKinds.some((kind) => {
        const list = storeyElements(storey, kind) as readonly { id: string }[];
        return (
          list.some((e) => chosen.has(e.id)) &&
          !reorder(list, chosen, step).every((e, i) => e === list[i])
        );
      }),
    )
  );
}
