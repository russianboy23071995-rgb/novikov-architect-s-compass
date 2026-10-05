import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Hatch } from "../../domain/elements/hatch/model.ts";
import { commitProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";

export type HatchRequest = { projectId: string } & (
  | { kind: "create"; hatch: Omit<Hatch, "kind" | "layerId"> & { layerId?: string } }
  | { kind: "update"; id: string; changes: Partial<Pick<Hatch, "points" | "fill" | "layerId">> }
);

/** UI and future text/voice adapters share this snapshot-bound preview/commit boundary. */
export function previewHatch(base: Project, current: Project, request: HatchRequest): Project {
  if (base !== current || request.projectId !== current.id)
    throw new Error("Das Projekt wurde geändert. Schraffurvorgang erneut beginnen.");
  const project = validateProject(current);
  const hatches = project.storey.hatches;
  if (request.kind === "update" && !hatches.some((h) => h.id === request.id))
    throw new Error("Die Schraffur existiert nicht mehr.");
  const next = validateProject({
    ...project,
    storey: {
      ...project.storey,
      hatches:
        request.kind === "create"
          ? [...hatches, { layerId: project.defaultLayerIds.line, ...request.hatch, kind: "hatch" }]
          : hatches.map((h) =>
              h.id === request.id ? { ...h, ...request.changes, id: h.id, kind: h.kind } : h,
            ),
    },
  });
  return JSON.stringify(next) === JSON.stringify(project) ? current : next;
}

export function commitHatch(
  history: ProjectHistory,
  base: Project,
  request: HatchRequest,
): ProjectHistory {
  return commitProject(history, previewHatch(base, history.present, request));
}
