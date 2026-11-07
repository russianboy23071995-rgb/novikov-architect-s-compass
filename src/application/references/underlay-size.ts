import { parseMetres } from "../../core/units/metres.ts";

/**
 * Defaults of the underlay tool (docs/BILDUNTERLAGE.md, B1): the size of a new underlay from a
 * width in metres or from the plan scale and the scan resolution, and how it shows.
 */
export type UnderlayDefaults = {
  size: "width" | "scale";
  width: string;
  denominator: string;
  dpi: string;
  /** Percent, 5–100. */
  opacity: number;
  grayscale: boolean;
};
export const UNDERLAY_DEFAULTS: UnderlayDefaults = {
  size: "width",
  width: "5",
  denominator: "100",
  dpi: "300",
  opacity: 50,
  grayscale: false,
};

/** Metres per pixel of a new underlay from the defaults; throws a message for the bar. */
export function underlayMetresPerPixel(
  defaults: UnderlayDefaults,
  pixelWidth: number,
  /** Stored pixels per source pixel (B5): a scan scaled to half has twice the metres per pixel. */
  scale = 1,
): number {
  if (defaults.size === "width") {
    const metres = parseMetres(defaults.width);
    if (!Number.isFinite(metres) || metres <= 0)
      throw new Error("Positive Bildbreite in Metern eingeben.");
    return metres / pixelWidth;
  }
  const denominator = Number(defaults.denominator.trim().replace(",", "."));
  const dpi = Number(defaults.dpi.trim().replace(",", "."));
  if (!Number.isFinite(denominator) || denominator <= 0)
    throw new Error("Maßstab eingeben, z. B. 100 für 1:100.");
  if (!Number.isFinite(dpi) || dpi <= 0) throw new Error("Auflösung in dpi eingeben, z. B. 300.");
  return metresPerPixelAtScale(denominator, dpi) / scale;
}

/** Metres per pixel of a scan: plan scale 1:denominator at `dpi` dots per inch. */
export function metresPerPixelAtScale(denominator: number, dpi: number): number {
  return (denominator * 0.0254) / dpi;
}
