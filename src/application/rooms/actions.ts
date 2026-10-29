import { storeyOf, replaceStorey } from "../../domain/storeys/access.ts";
import { standardLayerId } from "../../domain/layers/model.ts";
import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import { nextRoomNumber, type Room } from "../../domain/elements/room/model.ts";

type RoomCreation = Omit<Room, "layerId" | "number" | "name"> & {
  layerId?: string;
  number?: string;
  name?: string;
};

/** The standard Raum layer; rooms use it unless a layer is chosen explicitly (N38). */
export function defaultRoomLayerId(project: Project): string {
  const id = standardLayerId(project.layers, "room");
  if (!id) throw new Error("Die Standardebene Raum fehlt.");
  return id;
}

/** Next free room number of the whole project (R-001, R-002 …). */
export function nextProjectRoomNumber(project: Project): string {
  return nextRoomNumber(project.storeys.flatMap((s) => s.rooms ?? []));
}

/** Shared room creation for tool, text and future AI adapters; full validation, own snapshot.
 * Without a number the next free R-### is used; without a name the name stays empty. */
export function addRoom(project: Project, room: RoomCreation): Project {
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      rooms: [
        ...(storeyOf(project).rooms ?? []),
        {
          ...room,
          name: room.name ?? "",
          number: room.number ?? nextProjectRoomNumber(project),
          layerId: room.layerId ?? defaultRoomLayerId(project),
        },
      ],
    }),
  });
}

/** One checked change of a room; a removed floor build-up is passed as `floorBuildUp: undefined`. */
export function updateRoom(
  project: Project,
  roomId: string,
  changes: Partial<Omit<Room, "id">>,
): Project {
  const rooms = storeyOf(project).rooms ?? [];
  if (!rooms.some((room) => room.id === roomId)) throw new Error(`Unbekannter Raum: ${roomId}`);
  return validateLike(project, {
    ...replaceStorey(project, {
      ...storeyOf(project),
      rooms: rooms.map((room) => {
        if (room.id !== roomId) return room;
        const next = { ...room, ...changes, id: room.id };
        // Absent means no build-up; an explicit undefined removes it.
        if ("floorBuildUp" in changes && changes.floorBuildUp === undefined)
          delete next.floorBuildUp;
        return next;
      }),
    }),
  });
}
