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
      hiddenLayerIds?: string[];
    }
  | { kind: "create-folder"; id: string; name: string }
  | { kind: "rename-folder"; id: string; name: string }
  | { kind: "rename"; id: string; name: string }
  | { kind: "scale"; id: string; denominator: number }
  | { kind: "assign-folder"; id: string; folderId: string | null }
  | { kind: "delete-folder"; id: string }
  | { kind: "settings"; id: string; name: string; denominator: number; folderId: string | null }
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
  if (
    (action.kind === "rename-folder" || action.kind === "delete-folder") &&
    current.documentFolders?.some((f) => f.id === action.id && f.name === "Abbildsammlung")
  )
    throw new Error("Die Standard-Abbildsammlung bleibt erhalten und kann nicht umbenannt werden.");
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
  if (action.kind === "delete-folder") {
    if (!current.documentFolders?.some((f) => f.id === action.id))
      throw new Error("Der Abbildordner fehlt.");
    if (documents.some((d) => d.folderId === action.id))
      throw new Error("Bitte die Abbilder zuerst aus dem Ordner verschieben.");
    return validateProject({
      ...current,
      documentFolders: current.documentFolders.filter((f) => f.id !== action.id),
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
          hiddenLayerIds: [...(action.hiddenLayerIds ?? current.bimVisibility.hiddenLayerIds)],
          ...(action.framing ? { framing: action.framing } : {}),
          ...(action.folderId ? { folderId: action.folderId } : {}),
        },
      ],
    });
  }
  const target = drawingDocument(current, action.id);
  if (action.kind === "assign-folder" || action.kind === "settings") {
    if (action.folderId !== null && !current.documentFolders?.some((f) => f.id === action.folderId))
      throw new Error("Der Abbildordner fehlt.");
    return validateProject({
      ...current,
      drawingDocuments: documents.map((d) => {
        if (d.id !== target.id) return d;
        const { folderId: _old, ...original } = d;
        const document =
          action.kind === "settings"
            ? { ...original, name: action.name, denominator: action.denominator }
            : original;
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

/** Initialize the application's document directory without changing legacy file parsing. */
export function ensureDocumentFolder(project: Project): Project {
  if (project.documentFolders?.some((f) => f.name === "Abbildsammlung")) return project;
  const previous = project.documentFolders?.find(
    (f) => /^document-folder-default(?:-1)*$/.test(f.id) && f.name === "Abbilder",
  );
  if (previous)
    return changeDrawingDocument(project, project, {
      kind: "rename-folder",
      id: previous.id,
      name: "Abbildsammlung",
    });
  const ids = new Set<string>();
  const collect = (value: unknown): void => {
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if (key === "id" && typeof child === "string") ids.add(child);
      else collect(child);
    }
  };
  collect(project);
  let id = "document-folder-default";
  while (ids.has(id)) id += "-1";
  return changeDrawingDocument(project, project, {
    kind: "create-folder",
    id,
    name: "Abbildsammlung",
  });
}
