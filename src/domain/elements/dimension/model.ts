import { z } from "zod";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();
type Point = { x: number; y: number };
export type DimensionOrientation = "horizontal" | "vertical";
type Chain = { orientation: DimensionOrientation; points: readonly Point[] };

/**
 * Dimension chain (schema 38, docs/MASSKETTE.md, L12): a 2D annotation of the plan. The user
 * picks the direction, clicks the position of the dimension line first and then the measured
 * points (snapped like every plan point). Points are stored as plain plan coordinates; the
 * chain does not follow later model edits (user decision 31.10.2026).
 * `offset`: y of a horizontal line, x of a vertical line.
 */
export const dimensionSchema = z
  .object({
    id: z.string().trim().min(1),
    layerId: z.string().trim().min(1),
    orientation: z.enum(["horizontal", "vertical"]),
    offset: finite,
    points: z.array(point).min(2).max(1000),
  })
  .strict()
  .refine(
    (d) => dimensionValues(d).some((v) => v > 0),
    "Eine Maßkette braucht mindestens zwei verschiedene Punkte in ihrer Richtung.",
  );
export type Dimension = z.infer<typeof dimensionSchema>;

/** Position of a point along the chain (x for horizontal, y for vertical). */
function along(orientation: DimensionOrientation, p: Point): number {
  return orientation === "horizontal" ? p.x : p.y;
}

/** Sorted distinct positions along the chain; points at the same position count once. */
export function dimensionStations(d: Chain): number[] {
  const sorted = d.points.map((p) => along(d.orientation, p)).sort((a, b) => a - b);
  return sorted.filter((v, i) => i === 0 || v - sorted[i - 1]! > 1e-9);
}

/** The measured lengths between neighbouring stations, in metres. */
export function dimensionValues(d: Chain): number[] {
  const stations = dimensionStations(d);
  return stations.slice(1).map((v, i) => v - stations[i]!);
}

/**
 * Plan geometry of a chain: the dimension line over all stations, one extension line from each
 * measured point to the line, a tick at every station and the value text in the middle of
 * each segment. Pure geometry; the renderer chooses sizes and styles.
 */
export function dimensionLayout(d: Chain & { offset: number }) {
  const stations = dimensionStations(d);
  const at = (s: number): Point =>
    d.orientation === "horizontal" ? { x: s, y: d.offset } : { x: d.offset, y: s };
  return {
    line: { start: at(stations[0]!), end: at(stations.at(-1)!) },
    extensions: d.points.map((p) => ({ start: { ...p }, end: at(along(d.orientation, p)) })),
    ticks: stations.map(at),
    segments: stations.slice(1).map((s, i) => ({
      value: s - stations[i]!,
      centre: at((s + stations[i]!) / 2),
    })),
  };
}

/**
 * Value text after German building drawing practice: below 1 m in centimetres, from 1 m in
 * metres with two decimals; half centimetres keep one decimal (36,5 · 3,515 → 3,51⁵ comes with
 * the later display work).
 */
export function formatDimension(metres: number): string {
  const de = (value: number, digits: number) =>
    value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (metres < 1) {
    const cm = Math.round(metres * 200) / 2;
    return Number.isInteger(cm) ? de(cm, 0) : de(cm, 1);
  }
  return de(Math.round(metres * 100) / 100, 2);
}
