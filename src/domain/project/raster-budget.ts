/** Conservative project admission budget, not a claim about actual decoder/GPU RAM.
 * Count each stored asset once, even identical payloads under different IDs.
 * Multiple drawing references to one asset do not multiply this budget.
 */
export const PROJECT_RASTER_PIXEL_LIMIT = 128_000_000;
type Raster = { pixelWidth: number; pixelHeight: number };
export function rasterPixels(assets: readonly Raster[]): number {
  let pixels = 0;
  for (const a of assets) {
    if (![a.pixelWidth, a.pixelHeight].every((n) => Number.isSafeInteger(n) && n > 0))
      throw new Error("Ungültige Bildabmessungen.");
    pixels += a.pixelWidth * a.pixelHeight;
    if (!Number.isSafeInteger(pixels)) throw new Error("Ungültiges Gesamtpixelbudget.");
  }
  return pixels;
}
export function rasterBudgetWarning(project: { assets: readonly Raster[] }): string | null {
  const pixels = rasterPixels(project.assets);
  return pixels > PROJECT_RASTER_PIXEL_LIMIT
    ? `Dieses Projekt enthält ${(pixels / 1_000_000).toLocaleString("de-DE")} Millionen Bildpixel (Grenze: 128 Millionen). Lokale Sicherung nicht möglich. Bitte als Projektdatei herunterladen; für lokale Sicherungen Bilddaten reduzieren. Vorhandene Sicherungen bleiben erhalten.`
    : null;
}
export function assertProjectRasterBudget(project: { assets: readonly Raster[] }): void {
  const warning = rasterBudgetWarning(project);
  if (warning) throw new Error(warning);
}
/** Compatibility: existing oversized files remain editable/exportable, but cannot grow. */
export function assertRasterBudgetChange(
  previous: { assets: readonly Raster[] },
  next: { assets: readonly Raster[] },
): void {
  if (rasterPixels(next.assets) > rasterPixels(previous.assets)) assertProjectRasterBudget(next);
}
