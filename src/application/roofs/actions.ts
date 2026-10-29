import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Roof } from "../../domain/elements/roof/model.ts";

type RoofCreation = Omit<Roof, "layerId"> & { layerId?: string };

/** The standard Dach layer; roofs use it unless a layer is chosen explicitly. */
export function defaultRoofLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "roof");
  if (!id) throw new Error("Die Standardebene Dach fehlt.");
  return id;
}

/** Shared roof creation for tool, text and future AI adapters; full validation, own snapshot. */
export function addRoof(project: Project, roof: RoofCreation): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      roofs: [
        ...(storeyOf(project).roofs ?? []),
        { ...roof, layerId: roof.layerId ?? defaultRoofLayerId(project) },
      ],
    }),
  });
}

/** One checked change of any roof values; an invalid combination leaves the project as it was. */
export function updateRoof(
  project: Project,
  roofId: string,
  changes: Partial<Omit<Roof, "id">>,
): Project {
  const roofs = storeyOf(project).roofs ?? [];
  if (!roofs.some((roof) => roof.id === roofId)) throw new Error(`Unbekanntes Dach: ${roofId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      roofs: roofs.map((roof) =>
        roof.id === roofId ? { ...roof, ...changes, id: roof.id } : roof,
      ),
    }),
  });
}
