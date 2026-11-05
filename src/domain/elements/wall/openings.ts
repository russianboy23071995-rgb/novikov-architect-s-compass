import type { BimWindow, Wall } from "../../project/schema.ts";
import { doorOpening, type Door } from "../door/model.ts";

/** What wall solids and joint rules read from any opening hosted in a wall.
 * sillHeight is the underside above the host wall's base.
 */
export type WallOpening = Pick<BimWindow, "id" | "wallId" | "width" | "height" | "position"> & {
  sillHeight: number;
};

type OpeningStorey = {
  walls: readonly Wall[];
  windows: readonly BimWindow[];
  doors?: readonly Door[] | undefined;
};

/** Windows and doors of one storey as wall openings, for every shared wall rule.
 * Without doors the windows array itself is returned, so existing derivations stay identical.
 */
export function storeyOpenings(storey: OpeningStorey): readonly WallOpening[] {
  const doors = storey.doors ?? [];
  if (!doors.length) return storey.windows;
  const walls = new Map(storey.walls.map((w) => [w.id, w]));
  return [
    ...storey.windows,
    ...doors.map((door) => {
      const wall = walls.get(door.wallId);
      if (!wall) throw new Error(`Tür ${door.id}: unbekannte Wand ${door.wallId}.`);
      return doorOpening(door, wall);
    }),
  ];
}

/** Doors are named as doors in shared opening errors; windows keep their existing wording. */
export function openingNoun(storey: OpeningStorey, openingId: string): "Fenster" | "Tür" {
  return storey.doors?.some((d) => d.id === openingId) ? "Tür" : "Fenster";
}
