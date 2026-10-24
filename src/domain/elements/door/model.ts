import { z } from "zod";
import { wallBase } from "../wall/heights.ts";

const id = z.string().trim().min(1);
const positive = z.number().finite().positive();

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
  })
  .strict();
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
