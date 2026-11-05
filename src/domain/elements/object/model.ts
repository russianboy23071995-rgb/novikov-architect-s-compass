import { z } from "zod";
import { contains } from "../../../geometry/polygons/contains.ts";
import { WALL_RENOVATIONS } from "../wall/renovation.ts";
import {
  OBJECT_CATALOG_IDS,
  OBJECT_CATALOG_IDS_V59,
  objectDefinition,
  type ObjectBox,
  type ObjectCatalogId,
} from "./catalog.ts";
import {
  objectFinishesSchema,
  objectFinishesV59Schema,
  objectOptionsSchema,
  objectOptionsV59Schema,
  objectRule,
  type ObjectShape,
  type ObjectSlot,
} from "./rules.ts";

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
export const objectV58Schema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    catalogId: z.enum(OBJECT_CATALOG_IDS_V59),
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
/** Schema 59: options and finishes of objects with a build rule (docs/OBJEKTBIBLIOTHEK.md, M2). */
export const objectV59Schema = objectV58Schema.extend({
  options: objectOptionsV59Schema.optional(),
  finishes: objectFinishesV59Schema.optional(),
});
/** Schema 60: car and television with their options and parts (docs/OBJEKTBIBLIOTHEK.md, M3). */
export const objectSchema = objectV59Schema.extend({
  catalogId: z.enum(OBJECT_CATALOG_IDS),
  options: objectOptionsSchema.optional(),
  finishes: objectFinishesSchema.optional(),
});
export type PlacedObject = z.infer<typeof objectSchema>;

type Placement = Pick<PlacedObject, "position" | "rotation" | "mirrored" | "width" | "depth">;
type Shaped = Placement & Pick<PlacedObject, "catalogId" | "height" | "options">;

/** The local shape of an object with a build rule (docs/OBJEKTBIBLIOTHEK.md, M2). */
function ruledShape(o: Shaped): ObjectShape | null {
  return objectRule(o.catalogId)?.shape(o) ?? null;
}
/** A local point in metres at its place in plan. */
function localPoint(o: Placement, p: { x: number; y: number }) {
  const a = (o.rotation * Math.PI) / 180;
  const x = o.mirrored ? -p.x : p.x;
  return {
    x: o.position.x + x * Math.cos(a) - p.y * Math.sin(a),
    y: o.position.y + x * Math.sin(a) + p.y * Math.cos(a),
  };
}

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
export function objectOutline(
  o: Placement & Partial<Pick<PlacedObject, "catalogId" | "height" | "options">>,
): { x: number; y: number }[] {
  // With a build rule the rectangle around all parts: the chairs of a table count too.
  const shape =
    o.catalogId !== undefined
      ? ruledShape({ ...o, catalogId: o.catalogId, height: o.height ?? 1 })
      : null;
  if (shape) {
    const local = shape.parts.flatMap((part) => part.ring);
    const xs = [...local.map((p) => p.x), -o.width / 2, o.width / 2],
      ys = [...local.map((p) => p.y), -o.depth / 2, o.depth / 2];
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(...ys),
      y1 = Math.max(...ys);
    const corners = [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
    ].map((p) => localPoint(o, p));
    return o.mirrored ? corners.reverse() : corners;
  }
  const ring = [
    objectPoint(o, -0.5, -0.5),
    objectPoint(o, 0.5, -0.5),
    objectPoint(o, 0.5, 0.5),
    objectPoint(o, -0.5, 0.5),
  ];
  return o.mirrored ? ring.reverse() : ring;
}

/**
 * Pick area of an object in plan (docs/ANPASSUNGSLISTE.md, 1): with a build rule the outlines of
 * its parts, those lying inside a larger part left out, so the gaps between chairs select nothing
 * and the seams between cushions do; otherwise its box.
 */
export function objectPickRings(
  o: Placement &
    Pick<PlacedObject, "catalogId"> &
    Partial<Pick<PlacedObject, "height" | "options">>,
): { x: number; y: number }[][] {
  const shape = ruledShape({ ...o, height: o.height ?? 1 });
  if (!shape) return [objectOutline(o)];
  const area = (ring: readonly { x: number; y: number }[]) =>
    Math.abs(
      ring.reduce((sum, p, i) => {
        const q = ring[(i + 1) % ring.length]!;
        return sum + p.x * q.y - q.x * p.y;
      }, 0),
    );
  const kept: { x: number; y: number }[][] = [];
  for (const { ring } of [...shape.parts].sort((a, b) => area(b.ring) - area(a.ring)))
    if (!kept.some((big) => ring.every((p) => contains(big, p)))) kept.push(ring);
  return kept.map((ring) => ring.map((p) => localPoint(o, p)));
}

/** Segments of an ellipse in the plan symbol. */
export const OBJECT_ELLIPSE_SEGMENTS = 24;

/** The plan symbol as polylines in plan coordinates. */
export function objectSymbol(
  o: Placement &
    Pick<PlacedObject, "catalogId"> &
    Partial<Pick<PlacedObject, "height" | "options">>,
): { points: { x: number; y: number }[]; closed: boolean }[] {
  const shape = ruledShape({ ...o, height: o.height ?? 1 });
  if (shape)
    return shape.lines.map((line) => ({
      closed: line.closed,
      points: line.points.map((p) => localPoint(o, p)),
    }));
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

/** One solid of an object, placed in plan: outline, heights over the storey floor, its colour. */
export type ObjectSolid = {
  ring: { x: number; y: number }[];
  bottom: number;
  top: number;
  color?: string;
};
/** All solids of an object, from its build rule or its catalogue boxes. */
export function objectSolids(
  o: Placement & Pick<PlacedObject, "catalogId" | "height" | "baseOffset" | "options" | "finishes">,
): ObjectSolid[] {
  const shape = ruledShape(o);
  if (!shape)
    return objectBoxes(o).map(({ corners, bottom, top }) => ({ ring: corners, bottom, top }));
  return shape.parts.map((part) => {
    const ring = part.ring.map((p) => localPoint(o, p));
    return {
      ring: o.mirrored ? ring.reverse() : ring,
      bottom: o.baseOffset + part.bottom,
      top: o.baseOffset + part.top,
      color: objectSlotColor(o, part.slot),
    };
  });
}
/** The chosen colour of a named part, else the rule's own. */
export function objectSlotColor(
  o: Pick<PlacedObject, "catalogId" | "finishes">,
  slot: ObjectSlot,
): string {
  return o.finishes?.[slot]?.color ?? objectRule(o.catalogId)?.colors[slot] ?? "#b8bfc9";
}

/** Start values of a catalogue object at a point: its catalogue size, not turned, on the floor. */
export function objectDefaults(catalogId: ObjectCatalogId) {
  const { width, depth, height } = objectDefinition(catalogId).size;
  return { catalogId, rotation: 0, width, depth, height, baseOffset: 0 };
}
