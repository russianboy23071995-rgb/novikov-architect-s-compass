import { z } from "zod";
import { validateSimplePolygon } from "../../../geometry/polygons/simple-polygon.ts";
import { triangulateSimplePolygon } from "../../../geometry/polygons/triangulate.ts";
import { contains } from "../../../geometry/polygons/contains.ts";
import { heightLineListSchema } from "./height-line.ts";

/** Schema 33 limits of the former numeric height lines (migration only). */
const V33_MAX_LINES = 5;

export const MAX_ROOM_POINTS = 10000;
/** Room numbers R-001, R-002 … (N32); the stable internal id stays separate. */
export const ROOM_NUMBER = /^R-(\d{3,})$/;

/**
 * Room of a storey (schema 32, height lines 33/34; docs/ROOM_ELEMENT.md, user decisions 29.10.2026).
 * points: simple outline in model metres, any winding, no holes yet.
 * name: free text, may be empty. number: user-facing number, unique in the project
 * (trimmed, case-insensitive); new rooms get the next R-### automatically.
 * floorBuildUp: optional floor build-up above the raw floor in metres; absent = none.
 * The room stores no height: clear heights are derived from the storey, slabs and roofs (R3).
 */
const roomShape = {
  id: z.string().trim().min(1),
  layerId: z.string().trim().min(1),
  points: z
    .array(z.object({ x: z.number().finite(), y: z.number().finite() }).strict())
    .min(3)
    .max(MAX_ROOM_POINTS),
  name: z.string().max(120),
  number: z.string().trim().min(1).max(40),
  floorBuildUp: z.number().finite().min(0).max(2).optional(),
};
function refineOutline(room: { points: { x: number; y: number }[] }, ctx: z.RefinementCtx) {
  const result = validateSimplePolygon(room.points);
  if (!result.valid)
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["points"],
      message: `Ungültiger Raumumriss: ${result.reason} (${result.indices.join(", ")})`,
    });
}
/** Room of schema 32 (without height lines); only for reading older files. */
export const roomV32Schema = z.object(roomShape).strict().superRefine(refineOutline);
/** Room of schema 33: heightLines as clear heights in metres (R3); only for reading. */
export const roomV33Schema = z
  .object({
    ...roomShape,
    heightLines: z
      .array(z.number().finite().min(0.1).max(10))
      .max(V33_MAX_LINES)
      .refine((lines) => lines.every((h, i) => i === 0 || h > lines[i - 1]!), {
        message: "Höhenlinien müssen aufsteigend und verschieden sein.",
      })
      .optional(),
  })
  .strict()
  .superRefine(refineOutline);
/** heightLines (schema 34, R3b): each line with height, colour, line style and its lower and
 * upper reference; absent = the defaults 1,00/2,00 m clear height, empty = no lines. */
const roomV64Shape = { ...roomShape, heightLines: heightLineListSchema.optional() };
/** Room of schemas 34 to 64 (without living area data); only for reading. */
export const roomV64Schema = z.object(roomV64Shape).strict().superRefine(refineOutline);

/** How a room counts for the living area (docs/WOHNFLAECHE.md, WoFlV § 2 and § 4). */
export const ROOM_AREA_USES = ["living", "unheated", "outdoor", "none"] as const;
export type RoomAreaUse = (typeof ROOM_AREA_USES)[number];
/** WoFlV § 4 Nr. 4: as a rule a quarter, at most a half. */
export const OUTDOOR_SHARE = 0.25;
export const MAX_OUTDOOR_SHARE = 0.5;
/**
 * Schema 65, absent = a living room without corrections. outdoorShare only for "outdoor", absent =
 * a quarter. corrections: entered areas in m² with their reason, deductions negative.
 */
export const roomLivingAreaSchema = z
  .object({
    use: z.enum(ROOM_AREA_USES),
    outdoorShare: z.number().finite().min(0).max(MAX_OUTDOOR_SHARE).optional(),
    corrections: z
      .array(
        z
          .object({
            note: z.string().trim().min(1).max(120),
            area: z.number().finite().min(-10000).max(10000),
          })
          .strict(),
      )
      .max(100)
      .optional(),
  })
  .strict();
export type RoomLivingArea = z.infer<typeof roomLivingAreaSchema>;
export const roomSchema = z
  .object({ ...roomV64Shape, livingArea: roomLivingAreaSchema.optional() })
  .strict()
  .superRefine(refineOutline);
export type Room = z.infer<typeof roomSchema>;

/** The stored form: nothing where the defaults apply, so untouched rooms stay as they are. */
export function compactLivingArea(value: RoomLivingArea): RoomLivingArea | undefined {
  const corrections = value.corrections?.length ? { corrections: value.corrections } : {};
  const share =
    value.use === "outdoor" &&
    value.outdoorShare !== undefined &&
    value.outdoorShare !== OUTDOOR_SHARE
      ? { outdoorShare: value.outdoorShare }
      : {};
  if (value.use === "living" && !value.corrections?.length) return undefined;
  return { use: value.use, ...share, ...corrections };
}

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

/** Point for the room stamp: the area centroid, or for outlines whose centroid lies outside
 * (L and U shapes) the centroid of the largest ear triangle. */
export function roomLabelPoint(points: readonly { x: number; y: number }[]): {
  x: number;
  y: number;
} {
  let a = 0,
    cx = 0,
    cy = 0;
  for (let i = 0; i < points.length; i++) {
    const p = points[i]!,
      q = points[(i + 1) % points.length]!;
    const cross = p.x * q.y - q.x * p.y;
    a += cross;
    cx += (p.x + q.x) * cross;
    cy += (p.y + q.y) * cross;
  }
  const centroid = { x: cx / (3 * a), y: cy / (3 * a) };
  if (a !== 0 && contains(points, centroid)) return centroid;
  let best = { x: points[0]!.x, y: points[0]!.y },
    bestArea = -1;
  for (const [i, j, k] of triangulateSimplePolygon(points)) {
    const [p, q, r] = [points[i]!, points[j]!, points[k]!];
    const area = Math.abs((q.x - p.x) * (r.y - p.y) - (r.x - p.x) * (q.y - p.y));
    if (area > bestArea) {
      bestArea = area;
      best = { x: (p.x + q.x + r.x) / 3, y: (p.y + q.y + r.y) / 3 };
    }
  }
  return best;
}
