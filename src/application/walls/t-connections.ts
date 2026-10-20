import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateProject } from "../../domain/project/schema.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { TJunction } from "../../domain/elements/wall/t-relations.ts";
import { commitProject } from "../../lib/bim/history.ts";
import type { ProjectHistory } from "../../lib/bim/history.ts";
import {
  createProjectSnapshot,
  isOwnedProjectSnapshot,
} from "../../domain/project/owned-snapshot.ts";

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
  // Only private factory provenance permits reuse, never caller-side freezing.
  // Mutable public inputs retain their full validation and mutable-copy contract.
  const owned = isOwnedProjectSnapshot(current);
  const project = owned ? current : validateProject(current);
  const relations = storeyOf(project).wallTJunctions;
  const match = relations.findIndex(
    (r) =>
      r.hostWallId === request.relation.hostWallId &&
      r.incoming.wallId === request.relation.incoming.wallId &&
      r.incoming.endpoint === request.relation.incoming.endpoint,
  );
  if (request.kind === "disconnect" && match < 0)
    throw new Error("Die T-Verbindung existiert nicht mehr.");
  const next = {
    ...replaceStorey(project, {
      ...storeyOf(project),
      wallTJunctions:
        request.kind === "connect"
          ? [...relations, request.relation]
          : relations.filter((_, i) => i !== match),
    }),
  };
  // Validate the entire changed model before publishing it. An owned result can
  // then pass the preview boundary without another identical validation.
  return owned ? createProjectSnapshot(next) : validateProject(next);
}

export function commitTConnection(
  history: ProjectHistory,
  base: Project,
  request: TConnectionRequest,
): ProjectHistory {
  return commitProject(history, previewTConnection(base, history.present, request));
}
