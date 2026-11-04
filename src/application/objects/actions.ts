import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { objectDefaults, type PlacedObject } from "../../domain/elements/object/model.ts";

type ObjectCreation = Pick<PlacedObject, "id" | "catalogId" | "position"> &
  Partial<Omit<PlacedObject, "id" | "catalogId" | "position">>;

/** The standard Möblierung layer; objects use it unless a layer is chosen
 * (docs/OBJEKTBIBLIOTHEK.md). */
export function defaultObjectLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "furniture");
  if (!id) throw new Error("Die Standardebene Möblierung fehlt.");
  return id;
}

/** Shared object creation for tool, text and future AI adapters; missing values take the
 * catalogue size, no rotation, on the floor. Full validation, own snapshot. */
export function addObject(project: Project, object: ObjectCreation): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      objects: [
        ...(storeyOf(project).objects ?? []),
        {
          ...objectDefaults(object.catalogId),
          ...object,
          layerId: object.layerId ?? defaultObjectLayerId(project),
        },
      ],
    }),
  });
}

/** One checked change of a placed object. */
export function updateObject(
  project: Project,
  objectId: string,
  changes: Partial<Omit<PlacedObject, "id">>,
): Project {
  const objects = storeyOf(project).objects ?? [];
  if (!objects.some((o) => o.id === objectId)) throw new Error(`Unbekanntes Objekt: ${objectId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      objects: objects.map((o) => (o.id === objectId ? { ...o, ...changes, id: o.id } : o)),
    }),
  });
}
