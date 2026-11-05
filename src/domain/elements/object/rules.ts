import { z } from "zod";
import type { ObjectCatalogId } from "./catalog.ts";

/**
 * Build rules of library objects (docs/OBJEKTBIBLIOTHEK.md, M2). A rule turns the sizes and
 * options of an object into named parts in metres, instead of stretching unit boxes: legs and
 * panels keep their thickness, chairs follow the table. Every part is a convex outline with a
 * lower and an upper edge; the 3D body, the plan symbol, the preview and IFC all come from it.
 * Local axes: x across the width, y from front to back, origin in the middle of the box, z up
 * from the object's foot.
 */
export const TABLE_TOPS = ["rectangle", "rounded", "oval"] as const;
export const TABLE_TOP_LABELS: Record<(typeof TABLE_TOPS)[number], string> = {
  rectangle: "Eckig",
  rounded: "Abgerundet",
  oval: "Oval",
};
/** Most chairs one table may carry. */
export const MAX_TABLE_CHAIRS = 40;

export const objectOptionsSchema = z
  .object({
    /** Plan shape of a table top; absent = rectangle. */
    tableTop: z.enum(TABLE_TOPS).optional(),
    /** Corner radius of a rounded top in metres. */
    cornerRadius: z.number().finite().min(0.01).max(1).optional(),
    /** Chairs at a table: `auto` follows the length, a number is fixed; absent = none. */
    chairs: z.union([z.literal("auto"), z.number().int().min(0).max(MAX_TABLE_CHAIRS)]).optional(),
    /** Chairs also at both ends of the table. */
    headChairs: z.boolean().optional(),
  })
  .strict();
export type ObjectOptions = z.infer<typeof objectOptionsSchema>;

/** Colour or material of the named parts of an object. */
export const OBJECT_SLOT_LABELS = {
  top: "Platte",
  frame: "Gestell",
  seat: "Polster",
} as const;
export type ObjectSlot = keyof typeof OBJECT_SLOT_LABELS;
const finishSchema = z
  .object({
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    /** The material it was taken from; its colour stays as chosen when the library changes. */
    materialId: z.string().trim().min(1).optional(),
  })
  .strict();
export type ObjectFinish = z.infer<typeof finishSchema>;
export const objectFinishesSchema = z
  .object({
    top: finishSchema.optional(),
    frame: finishSchema.optional(),
    seat: finishSchema.optional(),
  })
  .strict();
export type ObjectFinishes = z.infer<typeof objectFinishesSchema>;

type P = { x: number; y: number };
export type ObjectPart = { slot: ObjectSlot; ring: P[]; bottom: number; top: number };
export type ObjectLine = { points: P[]; closed: boolean };
export type ObjectShape = { parts: ObjectPart[]; lines: ObjectLine[] };
type Sized = { width: number; depth: number; height: number; options?: ObjectOptions | undefined };
type Rule = {
  /** Named parts of this object in display order. */
  slots: readonly ObjectSlot[];
  /** Colours while no finish is chosen. */
  colors: Partial<Record<ObjectSlot, string>>;
  /** Options a newly placed object starts with. */
  options: ObjectOptions;
  shape: (o: Sized) => ObjectShape;
};

/** Counterclockwise rectangle around (cx, cy). */
const box = (w: number, d: number, cx = 0, cy = 0): P[] => [
  { x: cx - w / 2, y: cy - d / 2 },
  { x: cx + w / 2, y: cy - d / 2 },
  { x: cx + w / 2, y: cy + d / 2 },
  { x: cx - w / 2, y: cy + d / 2 },
];
/** Counterclockwise rectangle with arcs of `steps` segments in its corners. */
function rounded(w: number, d: number, radius: number, cx = 0, cy = 0, steps = 5): P[] {
  const r = Math.min(radius, w / 2, d / 2);
  if (r <= 1e-6) return box(w, d, cx, cy);
  const corners: [number, number, number][] = [
    [w / 2 - r, -d / 2 + r, -90],
    [w / 2 - r, d / 2 - r, 0],
    [-w / 2 + r, d / 2 - r, 90],
    [-w / 2 + r, -d / 2 + r, 180],
  ];
  return corners.flatMap(([x, y, start]) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const a = ((start + (90 * i) / steps) * Math.PI) / 180;
      return { x: cx + x + r * Math.cos(a), y: cy + y + r * Math.sin(a) };
    }),
  );
}
/** Counterclockwise ellipse. */
const ellipse = (rx: number, ry: number, cx = 0, cy = 0, steps = 32): P[] =>
  Array.from({ length: steps }, (_, i) => {
    const a = (2 * Math.PI * i) / steps;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
/** A local shape turned by `degrees` and moved; used for the chairs around a table. */
function placed(shape: ObjectShape, degrees: number, dx: number, dy: number): ObjectShape {
  const a = (degrees * Math.PI) / 180,
    c = Math.round(Math.cos(a) * 1e12) / 1e12,
    s = Math.round(Math.sin(a) * 1e12) / 1e12;
  const at = (p: P) => ({ x: dx + p.x * c - p.y * s, y: dy + p.x * s + p.y * c });
  return {
    parts: shape.parts.map((part) => ({ ...part, ring: part.ring.map(at) })),
    lines: shape.lines.map((line) => ({ ...line, points: line.points.map(at) })),
  };
}

/** A chair with its back towards +y: seat, four round legs and a back with rounded ends. */
function chairShape({ width: w, depth: d, height: h }: Sized): ObjectShape {
  const seatTop = Math.min(0.46, h * 0.55);
  const seatUnder = seatTop - Math.min(0.04, seatTop * 0.2);
  const seat = rounded(w, d - 0.02, 0.05, 0, -0.01);
  const leg = Math.min(0.0175, w / 8, d / 8);
  const lx = w / 2 - 0.035,
    ly = d / 2 - 0.035;
  const backDepth = Math.min(0.025, d / 4);
  const back = rounded(w * 0.92, backDepth, backDepth / 2, 0, d / 2 - backDepth / 2, 3);
  return {
    parts: [
      { slot: "seat", ring: seat, bottom: seatUnder, top: seatTop },
      ...[
        [-lx, -ly],
        [lx, -ly],
        [lx, ly],
        [-lx, ly],
      ].map(([x, y]) => ({
        slot: "frame" as const,
        ring: ellipse(leg, leg, x, y, 10),
        bottom: 0,
        top: seatUnder,
      })),
      { slot: "frame", ring: back, bottom: seatTop, top: h },
    ],
    lines: [
      { points: seat, closed: true },
      { points: back, closed: true },
    ],
  };
}

/** Standard chair at a table. */
const TABLE_CHAIR = { width: 0.45, depth: 0.5, height: 0.85 };
/** Space per chair along a table side, and the least to have at all. */
const CHAIR_PITCH = 0.6;
const CHAIR_MIN_PITCH = 0.47;
/** Free gap between table edge and chair. */
const CHAIR_GAP = 0.02;

/** Chairs per long side and at the ends for the given options. */
export function tableChairCounts(o: Pick<Sized, "width" | "depth" | "options">) {
  const wanted = o.options?.chairs;
  const ends = o.options?.headChairs && o.depth >= CHAIR_MIN_PITCH ? 2 : 0;
  const most = Math.floor(o.width / CHAIR_MIN_PITCH);
  if (wanted === undefined || wanted === 0) return { front: 0, back: 0, ends: 0 };
  if (wanted === "auto") {
    const side = Math.floor(o.width / CHAIR_PITCH);
    return { front: side, back: side, ends };
  }
  const atEnds = Math.min(ends, wanted);
  const sides = wanted - atEnds;
  return {
    back: Math.min(Math.ceil(sides / 2), most),
    front: Math.min(Math.floor(sides / 2), most),
    ends: atEnds,
  };
}
/** How many chairs a table really shows. */
export function tableChairTotal(o: Pick<Sized, "width" | "depth" | "options">) {
  const { front, back, ends } = tableChairCounts(o);
  return front + back + ends;
}

function tableShape(o: Sized): ObjectShape {
  const { width: w, depth: d, height: h } = o;
  const kind = o.options?.tableTop ?? "rectangle";
  const top =
    kind === "oval"
      ? ellipse(w / 2, d / 2)
      : kind === "rounded"
        ? rounded(w, d, o.options?.cornerRadius ?? 0.08, 0, 0, 6)
        : box(w, d);
  const under = h - Math.min(0.035, h * 0.2);
  const leg = Math.min(0.07, w / 6, d / 6);
  // Legs stay a fixed distance inside the edge; on an oval they move in with the curve.
  const lx = kind === "oval" ? w * 0.3 : w / 2 - leg / 2 - 0.05,
    ly = kind === "oval" ? d * 0.3 : d / 2 - leg / 2 - 0.05;
  const legs: ObjectPart[] = [
    [-lx, -ly],
    [lx, -ly],
    [lx, ly],
    [-lx, ly],
  ].map(([x, y]) => ({
    slot: "frame",
    ring: rounded(leg, leg, leg / 4, x, y, 2),
    bottom: 0,
    top: under,
  }));
  const shape: ObjectShape = {
    parts: [{ slot: "top", ring: top, bottom: under, top: h }, ...legs],
    lines: [{ points: top, closed: true }],
  };
  const chair = chairShape({ ...TABLE_CHAIR });
  /** Half the table depth at x: an oval's edge curves away from the chairs. */
  const edge = (x: number) =>
    kind === "oval" ? (d / 2) * Math.sqrt(Math.max(0, 1 - (x / (w / 2)) ** 2)) : d / 2;
  const away = TABLE_CHAIR.depth / 2 + CHAIR_GAP;
  const { front, back, ends } = tableChairCounts(o);
  const row = (n: number) => Array.from({ length: n }, (_, i) => (w * (i + 0.5)) / n - w / 2);
  const chairs = [
    ...row(back).map((x) => placed(chair, 0, x, edge(x) + away)),
    ...row(front).map((x) => placed(chair, 180, x, -edge(x) - away)),
    ...(ends >= 1 ? [placed(chair, -90, w / 2 + away, 0)] : []),
    ...(ends >= 2 ? [placed(chair, 90, -w / 2 - away, 0)] : []),
  ];
  return {
    parts: [...shape.parts, ...chairs.flatMap((c) => c.parts)],
    lines: [...shape.lines, ...chairs.flatMap((c) => c.lines)],
  };
}

const RULES: Partial<Record<ObjectCatalogId, Rule>> = {
  chair: {
    slots: ["frame", "seat"],
    colors: { frame: "#7d6248", seat: "#8f9aa6" },
    options: {},
    shape: chairShape,
  },
  table: {
    slots: ["top", "frame", "seat"],
    colors: { top: "#c9a77c", frame: "#7d6248", seat: "#8f9aa6" },
    options: { tableTop: "rectangle", chairs: "auto" },
    shape: tableShape,
  },
};

/** The build rule of a catalogue entry; entries without one keep their unit boxes. */
export function objectRule(catalogId: ObjectCatalogId): Rule | undefined {
  return RULES[catalogId];
}
