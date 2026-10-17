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

/** Provisional raw slab thickness in metres, until a real slab supplies the reference. */
export const DEFAULT_RAW_SLAB_THICKNESS = 0.2;

export type WallTopRule =
  | Readonly<{ kind: "fixed"; height: number }>
  | Readonly<{ kind: "slab-underside"; topOffset: number }>;

/** Calculation contract only: the caller resolves the explicit upper storey/reference.
 * No active-storey fallback and no stored derived height. Both elevations share a datum.
 */
export function resolveWallHeightRule(
  wall: Readonly<{ baseOffset?: number | undefined }>,
  storeyElevation: number,
  rule: WallTopRule,
  upperSlab?: Readonly<{ topElevation: number; thickness: number }>,
): Readonly<{ bottom: number; top: number; height: number }> {
  if (rule.kind === "fixed") {
    const levels = wallHeights({ ...wall, height: rule.height }, storeyElevation);
    return Object.freeze({ ...levels, height: rule.height });
  }
  if (rule.kind !== "slab-underside" || !upperSlab)
    throw new Error("Der obere Rohdeckenbezug fehlt.");
  if (
    !Number.isFinite(upperSlab.topElevation) ||
    !Number.isFinite(upperSlab.thickness) ||
    upperSlab.thickness <= 0 ||
    !Number.isFinite(rule.topOffset)
  )
    throw new Error("Ungültiger Rohdeckenbezug oder Höhenversatz.");
  const underside = upperSlab.topElevation - upperSlab.thickness;
  if (!Number.isFinite(underside) || underside >= upperSlab.topElevation)
    throw new Error("Die Rohdeckenunterkante ist numerisch nicht darstellbar.");
  const bottom = wallBase(wall, storeyElevation);
  const top = underside + rule.topOffset;
  const height = top - bottom;
  if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0)
    throw new Error("Die Wandoberkante muss oberhalb des Wandfußes liegen.");
  return Object.freeze({ bottom, top, height });
}
