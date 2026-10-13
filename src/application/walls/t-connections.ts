import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { TJunction } from "../../domain/elements/wall/t-relations.ts";
import { commitProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";

export type TConnectionRequest = {
  projectId: string;
  kind: "connect" | "disconnect";
  relation: TJunction;
};

/** Shared snapshot-bound action for mouse and future text/voice adapters. */
export function previewTConnection(
  base: Project,
  current: Project,
  request: TConnectionRequest,
): Project {
  if (base !== current || request.projectId !== current.id)
    throw new Error("Das Projekt wurde geändert. Anschluss erneut beginnen.");
  const project = validateProject(current);
  const relations = storeyOf(project).wallTJunctions;
  const match = relations.findIndex(
    (r) =>
      r.hostWallId === request.relation.hostWallId &&
      r.incoming.wallId === request.relation.incoming.wallId &&
      r.incoming.endpoint === request.relation.incoming.endpoint,
  );
  if (request.kind === "disconnect" && match < 0)
    throw new Error("Die T-Verbindung existiert nicht mehr.");
  return validateProject({
    ...replaceStorey(project, {
      ...storeyOf(project),
      wallTJunctions:
        request.kind === "connect"
          ? [...relations, request.relation]
          : relations.filter((_, i) => i !== match),
    }),
  });
}

export function commitTConnection(
  history: ProjectHistory,
  base: Project,
  request: TConnectionRequest,
): ProjectHistory {
  return commitProject(history, previewTConnection(base, history.present, request));
}
