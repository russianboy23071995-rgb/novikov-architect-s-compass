import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { slabOpeningProblem, type SlabOpening } from "../../domain/elements/slab/opening.ts";
import { defaultSlabLayerId } from "./actions.ts";

type SlabOpeningCreation = Omit<SlabOpening, "layerId" | "slabId"> & {
  layerId?: string;
  slabId?: string;
};

/** The slab of the working storey that holds the outline, or null (docs/DECKENDURCHBRUCH.md). */
export function hostSlabId(
  project: Project,
  shape: Pick<SlabOpening, "points" | "circle">,
): string | null {
  const probe = { id: "neu", ...shape };
  return (
    (storeyOf(project).slabs ?? []).find((slab) => !slabOpeningProblem(slab, [probe]))?.id ?? null
  );
}

/**
 * Shared creation of a Deckendurchbruch for tool, text and future AI adapters (L40). Without a
 * given slab, the slab of the working storey that holds the outline is taken. Standard layer
 * Decke; full validation (inside the slab, no overlap with its other openings), own snapshot.
 */
export function addSlabOpening(project: Project, opening: SlabOpeningCreation): Project {
  const slabId = opening.slabId ?? hostSlabId(project, opening);
  if (!slabId) throw new Error("Ein Deckendurchbruch muss ganz in einer Decke liegen.");
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      slabOpenings: [
        ...(storeyOf(project).slabOpenings ?? []),
        { ...opening, slabId, layerId: opening.layerId ?? defaultSlabLayerId(project) },
      ],
    }),
  });
}

/** Outline or layer changes; the opening stays in its slab. */
export function updateSlabOpening(
  project: Project,
  openingId: string,
  changes: Partial<Omit<SlabOpening, "id" | "slabId">>,
): Project {
  const openings = storeyOf(project).slabOpenings ?? [];
  if (!openings.some((o) => o.id === openingId))
    throw new Error(`Unbekannter Deckendurchbruch: ${openingId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      slabOpenings: openings.map((o) => (o.id === openingId ? { ...o, ...changes, id: o.id } : o)),
    }),
  });
}
