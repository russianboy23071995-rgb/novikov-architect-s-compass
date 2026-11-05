import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Dimension } from "../../domain/elements/dimension/model.ts";

/** The standard Bemaßung layer; chains use it unless a layer is chosen (docs/MASSKETTE.md). */
export function defaultDimensionLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "dimension");
  if (!id) throw new Error("Die Standardebene Bemaßung fehlt.");
  return id;
}

/** Shared chain creation for tool and future AI adapters; full validation, own snapshot. */
export function addDimension(
  project: Project,
  dimension: Omit<Dimension, "layerId"> & { layerId?: string },
): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      dimensions: [
        ...(storeyOf(project).dimensions ?? []),
        { ...dimension, layerId: dimension.layerId ?? defaultDimensionLayerId(project) },
      ],
    }),
  });
}

/** One checked change of a chain (direction, line position, points, layer). */
export function updateDimension(
  project: Project,
  dimensionId: string,
  changes: Partial<Omit<Dimension, "id">>,
): Project {
  const dimensions = storeyOf(project).dimensions ?? [];
  if (!dimensions.some((d) => d.id === dimensionId))
    throw new Error(`Unbekannte Maßkette: ${dimensionId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      dimensions: dimensions.map((d) =>
        d.id === dimensionId ? { ...d, ...changes, id: d.id } : d,
      ),
    }),
  });
}
