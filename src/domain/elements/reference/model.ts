import { z } from "zod";
const id = z.string().trim().min(1);
// Storage contract only. A browser import adapter must decode and verify image content.
const storageAssetSchema = z
  .object({
    id,
    mimeType: z.enum(["image/png", "image/jpeg"]),
    pixelWidth: z.number().int().positive().max(16384),
    pixelHeight: z.number().int().positive().max(16384),
    data: z
      .string()
      .min(4)
      .max(10 * 1024 * 1024)
      .refine((value) => {
        if (value.length % 4 !== 0) return false;
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
        const end = value.length - padding;
        for (let i = 0; i < end; i++) if (!alphabet.includes(value[i]!)) return false;
        return (
          padding === 0 || (alphabet.indexOf(value[end - 1]!) & (padding === 2 ? 15 : 3)) === 0
        );
      }, "Invalid canonical base64"),
  })
  .strict()
  .refine((a) => a.pixelWidth * a.pixelHeight <= 16_000_000, "Image pixel budget exceeded");
// Identity is the capability: no caller-supplied ID/hash/frozen flag is trusted.
// Only the diagnostic pilot currently creates handles. Ordinary parses still copy.
const verifiedAssets = new WeakSet<object>();
export const imageAssetSchema = z.union([
  z.custom<z.infer<typeof storageAssetSchema>>(
    (value) => typeof value === "object" && value !== null && verifiedAssets.has(value),
  ),
  storageAssetSchema,
]);
/** Own and freeze a fully storage-validated copy. This does not replace image decoding. */
export function createImageAssetHandle(value: unknown): ImageAsset {
  const asset = Object.freeze(storageAssetSchema.parse(value));
  verifiedAssets.add(asset);
  return asset;
}
export const imageReferenceSchema = z
  .object({
    id,
    kind: z.literal("image-reference"),
    layerId: id,
    assetId: id,
    origin: z.object({ x: z.number().finite(), y: z.number().finite() }).strict(),
    rotation: z.number().finite(),
    metresPerPixel: z.number().finite().positive(),
  })
  .strict();
export type ImageAsset = z.infer<typeof storageAssetSchema>;
export type ImageReference = z.infer<typeof imageReferenceSchema>;
export function validateReferenceExtent(reference: ImageReference, asset: ImageAsset): void {
  const w = asset.pixelWidth * reference.metresPerPixel;
  const h = asset.pixelHeight * reference.metresPerPixel;
  const c = Math.cos(reference.rotation),
    s = Math.sin(reference.rotation);
  const points = [
    [0, 0],
    [w, 0],
    [w, -h],
    [0, -h],
  ].map(([x, y]) => ({
    x: reference.origin.x + c * x! - s * y!,
    y: reference.origin.y + s * x! + c * y!,
  }));
  if (
    !points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) ||
    points.some((p, i) => {
      const length = Math.hypot(p.x - points[(i + 1) % 4]!.x, p.y - points[(i + 1) % 4]!.y);
      return !Number.isFinite(length) || length === 0;
    })
  )
    throw new Error("Image reference extent is not representable");
}
