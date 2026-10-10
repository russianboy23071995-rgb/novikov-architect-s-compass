import type { DocumentFraming } from "../../domain/views/documents.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import type { DocumentIdentity } from "../../domain/views/scale.ts";
import { projectScaleContext } from "./project-scale.ts";
export type DocumentAction =
  | {
      kind: "create";
      id: string;
      modelViewId: string;
      name: string;
      denominator: number;
      framing?: DocumentFraming;
      folderId?: string;
    }
  | { kind: "create-folder"; id: string; name: string }
  | { kind: "rename-folder"; id: string; name: string }
  | { kind: "rename"; id: string; name: string }
  | { kind: "scale"; id: string; denominator: number }
  | { kind: "assign-folder"; id: string; folderId: string | null }
  | { kind: "delete"; id: string };

export function drawingDocument(project: Project, id: string) {
  const document = project.drawingDocuments?.find((d) => d.id === id);
  if (!document) throw new Error("Das Abbild existiert nicht mehr.");
  return document;
}
/** Shared validated operation for UI and future text/voice adapters. IDs are caller supplied. */
export function changeDrawingDocument(
  base: Project,
  current: Project,
  action: DocumentAction,
): Project {
  if (base !== current) throw new Error("Das Projekt wurde geändert. Abbildaktion erneut starten.");
  const documents = current.drawingDocuments ?? [];
  if (action.kind === "create-folder")
    return validateProject({
      ...current,
      documentFolders: [...(current.documentFolders ?? []), { id: action.id, name: action.name }],
    });
  if (action.kind === "rename-folder") {
    if (!current.documentFolders?.some((f) => f.id === action.id))
      throw new Error("Der Abbildordner fehlt.");
    return validateProject({
      ...current,
      documentFolders: current.documentFolders.map((f) =>
        f.id === action.id ? { ...f, name: action.name } : f,
      ),
    });
  }
  if (action.kind === "create") {
    const existing = current.modelViews?.find(
      (v) => v.kind === "floor-plan" && v.storeyId === current.storey.id,
    );
    const source = existing ?? {
      id: action.modelViewId,
      kind: "floor-plan" as const,
      storeyId: current.storey.id,
    };
    return validateProject({
      ...current,
      modelViews: existing ? current.modelViews : [...(current.modelViews ?? []), source],
      drawingDocuments: [
        ...documents,
        {
          id: action.id,
          name: action.name,
          modelViewId: source.id,
          denominator: action.denominator,
          hiddenLayerIds: [...current.bimVisibility.hiddenLayerIds],
          ...(action.framing ? { framing: action.framing } : {}),
          ...(action.folderId ? { folderId: action.folderId } : {}),
        },
      ],
    });
  }
  const target = drawingDocument(current, action.id);
  if (action.kind === "assign-folder") {
    if (action.folderId !== null && !current.documentFolders?.some((f) => f.id === action.folderId))
      throw new Error("Der Abbildordner fehlt.");
    return validateProject({
      ...current,
      drawingDocuments: documents.map((d) => {
        if (d.id !== target.id) return d;
        const { folderId: _old, ...document } = d;
        return action.folderId === null ? document : { ...document, folderId: action.folderId };
      }),
    });
  }
  if (action.kind === "delete")
    return validateProject({
      ...current,
      drawingDocuments: documents.filter((d) => d.id !== target.id),
    });
  if (action.kind !== "rename" && action.kind !== "scale")
    throw new Error("Unbekannte Abbildaktion.");
  return validateProject({
    ...current,
    drawingDocuments: documents.map((d) =>
      d.id !== target.id
        ? d
        : {
            ...d,
            ...(action.kind === "rename"
              ? { name: action.name }
              : { denominator: action.denominator }),
          },
    ),
  });
}
export function documentBinding(project: Project, id: string): DocumentIdentity {
  drawingDocument(project, id);
  return { kind: "drawing-document", projectId: project.id, documentId: id };
}
export function newDocumentScale(project: Project) {
  return projectScaleContext(project).denominator;
}
