import { z } from "zod";
import { WALL_RENOVATIONS } from "../wall/renovation.ts";
import { wallTopBindingSchema } from "../wall/height-binding.ts";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();

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
    shape: z.literal("straight"),
    start: point,
    direction: finite,
    width: finite.positive().max(10),
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
  /** Horizontal run of the flight (Lauflänge). */
  run: number;
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
  >,
  storeyHeight: number | null,
): StairGeometry | null {
  const rise = stairRise(stair, storeyHeight);
  if (rise === null || rise <= 0) return null;
  const riserCount = stair.riserCount ?? Math.max(2, Math.round(rise / stair.riserTarget));
  const riser = rise / riserCount;
  const tread =
    stair.tread ??
    Math.round(Math.min(0.37, Math.max(0.2, STAIR_STEP_RULE.ideal - 2 * riser)) * 1000) / 1000;
  const treadCount = riserCount - 1;
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
  return { rise, riserCount, riser, treadCount, tread, run: treadCount * tread, stepRule, issues };
}

/** Plan outline of the flight (counterclockwise): start edge, run along the direction. */
export function stairOutline(
  stair: Pick<Stair, "start" | "direction" | "width">,
  run: number,
): { x: number; y: number }[] {
  const a = (stair.direction * Math.PI) / 180;
  const d = { x: Math.cos(a), y: Math.sin(a) };
  const n = { x: -d.y, y: d.x };
  const w = stair.width / 2;
  const at = (s: number, t: number) => ({
    x: stair.start.x + d.x * s + n.x * t,
    y: stair.start.y + d.y * s + n.y * t,
  });
  return [at(0, -w), at(run, -w), at(run, w), at(0, w)];
}

/**
 * Side profile of a solid flight in (s along the run, z up from the foot): the steps on top,
 * the stair slab (waist measured perpendicular to the pitch) below. Counterclockwise.
 */
export function stairProfile(
  g: Pick<StairGeometry, "riserCount" | "riser" | "tread" | "run" | "rise">,
  waist: number,
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: 0, y: 0 }];
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
