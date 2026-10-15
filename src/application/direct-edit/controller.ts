import { preparedProjectPreview } from "./prepared-preview.ts";
import { selectWorkingStorey } from "../storeys/working-storey.ts";
import { changeBuilding, type BuildingChange } from "../storeys/actions.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { setGroundDatum, type SetGroundDatum } from "../storeys/actions.ts";
import { setStoreyHeight, type SetStoreyHeight } from "../storeys/actions.ts";
import { renameStorey, type RenameStorey } from "../storeys/actions.ts";
import { activateDrawnLayers } from "../views/drawing-layer-activation.ts";
import { changeDrawingDocument, type DocumentAction } from "../views/documents.ts";
import type { LayerVisibilityScope } from "../layers/visibility.ts";
import { changeProjectScale } from "../views/project-scale.ts";
import type { WorkingPlanIdentity } from "../../domain/views/scale.ts";
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
import {
  changeLayerVisibility,
  emptyVisibilityHistory,
  documentVisibilityKey,
} from "../layers/visibility-actions.ts";
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
  projectLoad?: { accepted: boolean };
  documentLayerActivation?: { base: Project; documentId: string; layerIds: string[] };
  history: ProjectHistory;
  visibilityHistory?: VisibilityHistory;
  documentVisibilityHistories?: Record<string, VisibilityHistory>;
  session: EditSession | null;
  error: string;
};

/** Current horizontal 3D edit capabilities; geometry/axis rules remain in the shared adapters. */
export function supportsHorizontalWorkplaneEdit(
  target: EditTarget,
  action: EditAction,
  index: number | null,
): boolean {
  if (target.kind === "window") return action === "axis";
  if (target.kind !== "wall") return false;
  if (action === "point" || action === "stretch") return index === 0 || index === 1;
  return ["move", "axis", "x", "y"].includes(action);
}

type ModelEditingEvent =
  | { type: "building"; base: Project; change: BuildingChange }
  | { type: "set-ground-datum"; base: Project; request: SetGroundDatum }
  | { type: "set-storey-height"; base: Project; request: SetStoreyHeight }
  | { type: "rename-storey"; base: Project; request: RenameStorey }
  | { type: "document"; base: Project; action: DocumentAction }
  | { type: "view-scale"; view: WorkingPlanIdentity; denominator: number }
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
  const preparedProject = preparedProjectPreview(session, project, selection, point);
  if (preparedProject) return preparedProject;
  const wall =
    session.target.kind === "wall"
      ? storeyOf(project).walls.find((w) => w.id === session.target.id)
      : undefined;
  if (
    wall &&
    session.action === "point" &&
    (session.index === 0 || session.index === 1) &&
    session.anchor.x === (session.index === 0 ? wall.start.x : wall.end.x) &&
    session.anchor.y === (session.index === 0 ? wall.start.y : wall.end.y)
  ) {
    let prepared = endpointPreviews.get(session);
    if (!prepared) {
      prepared = prepareEndpoint(project, wall.id, session.index);
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
      case "building":
        return {
          ...state,
          history: commitProject(
            state.history,
            changeBuilding(event.base, state.history.present, event.change),
          ),
          session: null,
          error: "",
        };
      case "set-ground-datum":
        return {
          ...state,
          history: commitProject(
            state.history,
            setGroundDatum(event.base, state.history.present, event.request),
          ),
          session: null,
          error: "",
        };
      case "set-storey-height":
        return {
          ...state,
          history: commitProject(
            state.history,
            setStoreyHeight(event.base, state.history.present, event.request),
          ),
          session: null,
          error: "",
        };
      case "rename-storey":
        return {
          ...state,
          history: commitProject(
            state.history,
            renameStorey(event.base, state.history.present, event.request),
          ),
          session: null,
          error: "",
        };
      case "document":
        return {
          ...state,
          history: commitProject(
            state.history,
            changeDrawingDocument(event.base, state.history.present, event.action),
          ),
          session: null,
          error: "",
        };
      case "view-scale": {
        const project = changeProjectScale(state.history.present, event.view, event.denominator);
        if (project === state.history.present) return state;
        return {
          ...state,
          history: commitProject(state.history, project),
          session: null,
          error: "",
        };
      }
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
  | { type: "working-storey"; base: Project; storeyId: string }
  | ModelEditingEvent
  | { type: "visibility"; base: Project; action: VisibilityAction; scope?: LayerVisibilityScope }
  | { type: "load-project"; project: Project }
  | { type: "patterns-changed" };
export type EditingEvent = BaseEditingEvent & {
  patternRecords?: readonly PatternRevision[];
  patternLibraryError?: string;
  drawingDocumentId?: string;
};

/** Storage is read by the adapter before dispatch; the reducer stays deterministic. */
export function editingReducer(state: EditingState, event: EditingEvent): EditingState {
  const next = reduceEditingEvent(state, event);
  // The load token identifies a document session. Ordinary commits/Undo must not erase it.
  return event.type !== "load-project" &&
    state.projectLoad &&
    next.projectLoad !== state.projectLoad
    ? { ...next, projectLoad: state.projectLoad }
    : next;
}
function reduceEditingEvent(state: EditingState, event: EditingEvent): EditingState {
  if (event.type === "working-storey") {
    try {
      return {
        ...state,
        history: {
          ...state.history,
          present: selectWorkingStorey(event.base, state.history.present, event.storeyId),
        },
        session: null,
        error: "",
      };
    } catch (error) {
      return { ...state, error: (error as Error).message };
    }
  }
  if (event.type === "load-project") {
    const { projectLoad: _load, documentLayerActivation: _activation, ...clean } = state;
    const next = reduceWithPatterns(clean, event);
    return { ...next, projectLoad: next.projectLoad ?? { accepted: false } };
  }
  // Tool completion also cancels its transient interaction after committing.
  // Keep the confirmed placement notice through that cleanup.
  if (event.type === "cancel") return reduceWithPatterns(state, event);
  const { documentLayerActivation: _previous, ...rest } = state;
  const clean = state.documentLayerActivation ? rest : state;
  if (event.type !== "project" || !event.drawingDocumentId) return reduceWithPatterns(clean, event);
  try {
    const activation = activateDrawnLayers(
      state.history.present,
      event.project,
      event.drawingDocumentId,
    );
    const next = reduceWithPatterns(clean, { ...event, project: activation.project });
    if (next.error || next.history.present === state.history.present || !activation.layerIds.length)
      return next;
    return {
      ...next,
      documentLayerActivation: {
        base: state.history.present,
        documentId: event.drawingDocumentId,
        layerIds: activation.layerIds,
      },
    };
  } catch (error) {
    return { ...clean, error: (error as Error).message };
  }
}
function reduceWithPatterns(
  state: EditingState,
  event: Exclude<EditingEvent, { type: "working-storey" }>,
): EditingState {
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
  event: Exclude<BaseEditingEvent, { type: "patterns-changed" | "working-storey" }>,
): EditingState {
  if (event.type === "load-project") {
    let next: EditingState;
    try {
      next = {
        ...state,
        history: commitProject(state.history, event.project, { legacyFileOpen: true }),
        session: null,
        error: "",
      };
    } catch (error) {
      return {
        ...state,
        error: error instanceof Error ? error.message : "Projekt konnte nicht geladen werden.",
      };
    }
    return {
      ...next,
      projectLoad: { accepted: true },
      visibilityHistory: emptyVisibilityHistory(),
      documentVisibilityHistories: {},
    };
  }
  if (event.type !== "visibility")
    return {
      ...reduceModelEdit(state, event),
      ...(state.documentVisibilityHistories
        ? { documentVisibilityHistories: state.documentVisibilityHistories }
        : {}),
      ...(state.visibilityHistory ? { visibilityHistory: state.visibilityHistory } : {}),
    };
  try {
    const documentId = event.scope?.kind === "drawing-document" ? event.scope.documentId : null;
    const historyKey = documentId ? documentVisibilityKey(state.history.present, documentId) : null;
    const next = changeLayerVisibility(
      event.base,
      state.history.present,
      (documentId ? state.documentVisibilityHistories?.[historyKey!] : state.visibilityHistory) ??
        emptyVisibilityHistory(),
      event.action,
      event.scope,
    );
    if (next.project === state.history.present) return state;
    return {
      ...state,
      history: { ...state.history, present: next.project },
      ...(documentId
        ? {
            documentVisibilityHistories: {
              ...state.documentVisibilityHistories,
              [historyKey!]: next.history,
            },
          }
        : { visibilityHistory: next.history }),
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
