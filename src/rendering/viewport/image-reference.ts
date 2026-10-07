import type { ImageReference, ImageAsset } from "../../domain/elements/reference/model.ts";
export function imageReferenceCorners(r: ImageReference, a: ImageAsset) {
  const c = Math.cos(r.rotation),
    s = Math.sin(r.rotation);
  return [
    [0, 0],
    [a.pixelWidth, 0],
    [a.pixelWidth, -a.pixelHeight],
    [0, -a.pixelHeight],
  ].map(([u, v]) => ({
    x: r.origin.x + r.metresPerPixel * (c * u! - s * v!),
    y: r.origin.y + r.metresPerPixel * (s * u! + c * v!),
  }));
}
