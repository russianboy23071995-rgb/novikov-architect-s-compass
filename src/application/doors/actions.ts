import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import type { Door } from "../../domain/elements/door/model.ts";

type DoorCreation = Omit<Door, "layerId"> & { layerId?: string };

/** The standard Tür layer; doors use it unless a layer is chosen explicitly. */
export function defaultDoorLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "door");
  if (!id) throw new Error("Die Standardebene Tür fehlt.");
  return id;
}

/** Shared door creation for tool, text and future AI adapters; full validation, own snapshot. */
export function addDoor(project: Project, door: DoorCreation): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      doors: [
        ...(storeyOf(project).doors ?? []),
        { ...door, layerId: door.layerId ?? defaultDoorLayerId(project) },
      ],
    }),
  });
}

export function updateDoor(
  project: Project,
  doorId: string,
  changes: Partial<Omit<Door, "id">>,
): Project {
  const doors = storeyOf(project).doors ?? [];
  if (!doors.some((door) => door.id === doorId)) throw new Error(`Unbekannte Tür: ${doorId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      doors: doors.map((door) =>
        door.id === doorId ? { ...door, ...changes, id: door.id } : door,
      ),
    }),
  });
}
