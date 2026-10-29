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
export function assertSameWallBase(
  a: { baseOffset?: number | undefined },
  b: { baseOffset?: number | undefined },
) {
  if (wallBase(a) !== wallBase(b))
    throw new Error("Wandanschlüsse benötigen gleiche Fußhöhen. Verbindung zuerst lösen.");
}

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
