import {
  createImageAssetHandle,
  isImageAssetHandle,
  type ImageAsset,
} from "../../domain/elements/reference/model.ts";
// Individual image sources keep their own budget.
export const IMAGE_SOURCE_FILE_LIMIT = 10 * 1024 * 1024;
/** Largest source file the import reads (docs/BILDUNTERLAGE.md, B5); the stored asset keeps
 * IMAGE_SOURCE_FILE_LIMIT. */
export const IMAGE_IMPORT_FILE_LIMIT = 64 * 1024 * 1024;
/** Largest source raster the import decodes, scaled down before it is stored (B5). */
export const IMAGE_IMPORT_PIXEL_LIMIT = 150_000_000;
/** Stored raster: the asset schema's limits. */
const STORED_PIXEL_LIMIT = 16_000_000;
const STORED_SIDE_LIMIT = 16384;

/** Reads dimensions before raster decode. Strings must be decoded binary (atob), not base64. */
export function imageHeader(bytes: Uint8Array | string) {
  const { width, height, mimeType } = rawImageHeader(bytes);
  if (!width || !height || width > 16384 || height > 16384 || width * height > 16_000_000)
    throw new Error("Bildmaße ungültig oder größer als 16 Millionen Pixel.");
  return { width, height, mimeType };
}

/** Header of a source file for the import: larger sizes than a stored asset (B5). */
export function sourceImageHeader(bytes: Uint8Array) {
  const { width, height, mimeType } = rawImageHeader(bytes);
  if (!width || !height || width > 65535 || height > 65535) throw new Error("Bildmaße ungültig.");
  if (width * height > IMAGE_IMPORT_PIXEL_LIMIT)
    throw new Error("Bild zu groß: höchstens 150 Millionen Pixel.");
  return { width, height, mimeType };
}

/**
 * Scale that brings a raster within the stored limits (16 million pixels, 16384 px a side), at
 * most 1 (B5).
 */
export function storedScale(width: number, height: number): number {
  return Math.min(
    1,
    Math.sqrt(STORED_PIXEL_LIMIT / (width * height)),
    STORED_SIDE_LIMIT / width,
    STORED_SIDE_LIMIT / height,
  );
}

function rawImageHeader(bytes: Uint8Array | string) {
  const byte = (index: number) =>
    typeof bytes === "string" ? bytes.charCodeAt(index) : bytes[index]!;
  const uint = (index: number, count: number) => {
    if (index + count > bytes.length)
      throw new RangeError("Offset is outside the bounds of the DataView");
    let value = 0;
    for (let n = 0; n < count; n++) value = value * 256 + byte(index + n);
    return value;
  };
  let width = 0,
    height = 0,
    mimeType: "image/png" | "image/jpeg";
  if (bytes.length >= 24 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => byte(i) === v)) {
    mimeType = "image/png";
    width = uint(16, 4);
    height = uint(20, 4);
  } else if (byte(0) === 255 && byte(1) === 216) {
    mimeType = "image/jpeg";
    let i = 2;
    while (i + 3 < bytes.length) {
      if (byte(i++) !== 255) throw new Error("Ungültiges JPEG.");
      while (byte(i) === 255) i++;
      const marker = byte(i++)!;
      if (marker === 217 || marker === 218) break;
      const length = uint(i, 2);
      if (length < 2 || i + length > bytes.length) break;
      if ([192, 193, 194].includes(marker) && length >= 8) {
        height = uint(i + 3, 2);
        width = uint(i + 5, 2);
        break;
      }
      i += length;
    }
  } else throw new Error("Nur PNG und JPEG werden unterstützt.");
  return { width, height, mimeType };
}
/** Whether a decoded raster keeps the sides of its header (no EXIF quarter turn). */
function sameOrientation(
  raster: { width: number; height: number },
  header: { width: number; height: number },
) {
  return (
    Math.abs(raster.width / raster.height - header.width / header.height) <=
    Math.abs(raster.width / raster.height - header.height / header.width)
  );
}

/** An imported image and how it was fitted (docs/BILDUNTERLAGE.md, B5). */
export type ImportedImage = {
  asset: ImageAsset;
  /** Pixels of the source file. */
  source: { width: number; height: number };
  /** Stored size relative to the source, 1 when unchanged: scan dpi times this is stored dpi. */
  scale: number;
};

/**
 * Reads a PNG or JPEG for an underlay. A large scan is not refused but fitted (B5): scaled to at
 * most 16 million pixels and stored as PNG, or as JPEG when the PNG data would pass 10 MiB,
 * smaller still if needed.
 */
export async function importFittedImage(file: File, id: string): Promise<ImportedImage> {
  if (file.size > IMAGE_IMPORT_FILE_LIMIT) throw new Error("Bilddatei zu groß (maximal 64 MiB).");
  const header = sourceImageHeader(new Uint8Array(await file.arrayBuffer()));
  const first = storedScale(header.width, header.height);
  const bitmap = await createImageBitmap(
    file,
    first < 1
      ? {
          imageOrientation: "from-image",
          resizeWidth: Math.max(1, Math.floor(header.width * first)),
          resizeQuality: "high",
        }
      : { imageOrientation: "from-image" },
  );
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Bilddekodierung nicht verfügbar.");
    let factor = storedScale(bitmap.width, bitmap.height);
    for (let attempt = 0; attempt < 8; attempt++) {
      canvas.width = Math.max(1, Math.floor(bitmap.width * factor));
      canvas.height = Math.max(1, Math.floor(bitmap.height * factor));
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      // PNG keeps line drawings sharp; a photo or a large scan fits as JPEG.
      for (const [mimeType, quality] of [
        ["image/png", undefined],
        ["image/jpeg", 0.9],
        ["image/jpeg", 0.8],
      ] as const) {
        const data = canvas.toDataURL(mimeType, quality).split(",")[1]!;
        if (data.length <= IMAGE_SOURCE_FILE_LIMIT)
          return {
            asset: createImageAssetHandle({
              id,
              mimeType,
              pixelWidth: canvas.width,
              pixelHeight: canvas.height,
              data,
            }),
            source: { width: header.width, height: header.height },
            // Width over width keeps the stated width exact; turned by its orientation, the
            // stored width belongs to the source height.
            scale: sameOrientation(canvas, header)
              ? canvas.width / header.width
              : canvas.width / header.height,
          };
      }
      factor *= 0.75;
    }
    throw new Error("Bild lässt sich nicht klein genug speichern.");
  } finally {
    bitmap.close();
  }
}

// Derived presentation data only: retain at most eight results and 48 MiB of
// conservative UTF-16 string payload (input + URL). No project/asset objects are
// retained. Exact contents and metadata, not IDs or object identity, define reuse.
const MAX_CHECKED_URLS = 8;
const MAX_CHECKED_URL_BYTES = 48 * 1024 * 1024;
type CheckedUrl = Pick<ImageAsset, "data" | "mimeType" | "pixelWidth" | "pixelHeight"> & {
  url: string | undefined;
  retainedBytes: number;
};
const checkedUrls: CheckedUrl[] = [];
let checkedUrlBytes = 0;
// Weak ownership: URLs live only as long as their verified immutable asset.
// Storage validation alone is insufficient: the first access still checks the header.
const handleUrls = new WeakMap<ImageAsset, string | undefined>();
export function checkedImageUrl(asset: ImageAsset): string | undefined {
  if (isImageAssetHandle(asset)) {
    if (handleUrls.has(asset)) return handleUrls.get(asset);
    const url = checkImageUrl(asset);
    handleUrls.set(asset, url);
    return url;
  }
  const index = checkedUrls.findIndex(
    (entry) =>
      entry.mimeType === asset.mimeType &&
      entry.pixelWidth === asset.pixelWidth &&
      entry.pixelHeight === asset.pixelHeight &&
      entry.data === asset.data,
  );
  if (index !== -1) {
    const [entry] = checkedUrls.splice(index, 1);
    checkedUrls.push(entry!);
    return entry!.url;
  }
  const url = checkImageUrl(asset);
  const retainedBytes = 2 * (asset.data.length + (url?.length ?? 0));
  if (retainedBytes <= MAX_CHECKED_URL_BYTES) {
    while (
      checkedUrls.length >= MAX_CHECKED_URLS ||
      checkedUrlBytes + retainedBytes > MAX_CHECKED_URL_BYTES
    ) {
      checkedUrlBytes -= checkedUrls.shift()!.retainedBytes;
    }
    checkedUrls.push({
      data: asset.data,
      mimeType: asset.mimeType,
      pixelWidth: asset.pixelWidth,
      pixelHeight: asset.pixelHeight,
      url,
      retainedBytes,
    });
    checkedUrlBytes += retainedBytes;
  }
  return url;
}
function checkImageUrl(asset: ImageAsset): string | undefined {
  try {
    const binary = atob(asset.data);
    const header = imageHeader(binary);
    if (
      header.width !== asset.pixelWidth ||
      header.height !== asset.pixelHeight ||
      header.mimeType !== asset.mimeType
    )
      return undefined;
    return `data:${asset.mimeType};base64,${asset.data}`;
  } catch {
    return undefined;
  }
}

/** The stored asset of an import alone, for callers that need no fit information. */
export async function importImage(file: File, id: string): Promise<ImageAsset> {
  return (await importFittedImage(file, id)).asset;
}
