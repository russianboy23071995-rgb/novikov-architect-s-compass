import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import { commitProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";

/** IDs, not display names/list positions. Adapters pin the immutable base snapshot. */
export type AssignLayerRequest = {
  projectId: string;
  elementIds: readonly string[];
  layerId: string;
};

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
