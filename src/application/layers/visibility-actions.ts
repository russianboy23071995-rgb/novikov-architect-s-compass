import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { HISTORY_LIMIT } from "../../lib/bim/history.ts";

export type VisibilityHistory = { past: string[][]; future: string[][] };
export type VisibilityAction =
  { kind: "set"; layerId: string; visible: boolean } | { kind: "undo" | "redo" };
export const emptyVisibilityHistory = (): VisibilityHistory => ({ past: [], future: [] });

/** One palette action for UI and future text/voice adapters; no geometry history entry. */
export function changeLayerVisibility(
  base: Project,
  current: Project,
  history: VisibilityHistory,
  action: VisibilityAction,
) {
  if (base !== current) throw new Error("Das Projekt wurde geändert. Sichtbarkeit erneut ändern.");
  validateProject(current);
  const before = current.bimVisibility.hiddenLayerIds;
  let after: string[];
  let nextHistory: VisibilityHistory;
  if (action.kind === "set") {
    if (typeof action.visible !== "boolean" || !current.layers.some((l) => l.id === action.layerId))
      throw new Error("Ungültige Ebene oder Sichtbarkeit.");
    after = action.visible
      ? before.filter((id) => id !== action.layerId)
      : [...new Set([...before, action.layerId])];
    if (JSON.stringify(before) === JSON.stringify(after)) return { project: current, history };
    nextHistory = { past: [...history.past, [...before]].slice(-HISTORY_LIMIT), future: [] };
  } else {
    const stack = action.kind === "undo" ? history.past : history.future;
    const entry = stack.at(-1);
    if (!entry) return { project: current, history };
    const known = new Set(current.layers.map((l) => l.id));
    after = entry.filter((id) => known.has(id));
    nextHistory =
      action.kind === "undo"
        ? {
            past: history.past.slice(0, -1),
            future: [...history.future, [...before]].slice(-HISTORY_LIMIT),
          }
        : {
            past: [...history.past, [...before]].slice(-HISTORY_LIMIT),
            future: history.future.slice(0, -1),
          };
  }
  return {
    project: { ...current, bimVisibility: { hiddenLayerIds: after } },
    history: nextHistory,
  };
}
