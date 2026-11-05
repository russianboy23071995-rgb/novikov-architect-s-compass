/** Local metres relative to the containing storey, never the absolute building datum. */
export function wallBase(wall: { baseOffset?: number | undefined }, storeyElevation = 0): number {
  const value = storeyElevation + (wall.baseOffset ?? 0);
  if (!Number.isFinite(value)) throw new Error("Ungültige Wandfußhöhe.");
  return value;
}
export function wallHeights(
  wall: { baseOffset?: number | undefined; height: number },
  storeyElevation = 0,
) {
  const bottom = wallBase(wall, storeyElevation),
    top = bottom + wall.height;
  if (!Number.isFinite(top) || top <= bottom) throw new Error("Ungültige Wandhöhen.");
  return { bottom, top };
}
type WallRange = { baseOffset?: number | undefined; height: number };
const HEIGHT_TOLERANCE = 1e-9; // Metres; base plus height is a sum and may differ in the last bit.

/** Joined walls must share some height (docs/WALL_JUNCTIONS.md, L09 U1); feet may differ. */
export function assertWallsOverlapVertically(a: WallRange, b: WallRange) {
  const [x, y] = [wallHeights(a), wallHeights(b)];
  if (Math.min(x.top, y.top) - Math.max(x.bottom, y.bottom) <= HEIGHT_TOLERANCE)
    throw new Error(
      "Wandanschlüsse benötigen Wände, die sich in der Höhe überschneiden. Verbindung zuerst lösen.",
    );
}

/**
 * Corner rule by height (L09 U1): equal feet and heights mitre; otherwise the wall that covers
 * the other's whole height runs through (butt joint). Partly overlapping walls form no corner.
 */
export function cornerHeightRule(
  a: WallRange,
  b: WallRange,
): "mitre" | "first-through" | "second-through" | null {
  if (wallBase(a) === wallBase(b) && a.height === b.height) return "mitre";
  const [x, y] = [wallHeights(a), wallHeights(b)];
  const covers = (p: typeof x, q: typeof x) =>
    p.bottom <= q.bottom + HEIGHT_TOLERANCE && p.top >= q.top - HEIGHT_TOLERANCE;
  if (covers(x, y)) return "first-through";
  if (covers(y, x)) return "second-through";
  return null;
}
export const CORNER_HEIGHT_MESSAGE =
  "Eckanschluss: Eine Wand muss die andere in der Höhe ganz überdecken. Verbindung zuerst lösen.";

export type WallTopRule =
  Readonly<{ kind: "fixed"; height: number }> | Readonly<{ kind: "storey"; topOffset: number }>;

/** Calculation contract only: the caller resolves the own storey's upper level (OK raw floor
 * of the storey above). No active-storey fallback and no stored derived height. Both
 * elevations share a datum.
 */
export function resolveWallHeightRule(
  wall: Readonly<{ baseOffset?: number | undefined }>,
  storeyElevation: number,
  rule: WallTopRule,
  upperElevation?: number,
): Readonly<{ bottom: number; top: number; height: number }> {
  if (rule.kind === "fixed") {
    const levels = wallHeights({ ...wall, height: rule.height }, storeyElevation);
    return Object.freeze({ ...levels, height: rule.height });
  }
  if (rule.kind !== "storey" || upperElevation === undefined)
    throw new Error("Der Geschossbezug fehlt.");
  if (!Number.isFinite(upperElevation) || !Number.isFinite(rule.topOffset))
    throw new Error("Ungültiger Geschossbezug oder Zusatzhöhe.");
  const bottom = wallBase(wall, storeyElevation);
  const top = upperElevation + rule.topOffset;
  const height = top - bottom;
  if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0)
    throw new Error("Die Wandoberkante muss oberhalb des Wandfußes liegen.");
  return Object.freeze({ bottom, top, height });
}
