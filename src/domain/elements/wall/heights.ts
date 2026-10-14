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
