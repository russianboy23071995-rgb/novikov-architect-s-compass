import { z } from "zod";

const finite = z.number().finite();
const point = z.object({ x: finite, y: finite }).strict();

/** Dimension line terminators of building drawings; the oblique stroke is the usual one. */
export const DIMENSION_TERMINATORS = ["slash", "dot", "circle", "arrow", "cross"] as const;
export type DimensionTerminator = (typeof DIMENSION_TERMINATORS)[number];
export const DIMENSION_TERMINATOR_LABELS: Record<DimensionTerminator, string> = {
  slash: "Schrägstrich",
  dot: "Punkt",
  circle: "Kreis",
  arrow: "Pfeil",
  cross: "Kreuz",
};
/** Figures: below 1 m in cm, from 1 m in m, half cm as superscript 5 (building practice);
 * or all in m, or all in cm. */
export const DIMENSION_UNITS = ["m-cm", "m", "cm"] as const;
export type DimensionUnits = (typeof DIMENSION_UNITS)[number];
export const DIMENSION_UNIT_LABELS: Record<DimensionUnits, string> = {
  "m-cm": "m / cm (hochgestellte 5)",
  m: "Meter",
  cm: "Zentimeter",
};
export const DIMENSION_STYLE_DEFAULTS = {
  terminator: "slash",
  units: "m-cm",
  textSize: 2.5,
} as const satisfies { terminator: DimensionTerminator; units: DimensionUnits; textSize: number };
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
    // Display (docs/MASSKETTE.md, Darstellung): optional, absent = building drawing defaults.
    terminator: z.enum(DIMENSION_TERMINATORS).optional(),
    units: z.enum(DIMENSION_UNITS).optional(),
    /** Figure height in paper millimetres. */
    textSize: finite.min(1).max(10).optional(),
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
 * Dimension figure split into main part and superscript (building drawing practice): with
 * "m-cm" below 1 m in centimetres (36⁵ = 36,5 cm), from 1 m in metres with two decimals
 * (2,01⁵ = 2,015 m); values are rounded to half centimetres. "m" gives metres with three
 * decimals where needed, "cm" centimetres with the superscript 5.
 */
export function dimensionFigure(
  metres: number,
  units: DimensionUnits = "m-cm",
): { main: string; sup: string } {
  const de = (value: number, digits: number) =>
    value.toLocaleString("de-DE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  if (units === "m") {
    const mm = Math.round(metres * 1000);
    return { main: de(mm / 1000, mm % 10 === 0 ? 2 : 3), sup: "" };
  }
  const halfCm = Math.round(metres * 200);
  const half = halfCm % 2 === 1 ? "5" : "";
  const cm = Math.floor(halfCm / 2);
  if (units === "cm" || metres < 1) return { main: de(cm, 0), sup: half };
  return { main: de(cm / 100, 2), sup: half };
}

/** Plain text of a figure (menus, lists): superscript 5 as the character ⁵. */
export function formatDimension(metres: number, units: DimensionUnits = "m-cm"): string {
  const { main, sup } = dimensionFigure(metres, units);
  return main + (sup ? "⁵" : "");
}

/**
 * Index of the measured point a click means (docs/MASSKETTE.md, M3): nearest to the click, at
 * the point itself or at the end of its extension line on the dimension line. Null when none
 * lies within `tolerance` metres.
 */
export function dimensionPointAt(
  d: Chain & { offset: number },
  click: Point,
  tolerance: number,
): number | null {
  let best: { index: number; distance: number } | null = null;
  d.points.forEach((p, index) => {
    const foot = d.orientation === "horizontal" ? { x: p.x, y: d.offset } : { x: d.offset, y: p.y };
    const distance = Math.min(
      Math.hypot(click.x - p.x, click.y - p.y),
      Math.hypot(click.x - foot.x, click.y - foot.y),
    );
    if (distance <= tolerance && (!best || distance < best.distance)) best = { index, distance };
  });
  return best === null ? null : (best as { index: number }).index;
}
