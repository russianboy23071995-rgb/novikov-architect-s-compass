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
export const SOFA_ARMS = ["both", "left", "right", "none"] as const;
export const SOFA_ARM_LABELS: Record<(typeof SOFA_ARMS)[number], string> = {
  both: "Beidseitig",
  left: "Links",
  right: "Rechts",
  none: "Keine",
};
export const TV_MOUNTS = ["stand", "wall"] as const;
export const TV_MOUNT_LABELS: Record<(typeof TV_MOUNTS)[number], string> = {
  stand: "Standfuß",
  wall: "Wand",
};
/** Most chairs one table may carry. */
export const MAX_TABLE_CHAIRS = 40;

export const objectOptionsV59Schema = z
  .object({
    /** Plan shape of a table top; absent = rectangle. */
    tableTop: z.enum(TABLE_TOPS).optional(),
    /** Corner radius of a rounded top in metres. */
    cornerRadius: z.number().finite().min(0.01).max(1).optional(),
    /** Chairs at a table: `auto` follows the length, a number is fixed; absent = none. */
    chairs: z.union([z.literal("auto"), z.number().int().min(0).max(MAX_TABLE_CHAIRS)]).optional(),
    /** Chairs also at both ends of the table. */
    headChairs: z.boolean().optional(),
    /** Armrests of a sofa, seen from the front; absent = both. */
    sofaArms: z.enum(SOFA_ARMS).optional(),
  })
  .strict();
/** Schema 60: how a television stands (docs/OBJEKTBIBLIOTHEK.md, M3); absent = on its foot. */
export const objectOptionsV60Schema = objectOptionsV59Schema.extend({
  tvMount: z.enum(TV_MOUNTS).optional(),
});
/** Most doors or shelves of one piece. */
export const MAX_OBJECT_DIVISIONS = 20;
const divisions = z.union([z.literal("auto"), z.number().int().min(1).max(MAX_OBJECT_DIVISIONS)]);
/** Schema 61 (M4): doors of a cabinet and boards of a shelf; `auto` follows the size. */
export const objectOptionsSchema = objectOptionsV60Schema.extend({
  fronts: divisions.optional(),
  boards: divisions.optional(),
});
export type ObjectOptions = z.infer<typeof objectOptionsSchema>;

/** Colour or material of the named parts of an object. */
export const OBJECT_SLOT_LABELS = {
  top: "Platte",
  body: "Korpus",
  frame: "Gestell",
  seat: "Polster",
  screen: "Bildschirm",
  glass: "Scheiben",
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
export const objectFinishesV59Schema = z
  .object({
    top: finishSchema.optional(),
    body: finishSchema.optional(),
    frame: finishSchema.optional(),
    seat: finishSchema.optional(),
  })
  .strict();
export const objectFinishesSchema = objectFinishesV59Schema.extend({
  screen: finishSchema.optional(),
  glass: finishSchema.optional(),
});
export type ObjectFinishes = z.infer<typeof objectFinishesSchema>;

type P = { x: number; y: number };
export type ObjectPart = { slot: ObjectSlot; ring: P[]; bottom: number; top: number };
export type ObjectLine = { points: P[]; closed: boolean };
export type ObjectShape = { parts: ObjectPart[]; lines: ObjectLine[] };
type Sized = { width: number; depth: number; height: number; options?: ObjectOptions | undefined };
type Rule = {
  /** Named parts of this object in display order. */
  slots: readonly ObjectSlot[];
  /** Names of the parts where this object calls them differently. */
  labels?: Partial<Record<ObjectSlot, string>>;
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

/** Width of one seat of a sofa; the cushions divide the space between the armrests. */
const SOFA_SEAT = 0.7;
const sofaArmWidth = (w: number) => Math.min(0.2, w / 6);
function sofaSpan(o: Pick<Sized, "width" | "options">) {
  const arms = o.options?.sofaArms ?? "both";
  const arm = sofaArmWidth(o.width);
  const left = arms === "both" || arms === "left",
    right = arms === "both" || arms === "right";
  return {
    arm,
    left,
    right,
    from: -o.width / 2 + (left ? arm : 0),
    to: o.width / 2 - (right ? arm : 0),
  };
}
/** Seats a sofa shows: its cushions follow the length. */
export function sofaSeats(o: Pick<Sized, "width" | "options">) {
  const { from, to } = sofaSpan(o);
  return Math.max(1, Math.round((to - from) / SOFA_SEAT));
}

/** A sofa with its back towards +y: base, back, armrests, seat and back cushions, feet. */
function sofaShape(o: Sized): ObjectShape {
  const { width: w, depth: d, height: h } = o;
  const foot = Math.min(0.08, h * 0.1);
  const baseTop = Math.min(0.24, h * 0.3);
  const seatTop = Math.min(0.44, h * 0.55);
  const armTop = Math.min(0.62, h * 0.78);
  const back = Math.min(0.2, d / 4);
  const { arm, left, right, from, to } = sofaSpan(o);
  const base = rounded(w, d, 0.04);
  const backRing = rounded(w, back, back / 3, 0, d / 2 - back / 2);
  const armRing = (x: number) => rounded(arm, d - back, arm / 3, x, -back / 2);
  const arms = [
    ...(left ? [armRing(-w / 2 + arm / 2)] : []),
    ...(right ? [armRing(w / 2 - arm / 2)] : []),
  ];
  const seats = sofaSeats(o);
  const each = (to - from) / seats;
  const centres = Array.from({ length: seats }, (_, i) => from + each * (i + 0.5));
  const gap = Math.min(0.01, each / 8);
  const seatDepth = d - back - gap;
  const backCushion = Math.min(0.14, seatDepth / 3);
  const seatRings = centres.map((x) =>
    rounded(each - gap, seatDepth, 0.04, x, -back / 2 - gap / 2),
  );
  const backRings = centres.map((x) =>
    rounded(each - gap, backCushion, backCushion / 2, x, d / 2 - back - backCushion / 2),
  );
  const fx = w / 2 - 0.07,
    fy = d / 2 - 0.07;
  const r = Math.min(0.025, w / 8, d / 8);
  return {
    parts: [
      ...[
        [-fx, -fy],
        [fx, -fy],
        [fx, fy],
        [-fx, fy],
      ].map(([x, y]) => ({
        slot: "frame" as const,
        ring: ellipse(r, r, x, y, 10),
        bottom: 0,
        top: foot,
      })),
      { slot: "body", ring: base, bottom: foot, top: baseTop },
      { slot: "body", ring: backRing, bottom: baseTop, top: h },
      ...arms.map((ring) => ({ slot: "body" as const, ring, bottom: baseTop, top: armTop })),
      ...seatRings.map((ring) => ({
        slot: "seat" as const,
        ring,
        bottom: baseTop,
        top: seatTop,
      })),
      ...backRings.map((ring) => ({
        slot: "seat" as const,
        ring,
        bottom: seatTop,
        top: Math.max(seatTop, h - 0.04),
      })),
    ],
    lines: [backRing, ...arms, ...seatRings, ...backRings].map((points) => ({
      points,
      closed: true,
    })),
  };
}

/** Parts stacked between two heights: the only way to narrow upwards with upright outlines. */
function slices(
  count: number,
  bottom: number,
  top: number,
  ring: (t: number) => P[],
  slot: ObjectSlot,
): ObjectPart[] {
  const step = (top - bottom) / count;
  return Array.from({ length: count }, (_, i) => ({
    slot,
    ring: ring((i + 0.5) / count),
    bottom: bottom + step * i,
    top: bottom + step * (i + 1),
  }));
}

/**
 * A car driving towards +x, its length across the width: lower body, glass cabin that narrows
 * in steps, roof, and four wheels whose stacked slices show a circle from the side.
 */
function carShape({ width: w, depth: d, height: h }: Sized): ObjectShape {
  const radius = Math.min(0.33, h * 0.22, w * 0.07);
  const tyre = Math.min(0.22, d * 0.12);
  const wx = w / 2 - w * 0.18,
    wy = d / 2 - tyre / 2;
  const wheel = (x: number, y: number) =>
    slices(
      12,
      0,
      2 * radius,
      (t) => box(2 * radius * Math.sqrt(1 - (2 * t - 1) ** 2), tyre, x, y),
      "frame",
    );
  const sill = h * 0.14,
    belt = h * 0.6,
    eaves = h * 0.96;
  const side = d - 2 * Math.min(0.03, d * 0.02);
  const corner = Math.min(0.35, d * 0.2);
  const lower = (t: number) => rounded(w * (0.97 + 0.03 * Math.sin(Math.PI * t)), side, corner);
  const cabin = (t: number) => {
    const front = w * (0.24 - 0.22 * t),
      rear = -w * (0.42 - 0.14 * t);
    return rounded(
      front - rear,
      side * (0.94 - 0.16 * t),
      Math.min(0.15, d * 0.08),
      (front + rear) / 2,
    );
  };
  return {
    parts: [
      ...wheel(wx, wy),
      ...wheel(wx, -wy),
      ...wheel(-wx, wy),
      ...wheel(-wx, -wy),
      ...slices(4, sill, belt, lower, "body"),
      ...slices(12, belt, eaves, cabin, "glass"),
      { slot: "body", ring: cabin(1), bottom: eaves, top: h },
    ],
    lines: [lower(0.5), cabin(0), cabin(1)].map((points) => ({ points, closed: true })),
  };
}

/** A television with its screen towards -y and its back towards +y, on a foot or flat. */
function televisionShape(o: Sized): ObjectShape {
  const { width: w, depth: d, height: h } = o;
  const stand = (o.options?.tvMount ?? "stand") === "stand";
  const foot = stand ? Math.min(0.08, h * 0.1) : 0;
  const film = Math.min(0.004, d / 4);
  const bezel = Math.min(0.012, w / 10, (h - foot) / 10);
  const housing = rounded(w, d - film, Math.min(0.01, d / 4), 0, film / 2, 2);
  const screen = box(w - 2 * bezel, film, 0, -d / 2 + film / 2);
  const plate = rounded(Math.min(0.6, w * 0.4), Math.max(d, Math.min(0.24, w * 0.2)), 0.02);
  const plateTop = foot / 4;
  return {
    parts: [
      { slot: "body", ring: housing, bottom: foot, top: h },
      { slot: "screen", ring: screen, bottom: foot + bezel, top: h - bezel },
      ...(stand
        ? [
            { slot: "frame" as const, ring: plate, bottom: 0, top: plateTop },
            {
              slot: "frame" as const,
              ring: box(w * 0.1, d * 0.6),
              bottom: plateTop,
              top: foot,
            },
          ]
        : []),
    ],
    lines: [...(stand ? [plate] : []), housing, screen].map((points) => ({
      points,
      closed: true,
    })),
  };
}

/** A bed with its head towards +y: rails, headboard, mattress, duvet and pillows. */
function bedShape({ width: w, depth: d, height: h }: Sized): ObjectShape {
  const leg = Math.min(0.12, h * 0.25);
  const railTop = Math.min(0.3, h * 0.66);
  const head = Math.min(0.06, d / 10);
  const inset = Math.min(0.03, w / 10);
  const rails = box(w, d - head, 0, -head / 2);
  const headboard = box(w, head, 0, d / 2 - head / 2);
  const mattress = rounded(w - 2 * inset, d - head - 2 * inset, 0.05, 0, -head / 2);
  const span = d - head - 2 * inset;
  const duvetDepth = span * 0.68;
  const duvet = rounded(w - 2 * inset, duvetDepth, 0.04, 0, -d / 2 + inset + duvetDepth / 2);
  const count = w >= 1.3 ? 2 : 1;
  const pillowWidth = Math.min(0.7, (w - 2 * inset) / count - 0.06);
  const pillowDepth = Math.min(0.42, span * 0.2);
  const pillowY = d / 2 - head - inset - pillowDepth / 2 - 0.02;
  const pillows = Array.from({ length: count }, (_, i) =>
    rounded(pillowWidth, pillowDepth, pillowDepth / 3, (w * (i + 0.5)) / count - w / 2, pillowY),
  );
  const r = Math.min(0.03, w / 8, d / 8);
  const fx = w / 2 - 0.05,
    fy = d / 2 - 0.05;
  return {
    parts: [
      ...[
        [-fx, -fy],
        [fx, -fy],
        [fx, fy],
        [-fx, fy],
      ].map(([x, y]) => ({
        slot: "frame" as const,
        ring: rounded(2 * r, 2 * r, r / 2, x, y, 2),
        bottom: 0,
        top: leg,
      })),
      { slot: "frame", ring: rails, bottom: leg, top: railTop },
      { slot: "frame", ring: headboard, bottom: 0, top: h * 1.9 },
      { slot: "seat", ring: mattress, bottom: railTop, top: h },
      { slot: "top", ring: duvet, bottom: h, top: h + 0.04 },
      ...pillows.map((ring) => ({ slot: "seat" as const, ring, bottom: h, top: h + 0.12 })),
    ],
    lines: [rails, headboard, duvet, ...pillows].map((points) => ({ points, closed: true })),
  };
}

/** Doors a cabinet shows: `auto` one per 60 cm. */
export function objectFronts(o: Pick<Sized, "width" | "options">) {
  const wanted = o.options?.fronts ?? "auto";
  return wanted === "auto" ? Math.max(1, Math.round(o.width / 0.6)) : wanted;
}
/** Boards a shelf shows, top and bottom included: `auto` one per 35 cm of height. */
export function objectBoards(o: Pick<Sized, "height" | "options">) {
  const wanted = o.options?.boards ?? "auto";
  return wanted === "auto" ? Math.max(2, Math.round(o.height / 0.35) + 1) : Math.max(2, wanted);
}

/** A body with its fronts towards -y, on a plinth or on legs; doors or stacked drawers. */
function cabinetShape(o: Sized, foot: "plinth" | "legs", layout: "doors" | "drawers"): ObjectShape {
  const { width: w, depth: d, height: h } = o;
  const base = foot === "plinth" ? Math.min(0.08, h * 0.1) : Math.min(0.15, h * 0.25);
  const face = Math.min(0.02, d / 8);
  const gap = Math.min(0.004, w / 100);
  const carcass = box(w, d - face, 0, face / 2);
  const y = -d / 2 + face / 2;
  const count = layout === "doors" ? objectFronts(o) : 2;
  const each = (layout === "doors" ? w : h - base) / count;
  const fronts: ObjectPart[] = Array.from({ length: count }, (_, i) =>
    layout === "doors"
      ? {
          slot: "top" as const,
          ring: box(each - gap, face, -w / 2 + each * (i + 0.5), y),
          bottom: base + gap,
          top: h - gap,
        }
      : {
          slot: "top" as const,
          ring: box(w - gap, face, 0, y),
          bottom: base + each * i + gap,
          top: base + each * (i + 1) - gap,
        },
  );
  const grip = Math.min(0.012, face / 2);
  const handles: ObjectPart[] = fronts.map((front, i) => {
    const x =
      layout === "drawers"
        ? 0
        : -w / 2 + each * (i + 0.5) + (i % 2 === 0 ? 1 : -1) * (each / 2 - 0.04);
    const z = layout === "drawers" ? (front.bottom + front.top) / 2 : Math.min(1.05, h / 2);
    return {
      slot: "frame",
      ring: box(layout === "drawers" ? Math.min(0.12, w / 3) : grip, grip, x, -d / 2 - grip / 2),
      bottom: z - (layout === "drawers" ? grip / 2 : Math.min(0.08, h / 8)),
      top: z + (layout === "drawers" ? grip / 2 : Math.min(0.08, h / 8)),
    };
  });
  const r = Math.min(0.02, w / 8, d / 8);
  const fx = w / 2 - 0.04,
    fy = d / 2 - 0.04;
  const feet: ObjectPart[] =
    foot === "plinth"
      ? [{ slot: "body", ring: box(w - 0.04, d - face - 0.04, 0, face / 2), bottom: 0, top: base }]
      : [
          [-fx, -fy],
          [fx, -fy],
          [fx, fy],
          [-fx, fy],
        ].map(([x, fyy]) => ({
          slot: "frame" as const,
          ring: ellipse(r, r, x, fyy, 10),
          bottom: 0,
          top: base,
        }));
  return {
    parts: [...feet, { slot: "body", ring: carcass, bottom: base, top: h }, ...fronts, ...handles],
    lines: [
      { points: box(w, d), closed: true },
      {
        points: [
          { x: -w / 2, y: -d / 2 + face },
          { x: w / 2, y: -d / 2 + face },
        ],
        closed: false,
      },
      ...(layout === "doors"
        ? Array.from({ length: count - 1 }, (_, i) => {
            const x = -w / 2 + each * (i + 1);
            return {
              points: [
                { x, y: -d / 2 },
                { x, y: -d / 2 + face },
              ],
              closed: false,
            };
          })
        : []),
    ],
  };
}

/** An open shelf with its back towards +y: two sides, a thin back and its boards. */
function shelfShape(o: Sized): ObjectShape {
  const { width: w, depth: d, height: h } = o;
  const side = Math.min(0.025, w / 10);
  const back = Math.min(0.008, d / 10);
  const board = Math.min(0.025, h / 40);
  const count = objectBoards(o);
  const ring = box(w - 2 * side, d - back, 0, -back / 2);
  const step = (h - board) / (count - 1);
  return {
    parts: [
      { slot: "body", ring: box(side, d, -w / 2 + side / 2), bottom: 0, top: h },
      { slot: "body", ring: box(side, d, w / 2 - side / 2), bottom: 0, top: h },
      { slot: "body", ring: box(w - 2 * side, back, 0, d / 2 - back / 2), bottom: 0, top: h },
      ...Array.from({ length: count }, (_, i) => ({
        slot: "top" as const,
        ring,
        bottom: step * i,
        top: step * i + board,
      })),
    ],
    lines: [
      { points: box(w, d), closed: true },
      { points: ring, closed: true },
    ],
  };
}

const CABINET_LABELS = { top: "Türen", frame: "Griffe" };
const cabinetColors = { body: "#d9cfc0", top: "#e4dccf", frame: "#6b6f75" };
const tableColors = { top: "#c9a77c", frame: "#7d6248" };

const RULES: Partial<Record<ObjectCatalogId, Rule>> = {
  "bed-single": {
    slots: ["frame", "seat", "top"],
    labels: { frame: "Rahmen", seat: "Matratze", top: "Bettdecke" },
    colors: { frame: "#8a6d50", seat: "#eceae4", top: "#9fb0c0" },
    options: {},
    shape: bedShape,
  },
  "bed-double": {
    slots: ["frame", "seat", "top"],
    labels: { frame: "Rahmen", seat: "Matratze", top: "Bettdecke" },
    colors: { frame: "#8a6d50", seat: "#eceae4", top: "#9fb0c0" },
    options: {},
    shape: bedShape,
  },
  wardrobe: {
    slots: ["body", "top", "frame"],
    labels: CABINET_LABELS,
    colors: cabinetColors,
    options: { fronts: "auto" },
    shape: (o) => cabinetShape(o, "plinth", "doors"),
  },
  sideboard: {
    slots: ["body", "top", "frame"],
    labels: { ...CABINET_LABELS, frame: "Füße und Griffe" },
    colors: cabinetColors,
    options: { fronts: "auto" },
    shape: (o) => cabinetShape(o, "legs", "doors"),
  },
  nightstand: {
    slots: ["body", "top", "frame"],
    labels: { top: "Schubladen", frame: "Füße und Griffe" },
    colors: cabinetColors,
    options: {},
    shape: (o) => cabinetShape(o, "legs", "drawers"),
  },
  shelf: {
    slots: ["body", "top"],
    labels: { body: "Seiten", top: "Böden" },
    colors: { body: "#c9a77c", top: "#d8bb94" },
    options: { boards: "auto" },
    shape: shelfShape,
  },
  "coffee-table": {
    slots: ["top", "frame"],
    colors: tableColors,
    options: { tableTop: "rectangle" },
    shape: tableShape,
  },
  desk: {
    slots: ["top", "frame"],
    colors: tableColors,
    options: { tableTop: "rectangle" },
    shape: tableShape,
  },
  armchair: {
    slots: ["body", "seat", "frame"],
    colors: { body: "#7f8a96", seat: "#98a3ae", frame: "#4a3b2e" },
    options: { sofaArms: "both" },
    shape: sofaShape,
  },
  car: {
    slots: ["body", "glass", "frame"],
    labels: { body: "Karosserie", frame: "Räder" },
    colors: { body: "#5d7186", glass: "#2b3945", frame: "#23272b" },
    options: {},
    shape: carShape,
  },
  television: {
    slots: ["body", "screen", "frame"],
    labels: { body: "Gehäuse", frame: "Fuß" },
    colors: { body: "#2c2f33", screen: "#10161d", frame: "#3b3f44" },
    options: { tvMount: "stand" },
    shape: televisionShape,
  },
  sofa: {
    slots: ["body", "seat", "frame"],
    colors: { body: "#7f8a96", seat: "#98a3ae", frame: "#4a3b2e" },
    options: { sofaArms: "both" },
    shape: sofaShape,
  },
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
