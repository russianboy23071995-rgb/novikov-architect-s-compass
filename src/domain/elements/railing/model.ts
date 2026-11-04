import { z } from "zod";
import { WALL_RENOVATIONS } from "../wall/renovation.ts";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();

export const MAX_RAILING_POINTS = 1000;
/** Shortest segment of a railing's line (1 cm); shorter ones are no railing. */
export const MIN_RAILING_SEGMENT = 0.01;
export const RAILING_HEIGHT = { min: 0.3, max: 3 } as const;
export const RAILING_POST_SPACING = { min: 0.3, max: 5 } as const;
export const RAILING_INFILLS = ["bars", "panel"] as const;
export type RailingInfill = (typeof RAILING_INFILLS)[number];
export const RAILING_INFILL_LABELS: Record<RailingInfill, string> = {
  bars: "Stäbe",
  panel: "Platte / Glas",
};

/**
 * Railing (Geländer, schema 54, docs/GELAENDER.md, L42). A polyline in plan along which the
 * railing runs; heights relative to the own storey floor: foot at `baseOffset`, top of the
 * handrail `height` above it. Posts stand at every point and at most `postSpacing` apart in
 * between; the infill is vertical bars or one panel per field. `renovation` as for walls
 * (absent = Bestand).
 */
export const railingSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    points: z.array(point).min(2).max(MAX_RAILING_POINTS),
    height: finite.min(RAILING_HEIGHT.min).max(RAILING_HEIGHT.max),
    baseOffset: finite,
    postSpacing: finite.min(RAILING_POST_SPACING.min).max(RAILING_POST_SPACING.max),
    infill: z.enum(RAILING_INFILLS),
    renovation: z.enum(WALL_RENOVATIONS).optional(),
  })
  .strict()
  .superRefine((railing, ctx) => {
    railing.points.forEach((p, i) => {
      const q = railing.points[i + 1];
      if (q && Math.hypot(q.x - p.x, q.y - p.y) < MIN_RAILING_SEGMENT)
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["points", i + 1],
          message: "Ein Geländerabschnitt ist kürzer als 1 cm.",
        });
    });
  });
export type Railing = z.infer<typeof railingSchema>;

/** Tool start values: 1,00 m high, posts at most 1,20 m apart, bars (docs/GELAENDER.md). */
export const RAILING_DEFAULTS = {
  height: 1,
  baseOffset: 0,
  postSpacing: 1.2,
  infill: "bars",
} as const satisfies Partial<Railing>;

/** Fixed member sizes in metres (Stufe 1: not editable). */
export const RAILING_MEMBERS = {
  /** Handrail, square. */
  handrail: 0.05,
  /** Posts, square. */
  post: 0.04,
  /** Bars, square; clear gap between bars at most `barGap` (12 cm, as building codes ask). */
  bar: 0.02,
  barGap: 0.12,
  /** Bottom rail, square, its underside `bottomRailLift` above the foot. */
  bottomRail: 0.04,
  bottomRailLift: 0.06,
  /** Panel thickness and its distance to foot and handrail. */
  panel: 0.02,
  panelGap: 0.08,
} as const;

export type RailingMemberKind = "handrail" | "post" | "bottomRail" | "bar" | "panel";
/**
 * One member: a horizontal rectangle in plan (the segment `start`–`end`, `width` across it)
 * extruded vertically from `bottom` to `top`, relative to the storey floor. Posts and bars are
 * short segments along the railing direction.
 */
export type RailingMember = {
  kind: RailingMemberKind;
  start: { x: number; y: number };
  end: { x: number; y: number };
  width: number;
  bottom: number;
  top: number;
};

type Point2 = { x: number; y: number };
const along = (a: Point2, b: Point2, t: number): Point2 => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});
/** A member of plan size `size` × `width` centred on `c`, oriented along `dir`. */
function square(
  kind: RailingMemberKind,
  c: Point2,
  dir: Point2,
  size: number,
  bottom: number,
  top: number,
): RailingMember {
  const h = size / 2;
  return {
    kind,
    start: { x: c.x - dir.x * h, y: c.y - dir.y * h },
    end: { x: c.x + dir.x * h, y: c.y + dir.y * h },
    width: size,
    bottom,
    top,
  };
}

/** Post positions along one segment: both ends and evenly between, at most `spacing` apart. */
export function railingPostCount(length: number, spacing: number) {
  return Math.max(1, Math.ceil(length / spacing - 1e-9));
}

/**
 * Every member of a railing (docs/GELAENDER.md), heights relative to the storey floor:
 * handrail and bottom rail per segment, posts at the points and in between, bars or one panel
 * per field between two posts. Shared by 3D and IFC.
 */
export function railingMembers(
  railing: Pick<Railing, "points" | "height" | "baseOffset" | "postSpacing" | "infill">,
): RailingMember[] {
  const m = RAILING_MEMBERS;
  const foot = railing.baseOffset,
    top = foot + railing.height,
    railUnder = top - m.handrail;
  const members: RailingMember[] = [];
  const points = railing.points;
  for (let i = 0; i + 1 < points.length; i++) {
    const a = points[i]!,
      b = points[i + 1]!;
    const length = Math.hypot(b.x - a.x, b.y - a.y);
    const dir = { x: (b.x - a.x) / length, y: (b.y - a.y) / length };
    // At an inner point both handrails run on by half their width: the corner closes.
    const h = m.handrail / 2,
      before = i > 0 ? h : 0,
      after = i + 2 < points.length ? h : 0;
    members.push({
      kind: "handrail",
      start: { x: a.x - dir.x * before, y: a.y - dir.y * before },
      end: { x: b.x + dir.x * after, y: b.y + dir.y * after },
      width: m.handrail,
      bottom: railUnder,
      top,
    });
    const fields = railingPostCount(length, railing.postSpacing);
    // A shared point keeps one post: each segment adds its start, the last one also its end.
    for (let k = 0; k <= fields; k++) {
      if (k === fields && i + 2 < points.length) continue;
      members.push(square("post", along(a, b, k / fields), dir, m.post, foot, railUnder));
    }
    const fieldLength = length / fields;
    const clear = fieldLength - m.post;
    if (clear <= 0) continue;
    for (let k = 0; k < fields; k++) {
      const from = along(a, b, (k * fieldLength + m.post / 2) / length),
        to = along(a, b, ((k + 1) * fieldLength - m.post / 2) / length);
      if (railing.infill === "panel") {
        members.push({
          kind: "panel",
          start: from,
          end: to,
          width: m.panel,
          bottom: foot + m.panelGap,
          top: railUnder - m.panelGap,
        });
        continue;
      }
      const railBottom = foot + m.bottomRailLift,
        railTop = railBottom + m.bottomRail;
      members.push({
        kind: "bottomRail",
        start: from,
        end: to,
        width: m.bottomRail,
        bottom: railBottom,
        top: railTop,
      });
      // Bars evenly in the field, clear gaps at most barGap (also to the posts).
      const bars = Math.max(0, Math.ceil((clear - m.barGap) / (m.bar + m.barGap) - 1e-9));
      const gap = (clear - bars * m.bar) / (bars + 1);
      for (let n = 0; n < bars; n++) {
        const offset = k * fieldLength + m.post / 2 + gap * (n + 1) + m.bar * (n + 0.5);
        members.push(square("bar", along(a, b, offset / length), dir, m.bar, railTop, railUnder));
      }
    }
  }
  return members;
}

/** Length of the railing's line in plan. */
export function railingLength(railing: Pick<Railing, "points">) {
  let length = 0;
  for (let i = 0; i + 1 < railing.points.length; i++) {
    const a = railing.points[i]!,
      b = railing.points[i + 1]!;
    length += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return length;
}
