import { changeLayerVisibility, emptyVisibilityHistory } from "../layers/visibility-actions.ts";
import type { VisibilityHistory, VisibilityAction } from "../layers/visibility-actions.ts";
import { editAnchor, editAtPointer } from "../../lib/bim/direct-edit.ts";
import type { EditAction, EditSession, EditTarget } from "../../lib/bim/direct-edit.ts";
import { commitProject, createHistory, redoProject, undoProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { commitLayerAssignment, commitLayerManagement } from "../layers/actions.ts";
import type { ManageLayerRequest } from "../layers/actions.ts";
import { selectedLayerElement } from "../layers/selection.ts";

export type EditingState = {
  history: ProjectHistory;
  visibilityHistory?: VisibilityHistory;
  session: EditSession | null;
  error: string;
};

/** Current horizontal 3D edit capabilities; geometry/axis rules remain in the shared adapters. */
export function supportsWallWorkplaneEdit(
  target: EditTarget,
  action: EditAction,
  index: number | null,
): boolean {
  if (target.kind !== "wall") return false;
  if (action === "point" || action === "stretch") return index === 0 || index === 1;
  return ["move", "axis", "x", "y"].includes(action);
}

type ModelEditingEvent =
  | { type: "begin"; target: EditTarget; action: EditAction; index: number | null; anchor?: Point }
  | { type: "confirm"; session: EditSession; selection: EditTarget | null; point: Point }
  | { type: "cancel" }
  | { type: "project"; project: Project }
  | { type: "manage-layer"; base: Project; request: ManageLayerRequest }
  | {
      type: "assign-layer";
      base: Project;
      target: EditTarget;
      selection: EditTarget | null;
      layerId: string;
    }
  | { type: "undo" | "redo" };

export function createEditingState(project: Project): EditingState {
  return { history: createHistory(project), session: null, error: "" };
}

/** Derived preview only: no history entry and no mutation of the pinned model. */
export function previewEdit(
  session: EditSession,
  project: Project,
  selection: EditTarget | null,
  point: Point,
): Project {
  if (selection?.id !== session.target.id || selection?.kind !== session.target.kind)
    throw new Error("Die Auswahl wurde geändert. Bearbeitung erneut starten.");
  return editAtPointer(session, project, point);
}

/** Pure application transition. React only dispatches user intent. */
function reduceModelEdit(state: EditingState, event: ModelEditingEvent): EditingState {
  if (event.type === "cancel")
    return state.session || state.error ? { ...state, session: null, error: "" } : state;
  try {
    switch (event.type) {
      case "manage-layer":
        return {
          history: commitLayerManagement(state.history, event.base, event.request),
          session: null,
          error: "",
        };
      case "assign-layer": {
        if (
          event.selection?.id !== event.target.id ||
          event.selection.kind !== event.target.kind ||
          !selectedLayerElement(state.history.present, event.target)
        )
          throw new Error("Die Auswahl wurde geändert. Ebenenzuordnung erneut beginnen.");
        const history = commitLayerAssignment(state.history, event.base, {
          projectId: event.base.id,
          elementIds: [event.target.id],
          layerId: event.layerId,
        });
        // Discard a pending geometric preview; never commit it together with membership.
        return { history, session: null, error: "" };
      }
      case "begin": {
        const fallback = editAnchor(state.history.present, event.target);
        const session: EditSession = {
          base: state.history.present,
          target: { ...event.target },
          action: event.action,
          index: event.index,
          anchor: { ...(event.anchor ?? fallback) },
        };
        // Validate the target, grip and anchor before entering the interaction.
        previewEdit(session, state.history.present, event.target, session.anchor);
        return { ...state, session, error: "" };
      }
      case "confirm": {
        if (!state.session || state.session !== event.session)
          throw new Error("Diese Bearbeitung ist nicht mehr aktiv.");
        const next = previewEdit(
          state.session,
          state.history.present,
          event.selection,
          event.point,
        );
        return { history: commitProject(state.history, next), session: null, error: "" };
      }
      case "project":
        return { history: commitProject(state.history, event.project), session: null, error: "" };
      case "undo":
      case "redo":
        return {
          history: event.type === "undo" ? undoProject(state.history) : redoProject(state.history),
          session: null,
          error: "",
        };
    }
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : "Bearbeitung konnte nicht übernommen werden.",
    };
  }
}

export type EditingEvent =
  | ModelEditingEvent
  | { type: "visibility"; base: Project; action: VisibilityAction }
  | { type: "load-project"; project: Project };
export function editingReducer(state: EditingState, event: EditingEvent): EditingState {
  if (event.type === "load-project")
    return {
      ...reduceModelEdit(state, { type: "project", project: event.project }),
      visibilityHistory: emptyVisibilityHistory(),
    };
  if (event.type !== "visibility")
    return {
      ...reduceModelEdit(state, event),
      ...(state.visibilityHistory ? { visibilityHistory: state.visibilityHistory } : {}),
    };
  try {
    const next = changeLayerVisibility(
      event.base,
      state.history.present,
      state.visibilityHistory ?? emptyVisibilityHistory(),
      event.action,
    );
    if (next.project === state.history.present) return state;
    return {
      history: { ...state.history, present: next.project },
      visibilityHistory: next.history,
      session: null,
      error: "",
    };
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : "Sichtbarkeit konnte nicht geändert werden.",
    };
  }
}
