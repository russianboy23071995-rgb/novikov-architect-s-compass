import { editAnchor, editAtPointer } from "../../lib/bim/direct-edit.ts";
import type { EditAction, EditSession, EditTarget } from "../../lib/bim/direct-edit.ts";
import { commitProject, createHistory, redoProject, undoProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";
import type { Point, Project } from "../../lib/bim/model.ts";

export type EditingState = {
  history: ProjectHistory;
  session: EditSession | null;
  error: string;
};

export type EditingEvent =
  | { type: "begin"; target: EditTarget; action: EditAction; index: number | null; anchor?: Point }
  | { type: "confirm"; session: EditSession; selection: EditTarget | null; point: Point }
  | { type: "cancel" }
  | { type: "project"; project: Project }
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
export function editingReducer(state: EditingState, event: EditingEvent): EditingState {
  if (event.type === "cancel")
    return state.session || state.error ? { ...state, session: null, error: "" } : state;
  try {
    switch (event.type) {
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
