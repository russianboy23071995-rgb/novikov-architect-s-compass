import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Slab } from "../../domain/elements/slab/model.ts";

type SlabCreation = Omit<Slab, "layerId"> & { layerId?: string };

/** The standard Decke layer; slabs use it unless a layer is chosen explicitly. */
export function defaultSlabLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "slab");
  if (!id) throw new Error("Die Standardebene Decke fehlt.");
  return id;
}

/** Shared slab creation for tool, text and future AI adapters; full validation, own snapshot. */
export function addSlab(project: Project, slab: SlabCreation): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      slabs: [
        ...(storeyOf(project).slabs ?? []),
        { ...slab, layerId: slab.layerId ?? defaultSlabLayerId(project) },
      ],
    }),
  });
}

/** Thickness changes keep the top (the slab's reference) and move the underside. */
export function updateSlab(
  project: Project,
  slabId: string,
  changes: Partial<Omit<Slab, "id">>,
): Project {
  const slabs = storeyOf(project).slabs ?? [];
  if (!slabs.some((slab) => slab.id === slabId)) throw new Error(`Unbekannte Decke: ${slabId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      slabs: slabs.map((slab) =>
        slab.id === slabId ? { ...slab, ...changes, id: slab.id } : slab,
      ),
    }),
  });
}
