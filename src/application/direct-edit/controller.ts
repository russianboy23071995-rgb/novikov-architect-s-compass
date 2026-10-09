import { prepareEndpoint } from "./prepared-endpoint.ts";
import { resolveProjectHatchPatterns } from "../hatches/pattern-resolution.ts";
import {
  validatePatternRevisions,
  type PatternRevision,
} from "../../domain/elements/hatch/revision.ts";
import { connectSnappedT } from "../walls/t-axis-snap.ts";
import type { SnapCandidate } from "../../constraints/snapping/engine.ts";
import { commitWallOffset, type WallOffsetRequest } from "../walls/body-offset.ts";
import type { ElementTarget } from "../selection/target.ts";
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
  | {
      type: "confirm";
      session: EditSession;
      selection: ElementTarget | null;
      point: Point;
      candidate?: SnapCandidate | null | undefined;
    }
  | {
      type: "wall-offset";
      base: Project;
      selection: ElementTarget | null;
      request: WallOffsetRequest;
    }
  | { type: "cancel" }
  | { type: "project"; project: Project }
  | { type: "manage-layer"; base: Project; request: ManageLayerRequest }
  | {
      type: "assign-layer";
      base: Project;
      target: ElementTarget;
      selection: ElementTarget | null;
      layerId: string;
    }
  | { type: "undo" | "redo" };

export function createEditingState(project: Project): EditingState {
  return { history: createHistory(project), session: null, error: "" };
}

const endpointPreviews = new WeakMap<EditSession, ReturnType<typeof prepareEndpoint>>();
/** Derived preview only: no history entry and no mutation of the pinned model. */
export function previewEdit(
  session: EditSession,
  project: Project,
  selection: ElementTarget | null,
  point: Point,
  candidate?: SnapCandidate | null,
): Project {
  if (selection?.id !== session.target.id || selection?.kind !== session.target.kind)
    throw new Error("Die Auswahl wurde geändert. Bearbeitung erneut starten.");
  if (project !== session.base)
    throw new Error("Das Modell wurde geändert. Bearbeitung erneut starten.");
  const wall =
    session.target.kind === "wall"
      ? project.storey.walls.find((w) => w.id === session.target.id)
      : undefined;
  if (
    wall &&
    session.action === "point" &&
    session.index === 1 &&
    session.anchor.x === wall.end.x &&
    session.anchor.y === wall.end.y &&
    project.storey.wallTJunctions.some((t) => t.hostWallId === wall.id)
  ) {
    let prepared = endpointPreviews.get(session);
    if (!prepared) {
      prepared = prepareEndpoint(project, wall.id);
      endpointPreviews.set(session, prepared);
    }
    return connectSnappedT(session, prepared.evaluate(point).project, point, candidate);
  }
  return connectSnappedT(session, editAtPointer(session, project, point), point, candidate);
}

/** Confirmation never trusts the prepared preview. */
function fullEdit(
  session: EditSession,
  project: Project,
  selection: ElementTarget | null,
  point: Point,
  candidate?: SnapCandidate | null,
): Project {
  if (selection?.id !== session.target.id || selection?.kind !== session.target.kind)
    throw new Error("Die Auswahl wurde geändert. Bearbeitung erneut starten.");
  return connectSnappedT(session, editAtPointer(session, project, point), point, candidate);
}

/** Pure application transition. React only dispatches user intent. */
function reduceModelEdit(state: EditingState, event: ModelEditingEvent): EditingState {
  if (event.type === "cancel")
    return state.session || state.error ? { ...state, session: null, error: "" } : state;
  try {
    switch (event.type) {
      case "wall-offset":
        return {
          history: commitWallOffset(state.history, event.base, event.selection, event.request),
          session: null,
          error: "",
        };
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
        const next = fullEdit(
          state.session,
          state.history.present,
          event.selection,
          event.point,
          event.candidate,
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

type BaseEditingEvent =
  | ModelEditingEvent
  | { type: "visibility"; base: Project; action: VisibilityAction }
  | { type: "load-project"; project: Project }
  | { type: "patterns-changed" };
export type EditingEvent = BaseEditingEvent & {
  patternRecords?: readonly PatternRevision[];
  patternLibraryError?: string;
};

/** Storage is read by the adapter before dispatch; the reducer stays deterministic. */
export function editingReducer(state: EditingState, event: EditingEvent): EditingState {
  if (event.type === "patterns-changed") {
    try {
      const result = resolveProjectHatchPatterns(
        state.history.present,
        state.history.present,
        event.patternRecords ?? [],
      );
      const error = result.conflicts.length
        ? `Musterkonflikt: ${result.conflicts.join(", ")}. Eingebettete Darstellung erhalten.`
        : (event.patternLibraryError ?? "");
      if (result.project === state.history.present)
        return error === state.error ? state : { ...state, error };
      return {
        ...state,
        history: { ...state.history, present: result.project },
        session: null,
        error,
      };
    } catch (error) {
      return {
        ...state,
        error: error instanceof Error ? error.message : "Musterabgleich fehlgeschlagen.",
      };
    }
  }
  const restore = event.type === "undo" || event.type === "redo";
  const incoming = event.type === "project" || event.type === "load-project";
  if ((!restore && !incoming) || event.patternRecords === undefined)
    return reduceEditing(state, event);
  try {
    const snapshot = incoming
      ? event.project
      : (event.type === "undo" ? undoProject(state.history) : redoProject(state.history)).present;
    const catalog = new Map(
      validatePatternRevisions(event.patternRecords).map((r) => [r.definition.id, r]),
    );
    // A missing/older library must not rewind a newer definition already known by this project.
    if (restore && snapshot.id === state.history.present.id)
      for (const definition of state.history.present.hatchPatterns) {
        const revision = definition.revision,
          known = catalog.get(definition.id);
        if (revision !== undefined && (!known || known.revision < revision))
          catalog.set(definition.id, { definition, revision });
      }
    const resolution = resolveProjectHatchPatterns(snapshot, snapshot, [...catalog.values()]);
    const next = reduceEditing(state, incoming ? { ...event, project: resolution.project } : event);
    if (next.error) return next;
    return {
      ...next,
      history: { ...next.history, present: resolution.project },
      error: resolution.conflicts.length
        ? `Musterkonflikt: ${resolution.conflicts.join(", ")}. Eingebettete Darstellung erhalten.`
        : (event.patternLibraryError ?? ""),
    };
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : "Musterabgleich fehlgeschlagen.",
    };
  }
}

function reduceEditing(
  state: EditingState,
  event: Exclude<BaseEditingEvent, { type: "patterns-changed" }>,
): EditingState {
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
