import type { LayerVisibilityScope } from "./visibility.ts";
import { drawingDocument } from "../views/documents.ts";
import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { HISTORY_LIMIT } from "../../lib/bim/history.ts";

export type VisibilityHistory = { past: string[][]; future: string[][] };
export type VisibilityAction =
  | { kind: "set"; layerId: string; visible: boolean }
  | { kind: "hide-selected" | "hide-others"; layerId: string }
  | { kind: "hide-all" | "invert" }
  | { kind: "undo" | "redo" };
export const emptyVisibilityHistory = (): VisibilityHistory => ({ past: [], future: [] });

/** One palette action for UI and future text/voice adapters; no geometry history entry. */
export function changeLayerVisibility(
  base: Project,
  current: Project,
  history: VisibilityHistory,
  action: VisibilityAction,
  scope: LayerVisibilityScope = { kind: "bim-project" },
) {
  if (scope.kind !== "bim-project" && scope.kind !== "drawing-document")
    throw new Error("Unbekannter Sichtbarkeitskontext.");
  if (base !== current) throw new Error("Das Projekt wurde geändert. Sichtbarkeit erneut ändern.");
  validateProject(current);
  const document =
    scope.kind === "drawing-document" ? drawingDocument(current, scope.documentId) : null;
  const before = document ? document.hiddenLayerIds : current.bimVisibility.hiddenLayerIds;
  let after: string[];
  let nextHistory: VisibilityHistory;
  if (action.kind !== "undo" && action.kind !== "redo") {
    const layerIds = current.layers.map((l) => l.id);
    if ("layerId" in action && !layerIds.includes(action.layerId))
      throw new Error("Die ausgewählte Ebene existiert nicht mehr.");
    if (action.kind === "hide-all") after = layerIds;
    else if (action.kind === "invert") after = layerIds.filter((id) => !before.includes(id));
    else if (action.kind === "hide-others") after = layerIds.filter((id) => id !== action.layerId);
    else if (action.kind === "hide-selected") after = [...new Set([...before, action.layerId])];
    else if (action.kind === "set") {
      if (
        typeof action.visible !== "boolean" ||
        !current.layers.some((l) => l.id === action.layerId)
      )
        throw new Error("Ungültige Ebene oder Sichtbarkeit.");
      after = action.visible
        ? before.filter((id) => id !== action.layerId)
        : [...new Set([...before, action.layerId])];
    } else throw new Error("Unbekannte Sichtbarkeitsaktion.");
    if (before.length === after.length && after.every((id) => before.includes(id)))
      return { project: current, history };
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
    project: document
      ? {
          ...current,
          drawingDocuments: current.drawingDocuments!.map((d) =>
            d.id === document.id ? { ...d, hiddenLayerIds: after } : d,
          ),
        }
      : { ...current, bimVisibility: { hiddenLayerIds: after } },
    history: nextHistory,
  };
}

export const documentVisibilityKey = (project: Project, id: string) =>
  JSON.stringify([project.id, id]);
