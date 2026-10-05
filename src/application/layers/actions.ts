import { validateProject } from "../../domain/project/schema.ts";
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
  const project = validateProject(current);
  if (request.kind === "delete") {
    const reason = layerDeletionBlock(project, request.id);
    if (reason) throw new Error(reason);
    return validateProject({
      ...project,
      layers: project.layers.filter((layer) => layer.id !== request.id),
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
  return validateProject({
    ...project,
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
    [...project.storey.walls, ...project.storey.windows, ...(project.storey.lines ?? [])].some(
      (element) => element.layerId === id,
    )
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
  const project = validateProject(current);
  if (!project.layers.some((l) => l.id === request.layerId))
    throw new Error("Die Zielebene existiert nicht.");
  if (!request.elementIds.length) throw new Error("Keine Elemente ausgewählt.");
  const targets = new Set(request.elementIds);
  const elements = [
    ...project.storey.walls,
    ...project.storey.windows,
    ...(project.storey.lines ?? []),
  ];
  const knownIds = new Set(elements.map((e) => e.id));
  if ([...targets].some((id) => !knownIds.has(id)))
    throw new Error("Mindestens ein ausgewähltes Element existiert nicht mehr.");
  if (elements.every((e) => !targets.has(e.id) || e.layerId === request.layerId)) return current;
  const assign = <T extends { id: string; layerId: string }>(e: T): T =>
    targets.has(e.id) ? { ...e, layerId: request.layerId } : e;
  return validateProject({
    ...project,
    storey: {
      ...project.storey,
      walls: project.storey.walls.map(assign),
      windows: project.storey.windows.map(assign),
      ...(project.storey.lines === undefined ? {} : { lines: project.storey.lines.map(assign) }),
    },
  });
}

/** Same action for UI and future Text/Voice adapters; one atomic history step. */
export function commitLayerAssignment(
  history: ProjectHistory,
  base: Project,
  request: AssignLayerRequest,
): ProjectHistory {
  return commitProject(history, previewLayerAssignment(base, history.present, request));
}
