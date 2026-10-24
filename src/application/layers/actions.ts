import { allStoreyElements, ELEMENT_KINDS, elementKinds } from "../../domain/elements/registry.ts";
import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateLike, validatedInput } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { commitProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";
import { isStandardLayerId } from "../../domain/layers/model.ts";

/** IDs, not display names/list positions. Adapters pin the immutable base snapshot. */
export type AssignLayerRequest = {
  projectId: string;
  elementIds: readonly string[];
  layerId: string;
};

export type ManageLayerRequest =
  | { kind: "delete"; id: string }
  | { kind: "create"; id: string; name: string }
  | { kind: "rename"; id: string; name: string };

/** Display-name uniqueness is an action rule, not a new file-schema restriction. */
export function previewLayerManagement(
  base: Project,
  current: Project,
  request: ManageLayerRequest,
): Project {
  if (base !== current) throw new Error("Das Projekt wurde geändert. Vorgang erneut beginnen.");
  const project = validatedInput(current);
  if (request.kind === "delete") {
    const reason = layerDeletionBlock(project, request.id);
    if (reason) throw new Error(reason);
    return validateLike(current, {
      ...project,
      layers: project.layers.filter((layer) => layer.id !== request.id),
      ...(project.drawingDocuments
        ? {
            drawingDocuments: project.drawingDocuments.map((d) => ({
              ...d,
              hiddenLayerIds: d.hiddenLayerIds.filter((id) => id !== request.id),
            })),
          }
        : {}),
      bimVisibility: {
        hiddenLayerIds: project.bimVisibility.hiddenLayerIds.filter((id) => id !== request.id),
      },
    });
  }
  if (request.kind === "create" && isStandardLayerId(request.id.trim()))
    throw new Error("Diese Ebenen-ID ist für Standardebenen reserviert.");
  const name = request.name.trim();
  if (!name) throw new Error("Bitte einen Ebenennamen eingeben.");
  const existing = project.layers.find((layer) => layer.id === request.id);
  if (request.kind === "rename" && !existing) throw new Error("Die Ebene existiert nicht mehr.");
  if (request.kind === "rename" && existing!.name === name) return current;
  const comparable = (value: string) => value.normalize("NFC").toLowerCase();
  if (
    project.layers.some(
      (layer) =>
        (request.kind === "create" || layer.id !== request.id) &&
        comparable(layer.name) === comparable(name),
    )
  )
    throw new Error("Dieser Ebenenname ist bereits vergeben.");
  return validateLike(current, {
    ...project,
    ...(request.kind === "create" && project.drawingDocuments
      ? {
          drawingDocuments: project.drawingDocuments.map((d) => ({
            ...d,
            hiddenLayerIds: [...d.hiddenLayerIds, request.id],
          })),
        }
      : {}),
    layers:
      request.kind === "create"
        ? [...project.layers, { id: request.id, name }]
        : project.layers.map((layer) => (layer.id === request.id ? { ...layer, name } : layer)),
  });
}

/** Shared by the UI and the mutation gate; disabling a button alone is not protection. */
export function layerDeletionBlock(project: Project, id: string): string | null {
  if (!project.layers.some((layer) => layer.id === id)) return "Die Ebene existiert nicht mehr.";
  if (isStandardLayerId(id) || Object.values(project.defaultLayerIds).includes(id))
    return "Standardebenen können nicht gelöscht werden.";
  if (
    project.storeys.flatMap((s) => allStoreyElements(s)).some((element) => element.layerId === id)
  )
    return "Diese Ebene enthält Elemente und kann nicht gelöscht werden.";
  return null;
}

export function commitLayerManagement(
  history: ProjectHistory,
  base: Project,
  request: ManageLayerRequest,
): ProjectHistory {
  return commitProject(history, previewLayerManagement(base, history.present, request));
}

export function previewLayerAssignment(
  base: Project,
  current: Project,
  request: AssignLayerRequest,
): Project {
  if (base !== current || request.projectId !== current.id)
    throw new Error("Das Projekt wurde geändert. Ebenenzuordnung erneut beginnen.");
  const project = validatedInput(current);
  if (!project.layers.some((l) => l.id === request.layerId))
    throw new Error("Die Zielebene existiert nicht.");
  if (!request.elementIds.length) throw new Error("Keine Elemente ausgewählt.");
  const targets = new Set(request.elementIds);
  const elements = allStoreyElements(storeyOf(project));
  const knownIds = new Set(elements.map((e) => e.id));
  if ([...targets].some((id) => !knownIds.has(id)))
    throw new Error("Mindestens ein ausgewähltes Element existiert nicht mehr.");
  if (elements.every((e) => !targets.has(e.id) || e.layerId === request.layerId)) return current;
  const assign = <T extends { id: string; layerId: string }>(e: T): T =>
    targets.has(e.id) ? { ...e, layerId: request.layerId } : e;
  const storey = storeyOf(project);
  // Every registered element list is reassigned; absent optional lists stay absent.
  const lists = Object.fromEntries(
    elementKinds
      .map((kind) => ELEMENT_KINDS[kind].list)
      .filter((list) => storey[list] !== undefined)
      .map((list) => [list, (storey[list] as { id: string; layerId: string }[]).map(assign)]),
  );
  return validateLike(current, replaceStorey(project, { ...storey, ...lists }));
}

/** Same action for UI and future Text/Voice adapters; one atomic history step. */
export function commitLayerAssignment(
  history: ProjectHistory,
  base: Project,
  request: AssignLayerRequest,
): ProjectHistory {
  return commitProject(history, previewLayerAssignment(base, history.present, request));
}
