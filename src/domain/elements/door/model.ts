import { z } from "zod";
import { wallBase } from "../wall/heights.ts";

const id = z.string().trim().min(1);
const positive = z.number().finite().positive();
/** Position number of a window or door, e.g. "T-EG-01" (schema 28, user decision 25.10.2026). */
export const openingMarkSchema = z.string().trim().min(1).max(32);

/** Single-leaf hinged door hosted in one wall (user decision 24.10.2026).
 * width/height: structural opening in the wall (Rohbaumaß), metres.
 * position: centre of the opening from wall.start (0) to wall.end (1).
 * zOffset: underside relative to the storey level (Geschoss-OK), metres.
 * hinge: jamb carrying the hinges, at the wall's start or end side of the opening.
 * opensTo: side of the wall axis the leaf swings into, seen along wall.start → wall.end.
 * Plan and 3D symbols are derived only; no presentation geometry is stored.
 */
export const doorSchema = z
  .object({
    id,
    wallId: id,
    layerId: id,
    width: positive,
    height: positive,
    position: z.number().finite().min(0).max(1),
    zOffset: z.number().finite(),
    hinge: z.enum(["start", "end"]),
    opensTo: z.enum(["left", "right"]),
    mark: openingMarkSchema.optional(),
  })
  .strict();
/** Schema 27 doors carried no position number. */
export const doorV27Schema = doorSchema.omit({ mark: true });
export type Door = z.infer<typeof doorSchema>;

/** Baurichtmaß nach DIN 18100 as the default structural opening (user decision 24.10.2026). */
export const DOOR_DEFAULTS = {
  width: 1.01,
  height: 2.135,
  zOffset: 0,
  hinge: "start",
  opensTo: "left",
} as const satisfies Partial<Door>;

/** The shared wall-opening view of a door: underside measured from the host wall's base. */
export function doorOpening(door: Door, wall: { baseOffset?: number | undefined }) {
  return {
    id: door.id,
    wallId: door.wallId,
    width: door.width,
    height: door.height,
    position: door.position,
    sillHeight: door.zOffset - wallBase(wall),
  };
}

export type DinHand = "links" | "rechts";

/** DIN 107 handing, derived only: seen from the side the leaf opens toward (the swing side),
 * hinges on the left make a "DIN links" door. Facing the wall from the left of the wall
 * direction, the wall end lies to the viewer's left; from the right side, the wall start.
 */
export function doorDinHand(door: Pick<Door, "hinge" | "opensTo">): DinHand {
  return (door.hinge === "end") === (door.opensTo === "left") ? "links" : "rechts";
}

/** Set a DIN handing (user decision 24.10.2026): the swing side stays, the hinge jamb moves. */
export function doorHingeForDinHand(door: Pick<Door, "opensTo">, hand: DinHand): Door["hinge"] {
  return (hand === "links") === (door.opensTo === "left") ? "end" : "start";
}
