import { z } from "zod";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";

export const MAX_ROOM_POINTS = 10000;
/** Room numbers R-001, R-002 … (N32); the stable internal id stays separate. */
export const ROOM_NUMBER = /^R-(\d{3,})$/;

/**
 * Room of a storey (schema 32, docs/ROOM_ELEMENT.md, user decisions 29.10.2026).
 * points: simple outline in model metres, any winding, no holes yet.
 * name: free text, may be empty. number: user-facing number, unique in the project
 * (trimmed, case-insensitive); new rooms get the next R-### automatically.
 * floorBuildUp: optional floor build-up above the raw floor in metres; absent = none.
 * The room stores no height: clear heights are derived from the storey, slabs and roofs (R3).
 */
export const roomSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    points: z
      .array(z.object({ x: z.number().finite(), y: z.number().finite() }).strict())
      .min(3)
      .max(MAX_ROOM_POINTS),
    name: z.string().max(120),
    number: z.string().trim().min(1).max(40),
    floorBuildUp: z.number().finite().min(0).max(2).optional(),
  })
  .strict()
  .superRefine((room, ctx) => {
    const result = validateSimplePolygon(room.points);
    if (!result.valid)
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["points"],
        message: `Ungültiger Raumumriss: ${result.reason} (${result.indices.join(", ")})`,
      });
  });
export type Room = z.infer<typeof roomSchema>;

/** Plan area of the outline in square metres (Grundfläche; no WoFlV rules). */
export function roomArea(room: Pick<Room, "points">): number {
  const result = validateSimplePolygon(room.points);
  return result.valid ? Math.abs(result.signedArea) : 0;
}

/** Comparison key of a room number: trimmed, case-insensitive. */
export function roomNumberKey(number: string): string {
  return number.trim().toLocaleUpperCase("de");
}

/** Next free R-### after the highest R-number in the project (R-001 when there is none). */
export function nextRoomNumber(rooms: Iterable<Pick<Room, "number">>): string {
  let highest = 0;
  for (const room of rooms) {
    const match = ROOM_NUMBER.exec(room.number.trim().toUpperCase());
    if (match) highest = Math.max(highest, Number(match[1]));
  }
  return `R-${String(highest + 1).padStart(3, "0")}`;
}
