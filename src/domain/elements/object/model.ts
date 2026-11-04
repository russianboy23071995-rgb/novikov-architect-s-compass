import { z } from "zod";
import { WALL_RENOVATIONS } from "../wall/renovation.ts";
import {
  OBJECT_CATALOG_IDS,
  objectDefinition,
  type ObjectBox,
  type ObjectCatalogId,
} from "./catalog.ts";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();

export const OBJECT_SIZE = { min: 0.1, max: 10 } as const;
export const OBJECT_HEIGHT = { min: 0.02, max: 5 } as const;
export const OBJECT_BASE_OFFSET = { min: -2, max: 5 } as const;

/**
 * Placed object (Objekt, schema 57, docs/OBJEKTBIBLIOTHEK.md, L44): one entry of the object
 * catalogue at `position` (centre of its box in plan), turned counterclockwise by `rotation`
 * degrees and, with `mirrored`, flipped across its depth axis. `width` runs across, `depth`
 * from front to back, `height` up from `baseOffset` above the storey floor. `renovation` as
 * for walls (absent = Bestand).
 */
export const objectSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    catalogId: z.enum(OBJECT_CATALOG_IDS),
    position: point,
    rotation: finite,
    mirrored: z.boolean().optional(),
    width: finite.min(OBJECT_SIZE.min).max(OBJECT_SIZE.max),
    depth: finite.min(OBJECT_SIZE.min).max(OBJECT_SIZE.max),
    height: finite.min(OBJECT_HEIGHT.min).max(OBJECT_HEIGHT.max),
    baseOffset: finite.min(OBJECT_BASE_OFFSET.min).max(OBJECT_BASE_OFFSET.max),
    renovation: z.enum(WALL_RENOVATIONS).optional(),
  })
  .strict();
export type PlacedObject = z.infer<typeof objectSchema>;

type Placement = Pick<PlacedObject, "position" | "rotation" | "mirrored" | "width" | "depth">;

/** Plan point of a unit point (u across, v front to back) of the object's box. */
export function objectPoint(o: Placement, u: number, v: number): { x: number; y: number } {
  const a = (o.rotation * Math.PI) / 180;
  const x = (o.mirrored ? -u : u) * o.width,
    y = v * o.depth;
  return {
    x: o.position.x + x * Math.cos(a) - y * Math.sin(a),
    y: o.position.y + x * Math.sin(a) + y * Math.cos(a),
  };
}

/** Outline of the object's box in plan, counterclockwise. */
export function objectOutline(o: Placement): { x: number; y: number }[] {
  const ring = [
    objectPoint(o, -0.5, -0.5),
    objectPoint(o, 0.5, -0.5),
    objectPoint(o, 0.5, 0.5),
    objectPoint(o, -0.5, 0.5),
  ];
  return o.mirrored ? ring.reverse() : ring;
}

/** Segments of an ellipse in the plan symbol. */
export const OBJECT_ELLIPSE_SEGMENTS = 24;

/** The plan symbol as polylines in plan coordinates. */
export function objectSymbol(
  o: Placement & Pick<PlacedObject, "catalogId">,
): { points: { x: number; y: number }[]; closed: boolean }[] {
  return objectDefinition(o.catalogId).symbol.map((part) => {
    if (part.kind === "poly")
      return {
        points: part.points.map(([u, v]) => objectPoint(o, u, v)),
        closed: !!part.closed,
      };
    const [cu, cv] = part.centre,
      [ru, rv] = part.radius;
    return {
      points: Array.from({ length: OBJECT_ELLIPSE_SEGMENTS }, (_, i) => {
        const t = (2 * Math.PI * i) / OBJECT_ELLIPSE_SEGMENTS;
        return objectPoint(o, cu + ru * Math.cos(t), cv + rv * Math.sin(t));
      }),
      closed: true,
    };
  });
}

/** The catalogue boxes in plan corners (counterclockwise) with bottom and top relative to the
 * storey floor. */
export function objectBoxes(
  o: Placement & Pick<PlacedObject, "catalogId" | "height" | "baseOffset">,
): { corners: { x: number; y: number }[]; bottom: number; top: number; box: ObjectBox }[] {
  return objectDefinition(o.catalogId).boxes.map((box) => {
    const [u0, u1, v0, v1, z0, z1] = box;
    const ring = [
      objectPoint(o, u0, v0),
      objectPoint(o, u1, v0),
      objectPoint(o, u1, v1),
      objectPoint(o, u0, v1),
    ];
    return {
      corners: o.mirrored ? ring.reverse() : ring,
      bottom: o.baseOffset + z0 * o.height,
      top: o.baseOffset + z1 * o.height,
      box,
    };
  });
}

/** Start values of a catalogue object at a point: its catalogue size, not turned, on the floor. */
export function objectDefaults(catalogId: ObjectCatalogId) {
  const { width, depth, height } = objectDefinition(catalogId).size;
  return { catalogId, rotation: 0, width, depth, height, baseOffset: 0 };
}
