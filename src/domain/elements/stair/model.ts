import { z } from "zod";
import { WALL_RENOVATIONS } from "../wall/renovation.ts";
import { wallTopBindingSchema } from "../wall/height-binding.ts";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();

export const STAIR_AXES = ["center", "left", "right"] as const;
export type StairAxis = (typeof STAIR_AXES)[number];
/** Plan shapes (docs/TREPPE.md, TR3): straight, L (quarter turn) and U (half turn) with a
 * landing between two flights. */
export const STAIR_SHAPES = ["straight", "l", "u"] as const;
export type StairShape = (typeof STAIR_SHAPES)[number];
export const STAIR_SHAPE_LABELS: Record<StairShape, string> = {
  straight: "Gerade",
  l: "L-Treppe (Viertelwendung)",
  u: "U-Treppe (Halbwendung)",
};
export const STAIR_TURNS = ["left", "right"] as const;
export const STAIR_TURN_LABELS: Record<(typeof STAIR_TURNS)[number], string> = {
  left: "Links",
  right: "Rechts",
};
/** Longest flight without a landing (DIN 18065: after at most 18 risers a landing). */
export const STAIR_MAX_FLIGHT = 18;
export const STAIR_AXIS_LABELS: Record<StairAxis, string> = {
  center: "Mitte",
  left: "Links",
  right: "Rechts",
};

/** Rule sets of DIN 18065 (Gebäudetreppen) used for the check. */
export const STAIR_RULE_SETS = ["residential", "other"] as const;
export type StairRuleSet = (typeof STAIR_RULE_SETS)[number];
export const STAIR_RULE_LABELS: Record<StairRuleSet, string> = {
  residential: "Wohngebäude (bis 2 Wohnungen), notwendige Treppe",
  other: "Sonstige Gebäude, notwendige Treppe",
};
/** Limits in metres: riser height, tread depth, clear flight width (DIN 18065, Tabelle 1). */
export const STAIR_RULES: Record<
  StairRuleSet,
  { riser: [number, number]; tread: [number, number]; width: number }
> = {
  residential: { riser: [0.14, 0.2], tread: [0.23, 0.37], width: 0.8 },
  other: { riser: [0.14, 0.19], tread: [0.26, 0.37], width: 1.0 },
};
/** Step rule 2h + a (Schrittmaßregel) in metres. */
export const STAIR_STEP_RULE = { min: 0.59, max: 0.65, ideal: 0.63 };

/**
 * Stair (schema 40, docs/TREPPE.md, L06). Every value the user may set is stored explicitly so
 * the settings window can steer all of them (user decision 31.10.2026); only what is not fixed
 * is derived:
 * - `start`: centre of the first riser's front edge; `direction` in degrees (0 = +x).
 * - `width`: flight width; `riserTarget`: wished riser height; `riserCount`/`tread`: optional
 *   fixed values (otherwise riser count from the height, tread from the step rule 2h + a = 63).
 * - height like a column: foot `baseOffset` over the storey floor, top bound to the storey
 *   (OK raw floor above + topOffset) or a fixed `height`.
 * - `waist`: thickness of the stair slab (Laufplatte) under the steps; `ruleSet` for the check.
 * Straight flights in TR1; landings and winders follow (TR3).
 */
export const stairSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    shape: z.enum(STAIR_SHAPES),
    /** L and U: side the stair turns to, looking up the first flight (absent = left). */
    turn: z.enum(STAIR_TURNS).optional(),
    /** L and U: fixed riser count of the first flight; otherwise half of all risers. */
    firstRisers: z.number().int().min(1).max(199).optional(),
    /** L and U: fixed landing depth along the first flight; otherwise the flight width. */
    landingDepth: finite.positive().max(10).optional(),
    /** U: stair well between the flights (Treppenauge); absent = STAIR_DEFAULTS.eye. */
    eye: finite.min(0).max(5).optional(),
    start: point,
    direction: finite,
    width: finite.positive().max(10),
    /** Drawing axis like a wall's: the clicked line is the centre, left or right edge
     * (looking up the flight). Absent = centre (docs/TREPPE.md, TR2). */
    axis: z.enum(STAIR_AXES).optional(),
    riserTarget: finite.min(0.1).max(0.25),
    riserCount: z.number().int().min(2).max(200).optional(),
    tread: finite.min(0.15).max(0.6).optional(),
    waist: finite.positive().max(1),
    ruleSet: z.enum(STAIR_RULE_SETS),
    baseOffset: finite,
    height: finite.positive().optional(),
    topBinding: wallTopBindingSchema.optional(),
    renovation: z.enum(WALL_RENOVATIONS).optional(),
  })
  .strict()
  .refine(
    (s) => (s.height === undefined) !== (s.topBinding === undefined),
    "Eine Treppe hat entweder eine feste Höhe oder eine Geschossbindung.",
  );
export type Stair = z.infer<typeof stairSchema>;

export const STAIR_DEFAULTS = {
  shape: "straight",
  direction: 0,
  width: 1,
  riserTarget: 0.175,
  waist: 0.16,
  ruleSet: "residential",
  baseOffset: 0,
  eye: 0.15,
} as const;

/** Height the stair climbs; null while a bound top meets an unknown storey height. */
export function stairRise(
  stair: Pick<Stair, "baseOffset" | "height" | "topBinding">,
  storeyHeight: number | null,
): number | null {
  if (stair.topBinding)
    return storeyHeight === null
      ? null
      : storeyHeight + stair.topBinding.topOffset - stair.baseOffset;
  return stair.height!;
}

export type StairGeometry = {
  rise: number;
  riserCount: number;
  riser: number;
  treadCount: number;
  tread: number;
  /** Horizontal run of all flights together (Lauflänge, landing excluded). */
  run: number;
  /** Riser count per flight: one for a straight stair, two for L and U (docs/TREPPE.md, TR3). */
  flights: number[];
  /** Landing depth along the first flight; null without a landing. */
  landing: number | null;
  stepRule: number;
  /** Findings of the DIN 18065 check, empty when everything fits. */
  issues: string[];
};

/** Derived flight values and the DIN 18065 check (docs/TREPPE.md). */
export function stairGeometry(
  stair: Pick<
    Stair,
    | "riserTarget"
    | "riserCount"
    | "tread"
    | "width"
    | "ruleSet"
    | "baseOffset"
    | "height"
    | "topBinding"
  > &
    Partial<Pick<Stair, "shape" | "firstRisers" | "landingDepth">>,
  storeyHeight: number | null,
): StairGeometry | null {
  const rise = stairRise(stair, storeyHeight);
  if (rise === null || rise <= 0) return null;
  const riserCount = stair.riserCount ?? Math.max(2, Math.round(rise / stair.riserTarget));
  const riser = rise / riserCount;
  const tread =
    stair.tread ??
    Math.round(Math.min(0.37, Math.max(0.2, STAIR_STEP_RULE.ideal - 2 * riser)) * 1000) / 1000;
  // L and U: two flights; the landing replaces the last tread of the first one.
  const turning = !!stair.shape && stair.shape !== "straight" && riserCount >= 4;
  const n1 = turning
    ? Math.min(Math.max(stair.firstRisers ?? Math.round(riserCount / 2), 2), riserCount - 2)
    : riserCount;
  const flights = turning ? [n1, riserCount - n1] : [riserCount];
  const landing = turning ? (stair.landingDepth ?? stair.width) : null;
  const treadCount = riserCount - flights.length;
  const stepRule = 2 * riser + tread;
  const rules = STAIR_RULES[stair.ruleSet];
  const cm = (m: number) => (m * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 });
  const issues: string[] = [];
  if (riser < rules.riser[0] - 1e-9 || riser > rules.riser[1] + 1e-9)
    issues.push(
      `Steigung ${cm(riser)} cm außerhalb ${cm(rules.riser[0])}–${cm(rules.riser[1])} cm`,
    );
  if (tread < rules.tread[0] - 1e-9 || tread > rules.tread[1] + 1e-9)
    issues.push(
      `Auftritt ${cm(tread)} cm außerhalb ${cm(rules.tread[0])}–${cm(rules.tread[1])} cm`,
    );
  if (stair.width < rules.width - 1e-9)
    issues.push(`Laufbreite ${cm(stair.width)} cm unter ${cm(rules.width)} cm`);
  if (stepRule < STAIR_STEP_RULE.min - 1e-9 || stepRule > STAIR_STEP_RULE.max + 1e-9)
    issues.push(`Schrittmaß 2h + a = ${cm(stepRule)} cm außerhalb 59–65 cm`);
  if (stair.shape && stair.shape !== "straight" && !turning)
    issues.push("Zu wenige Steigungen für zwei Läufe mit Podest");
  if (turning && stair.firstRisers !== undefined && stair.firstRisers !== n1)
    issues.push(`Steigungen im 1. Lauf auf ${n1} begrenzt`);
  flights.forEach((count, i) => {
    const name = flights.length > 1 ? `${i + 1}. Lauf` : "Lauf";
    if (count > STAIR_MAX_FLIGHT)
      issues.push(`${name} mit ${count} Steigungen: nach höchstens 18 ein Zwischenpodest`);
    if (flights.length > 1 && count < 3) issues.push(`${name} mit weniger als 3 Steigungen`);
  });
  if (landing !== null && landing < stair.width - 1e-9)
    issues.push(`Podesttiefe ${cm(landing)} cm unter Laufbreite ${cm(stair.width)} cm`);
  return {
    rise,
    riserCount,
    riser,
    treadCount,
    tread,
    run: flights.reduce((sum, n) => sum + (n - 1) * tread, 0),
    flights,
    landing,
    stepRule,
    issues,
  };
}

type P2 = { x: number; y: number };
export type StairFrame = { origin: P2; d: P2; n: P2 };
/** Flight frame: origin on the centre line of the first riser, d up the run, n to the left. */
export function stairFrame(
  stair: Pick<Stair, "start" | "direction" | "width" | "axis">,
): StairFrame {
  const a = (stair.direction * Math.PI) / 180;
  const d = { x: Math.cos(a), y: Math.sin(a) };
  const n = { x: -d.y, y: d.x };
  // The drawing axis is the clicked line: the flight lies to its right (left axis) or left.
  const shift =
    stair.axis === "left" ? -stair.width / 2 : stair.axis === "right" ? stair.width / 2 : 0;
  return { origin: { x: stair.start.x + n.x * shift, y: stair.start.y + n.y * shift }, d, n };
}

export function frameAt(f: StairFrame, s: number, t: number): P2 {
  return { x: f.origin.x + f.d.x * s + f.n.x * t, y: f.origin.y + f.d.y * s + f.n.y * t };
}

/** Run direction in degrees from the start towards a point; null on the start itself. */
export function stairDirectionTo(start: P2, point: P2): number | null {
  const dx = point.x - start.x;
  const dy = point.y - start.y;
  if (Math.hypot(dx, dy) < 1e-6) return null;
  return Math.round(((Math.atan2(dy, dx) * 180) / Math.PI) * 1e6) / 1e6;
}

/** Side of the run line a point lies on (docs/TREPPE.md, TR3: the third click turns L and U). */
export function stairTurnTo(start: P2, direction: number, point: P2): "left" | "right" {
  const a = (direction * Math.PI) / 180;
  const cross = Math.cos(a) * (point.y - start.y) - Math.sin(a) * (point.x - start.x);
  return cross < 0 ? "right" : "left";
}

type ShapeFields = "start" | "direction" | "width" | "axis" | "shape" | "turn" | "eye";
type LayoutGeometry = Pick<StairGeometry, "riser" | "tread" | "flights" | "landing">;
/** One flight in plan: its frame, riser count and index of its first riser in the stair. */
export type StairFlight = {
  frame: StairFrame;
  count: number;
  first: number;
  run: number;
  /** Walking line points on the landing before this flight. */
  via: P2[];
};

/**
 * Flights and landing in plan (docs/TREPPE.md, TR3). The first flight starts on the drawing
 * axis; an L turns by 90° to the side `turn`, a U returns parallel beside the first flight with
 * the stair well (`eye`) between them. The landing lies at the top of the first flight; an L
 * flight leaves it at its far edge.
 */
export function stairLayout(
  stair: Pick<Stair, ShapeFields>,
  g: LayoutGeometry,
): { flights: StairFlight[]; landing: P2[] | null; footprint: P2[] } {
  const f = stairFrame(stair);
  const w = stair.width;
  const [n1 = 2, n2 = 0] = g.flights;
  const run1 = (n1 - 1) * g.tread;
  const first: StairFlight = { frame: f, count: n1, first: 0, run: run1, via: [] };
  const rect = (s0: number, s1: number, t0: number, t1: number) => [
    frameAt(f, s0, t0),
    frameAt(f, s1, t0),
    frameAt(f, s1, t1),
    frameAt(f, s0, t1),
  ];
  if (stair.shape === "straight" || g.landing === null || !n2)
    return { flights: [first], landing: null, footprint: rect(0, run1, -w / 2, w / 2) };
  // σ mirrors the side: +1 turns left (towards n), −1 right.
  const σ = stair.turn === "right" ? -1 : 1;
  const depth = g.landing;
  const run2 = (n2 - 1) * g.tread;
  const at = (s: number, t: number) => frameAt(f, s, σ * t);
  const polygon = (points: [number, number][]) => {
    const mapped = points.map(([s, t]) => at(s, t));
    // Mirrored outlines turn clockwise: keep every outline counterclockwise.
    return σ === 1 ? mapped : mapped.reverse();
  };
  const left = { x: f.n.x * σ, y: f.n.y * σ };
  if (stair.shape === "l") {
    const centre = run1 + depth - w / 2;
    const second: StairFlight = {
      frame: { origin: at(centre, w / 2), d: left, n: { x: -f.d.x * σ, y: -f.d.y * σ } },
      count: n2,
      first: n1,
      run: run2,
      via: [at(centre, 0)],
    };
    return {
      flights: [first, second],
      landing: polygon([
        [run1, -w / 2],
        [run1 + depth, -w / 2],
        [run1 + depth, w / 2],
        [run1, w / 2],
      ]),
      footprint: polygon([
        [0, -w / 2],
        [run1 + depth, -w / 2],
        [run1 + depth, w / 2 + run2],
        [run1 + depth - w, w / 2 + run2],
        [run1 + depth - w, w / 2],
        [0, w / 2],
      ]),
    };
  }
  const eye = stair.eye ?? STAIR_DEFAULTS.eye;
  const back = w + eye;
  const second: StairFlight = {
    frame: {
      origin: at(run1, back),
      d: { x: -f.d.x, y: -f.d.y },
      n: { x: -left.x, y: -left.y },
    },
    count: n2,
    first: n1,
    run: run2,
    via: [at(run1 + depth / 2, 0), at(run1 + depth / 2, back)],
  };
  return {
    flights: [first, second],
    landing: polygon([
      [run1, -w / 2],
      [run1 + depth, -w / 2],
      [run1 + depth, back + w / 2],
      [run1, back + w / 2],
    ]),
    footprint: polygon([
      [0, -w / 2],
      [run1 + depth, -w / 2],
      [run1 + depth, back + w / 2],
      [run1 - run2, back + w / 2],
      [run1 - run2, back - w / 2],
      [run1, back - w / 2],
      [run1, w / 2],
      [0, w / 2],
    ]),
  };
}

/** Plan outline of a straight flight (counterclockwise): start edge, run along the direction. */
export function stairOutline(
  stair: Pick<Stair, "start" | "direction" | "width" | "axis">,
  run: number,
): P2[] {
  const f = stairFrame(stair);
  const w = stair.width / 2;
  return [frameAt(f, 0, -w), frameAt(f, run, -w), frameAt(f, run, w), frameAt(f, 0, w)];
}

type Segment = { start: P2; end: P2 };
/**
 * Plan view after building drawing practice (docs/TREPPE.md, TR2/TR3): footprint, one line per
 * riser, the walking line (Lauflinie) in the middle of the flights and across the landing from
 * a circle at the first step to an arrow at the last, and the cut at `cutHeight` (1 m) as a
 * break line across the flight it meets. Parts above the cut are drawn dashed (`above`).
 */
export function stairPlan(
  stair: Pick<Stair, ShapeFields>,
  g: LayoutGeometry & Pick<StairGeometry, "riserCount">,
  cutHeight = 1,
): {
  outline: P2[];
  landing: P2[] | null;
  risers: (Segment & { above: boolean })[];
  walk: { below: P2[]; above: P2[] | null };
  cut: Segment | null;
} {
  const layout = stairLayout(stair, g);
  const w = stair.width / 2;
  // Step k (1-based) lies on riser k: its top is k·h. Risers from the cut step on lie above.
  const cutStep = Math.floor(cutHeight / g.riser);
  const cut = cutStep >= g.riserCount ? null : cutStep;
  const risers = layout.flights.flatMap((flight) =>
    Array.from({ length: flight.count }, (_, k) => ({
      start: frameAt(flight.frame, k * g.tread, -w),
      end: frameAt(flight.frame, k * g.tread, w),
      above: cut !== null && flight.first + k >= cut,
    })),
  );
  // Walking line: centre of every flight, joined through the landing.
  const pieces = layout.flights.map((flight, i) => ({
    flight,
    from: i === 0 ? g.tread * 0.5 : 0,
  }));
  const path = (until?: { index: number; s: number }) =>
    pieces.flatMap(({ flight, from }, i) => {
      if (until && i > until.index) return [];
      const end = until && i === until.index ? until.s : flight.run;
      return [
        ...flight.via,
        frameAt(flight.frame, from, 0),
        frameAt(flight.frame, Math.max(end, from), 0),
      ];
    });
  const full = path();
  if (cut === null) return { ...base(), walk: { below: full, above: null }, cut: null };
  let index = 0;
  layout.flights.forEach((flight, i) => {
    if (flight.first <= cut) index = i;
  });
  const flight = layout.flights[index]!;
  const s = Math.max(cut - flight.first - 0.5, index === 0 ? 0 : 0.25) * g.tread;
  const below = path({ index, s });
  const mid = below.at(-1)!;
  const above = [
    mid,
    ...pieces
      .slice(index)
      .flatMap(({ flight: f, from }, i) => [
        ...(i === 0 ? [] : [...f.via, frameAt(f.frame, from, 0)]),
        frameAt(f.frame, f.run, 0),
      ]),
  ];
  return {
    ...base(),
    walk: { below, above },
    // Break line: a diagonal across the flight around the cut position.
    cut: {
      start: frameAt(flight.frame, s - g.tread * 0.6, -w),
      end: frameAt(flight.frame, s + g.tread * 0.6, w),
    },
  };
  function base() {
    return { outline: layout.footprint, landing: layout.landing, risers };
  }
}

/**
 * Side profile of a solid flight in (s along the run, z up from the foot): the steps on top,
 * the stair slab (waist measured perpendicular to the pitch) below. Counterclockwise.
 */
export function stairProfile(
  g: Pick<StairGeometry, "riserCount" | "riser" | "tread" | "run" | "rise">,
  waist: number,
): P2[] {
  const points: P2[] = [{ x: 0, y: 0 }];
  for (let k = 0; k < g.riserCount; k++) {
    const s = k * g.tread;
    points.push({ x: s, y: (k + 1) * g.riser });
    if (k < g.riserCount - 1) points.push({ x: s + g.tread, y: (k + 1) * g.riser });
  }
  // Soffit parallel to the line through the inner corners (z = slope · s), waist below it.
  const slope = g.riser / g.tread;
  const drop = waist * Math.sqrt(1 + slope * slope);
  const endZ = Math.max(slope * g.run - drop, 0);
  points.push({ x: g.run, y: Math.min(endZ, g.rise - 1e-6) });
  const footS = Math.min(drop / slope, g.run);
  if (footS > 1e-9 && footS < g.run) points.push({ x: footS, y: 0 });
  // Outline runs clockwise as built (up the steps, back along the soffit): reverse it.
  return points.reverse();
}
