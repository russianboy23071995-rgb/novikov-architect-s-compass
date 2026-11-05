import { z } from "zod";
import { WALL_RENOVATIONS } from "../wall/renovation.ts";
import { wallTopBindingSchema } from "../wall/height-binding.ts";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();

/** Segments of a round column outline in plan and 3D; IFC keeps the exact circle profile. */
export const COLUMN_CIRCLE_SEGMENTS = 32;

export const columnShapeSchema = z.discriminatedUnion("kind", [
  z
    .object({ kind: z.literal("rectangle"), width: finite.positive(), depth: finite.positive() })
    .strict(),
  z.object({ kind: z.literal("circle"), diameter: finite.positive() }).strict(),
]);
export type ColumnShape = z.infer<typeof columnShapeSchema>;

/**
 * Column (schema 37, docs/STUETZEN.md, L05). `position` is the centre in plan; `rotation` in
 * degrees turns a rectangular section counterclockwise. Heights relative to the own storey
 * floor: foot at `baseOffset`; the top is either bound to the storey like a wall (OK raw floor
 * above + `topBinding.topOffset`) or a fixed `height` above the foot. `renovation` as for walls
 * (absent = Bestand).
 */
export const columnSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    position: point,
    shape: columnShapeSchema,
    rotation: finite,
    baseOffset: finite,
    height: finite.positive().optional(),
    topBinding: wallTopBindingSchema.optional(),
    renovation: z.enum(WALL_RENOVATIONS).optional(),
  })
  .strict()
  .refine(
    (c) => (c.height === undefined) !== (c.topBinding === undefined),
    "Eine Stütze hat entweder eine feste Höhe oder eine Geschossbindung.",
  );
export type Column = z.infer<typeof columnSchema>;

export const COLUMN_DEFAULTS = {
  rectangle: { kind: "rectangle", width: 0.3, depth: 0.3 },
  circle: { kind: "circle", diameter: 0.3 },
} as const satisfies Record<string, ColumnShape>;

/** Foot and top relative to the storey floor; null while a bound top meets an unknown height. */
export function columnLevels(
  column: Pick<Column, "baseOffset" | "height" | "topBinding">,
  storeyHeight: number | null,
): { bottom: number; top: number } | null {
  const bottom = column.baseOffset;
  if (column.topBinding) {
    if (storeyHeight === null) return null;
    return { bottom, top: storeyHeight + column.topBinding.topOffset };
  }
  return { bottom, top: bottom + column.height! };
}

/** Outline in plan, counterclockwise; a circle as a regular polygon. */
export function columnOutline(
  column: Pick<Column, "position" | "shape" | "rotation">,
): { x: number; y: number }[] {
  const { x, y } = column.position;
  if (column.shape.kind === "circle") {
    const r = column.shape.diameter / 2;
    return Array.from({ length: COLUMN_CIRCLE_SEGMENTS }, (_, i) => {
      const a = (2 * Math.PI * i) / COLUMN_CIRCLE_SEGMENTS;
      return { x: x + r * Math.cos(a), y: y + r * Math.sin(a) };
    });
  }
  const w = column.shape.width / 2,
    d = column.shape.depth / 2;
  const angle = (column.rotation * Math.PI) / 180;
  const cos = Math.cos(angle),
    sin = Math.sin(angle);
  return [
    [-w, -d],
    [w, -d],
    [w, d],
    [-w, d],
  ].map(([u, v]) => ({ x: x + u! * cos - v! * sin, y: y + u! * sin + v! * cos }));
}
