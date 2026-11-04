import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { RAILING_DEFAULTS, type Railing } from "../../domain/elements/railing/model.ts";

type RailingCreation = Pick<Railing, "id" | "points"> & Partial<Omit<Railing, "id" | "points">>;

/** The standard Geländer layer; railings use it unless a layer is chosen (docs/GELAENDER.md). */
export function defaultRailingLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "railing");
  if (!id) throw new Error("Die Standardebene Geländer fehlt.");
  return id;
}

/** Shared railing creation for tool, text and future AI adapters; missing values take the
 * tool start values (1,00 m, posts 1,20 m apart, bars). Full validation, own snapshot. */
export function addRailing(project: Project, railing: RailingCreation): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      railings: [
        ...(storeyOf(project).railings ?? []),
        {
          ...RAILING_DEFAULTS,
          ...railing,
          layerId: railing.layerId ?? defaultRailingLayerId(project),
        },
      ],
    }),
  });
}

/** One checked change of a railing. */
export function updateRailing(
  project: Project,
  railingId: string,
  changes: Partial<Omit<Railing, "id">>,
): Project {
  const railings = storeyOf(project).railings ?? [];
  if (!railings.some((r) => r.id === railingId))
    throw new Error(`Unbekanntes Geländer: ${railingId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      railings: railings.map((r) => (r.id === railingId ? { ...r, ...changes, id: r.id } : r)),
    }),
  });
}
