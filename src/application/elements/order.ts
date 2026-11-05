import type { Project } from "../../domain/project/schema.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import { ELEMENT_KINDS, elementKinds, storeyElements } from "../../domain/elements/registry.ts";
import type { ElementTarget } from "../selection/target.ts";

/** Display order step (docs/DARSTELLUNGSREIHENFOLGE.md, K2). */
export type DisplayOrder = "front" | "forward" | "backward" | "back" | "reset";

export const DISPLAY_ORDER_LABELS: Record<DisplayOrder, string> = {
  front: "Ganz nach vorne",
  forward: "Nach vorne",
  backward: "Nach hinten",
  back: "Ganz nach hinten",
  reset: "Standardreihenfolge",
};

/** New order of one list: selected entries move as a block, keeping their relative order;
 * "forward"/"backward" pass one unselected neighbour. Later in the list = drawn on top. */
function reorder<T extends { id: string }>(
  list: readonly T[],
  chosen: ReadonlySet<string>,
  step: Exclude<DisplayOrder, "reset">,
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

/** Kinds that draw as their own run; windows and doors go with their wall, roof windows with
 * their roof. */
const BAND_KINDS: ReadonlySet<string> = new Set([
  "reference",
  "room",
  "slab",
  "slabOpening",
  "roof",
  "hatch",
  "object",
  "wall",
  "column",
  "stair",
  "railing",
  "line",
  "dimension",
  "text",
]);
type Bands = { front: string[]; back: string[] };
const same = (a: readonly string[], b: readonly string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/** The bands after a step: `moved` says the step already moved something within its kind. */
function nextBands(
  bands: Bands,
  ids: readonly string[],
  step: DisplayOrder,
  moved: boolean,
): Bands {
  const chosen = new Set(ids);
  const front = bands.front.filter((id) => !chosen.has(id)),
    back = bands.back.filter((id) => !chosen.has(id));
  const free = ids.filter((id) => !bands.front.includes(id) && !bands.back.includes(id));
  const ordered = (list: readonly string[], direction: "forward" | "backward") =>
    reorder(
      list.map((id) => ({ id })),
      chosen,
      direction,
    ).map((e) => e.id);
  if (step === "reset") return { front, back };
  if (step === "front") return { front: [...front, ...ids], back };
  if (step === "back") return { front, back: [...ids, ...back] };
  if (step === "forward")
    return { front: [...ordered(bands.front, step), ...(moved ? [] : free)], back };
  return { front, back: [...(moved ? [] : free), ...ordered(bands.back, step)] };
}

/** The storeys after a step, and whether anything changed. */
function planned(project: Project, targets: readonly ElementTarget[], step: DisplayOrder) {
  const chosen = new Set(targets.map((t) => t.id));
  let changed = false;
  const storeys = project.storeys.map((storey) => {
    let next = storey;
    let moved = false;
    const banded: string[] = [];
    const known = new Set<string>();
    for (const kind of elementKinds) {
      const list = storeyElements(storey, kind) as readonly { id: string }[];
      if (BAND_KINDS.has(kind)) for (const e of list) known.add(e.id);
      if (!list.some((e) => chosen.has(e.id))) continue;
      if (BAND_KINDS.has(kind))
        banded.push(...list.filter((e) => chosen.has(e.id)).map((e) => e.id));
      if (step === "reset") continue;
      const ordered = reorder(list, chosen, step);
      if (ordered.every((e, i) => e === list[i])) continue;
      moved = true;
      next = { ...next, [ELEMENT_KINDS[kind].list]: ordered };
    }
    const stored = storey.displayBands;
    const current = {
      front: (stored?.front ?? []).filter((id) => known.has(id)),
      back: (stored?.back ?? []).filter((id) => known.has(id)),
    };
    const bands = banded.length ? nextBands(current, banded, step, moved) : current;
    const bandsChanged = !same(bands.front, current.front) || !same(bands.back, current.back);
    if (moved || bandsChanged) changed = true;
    if (!bandsChanged) return next;
    const { displayBands: _old, ...rest } = next;
    return bands.front.length || bands.back.length ? { ...rest, displayBands: bands } : rest;
  });
  return { storeys, changed };
}

/**
 * Display order (K2, K3). Within a kind the plan draws in stored order, so moving an element in
 * its list puts it above or below others of that kind. "Ganz nach vorne/hinten" also lifts it
 * above or below all kinds (storey.displayBands); one step goes on within the kind and at its
 * end into the band, and out of the opposite band. One checked change, one undo step; unchanged
 * when nothing can move.
 */
export function changeDisplayOrder(
  project: Project,
  targets: readonly ElementTarget[],
  step: DisplayOrder,
): Project {
  const { storeys, changed } = planned(project, targets, step);
  return changed ? validateLike(project, { ...project, storeys }) : project;
}

/** Whether a step would change anything (to grey out menu entries); no model check, cheap. */
export function canChangeDisplayOrder(
  project: Project,
  targets: readonly ElementTarget[],
  step: DisplayOrder,
): boolean {
  return targets.length > 0 && planned(project, targets, step).changed;
}
