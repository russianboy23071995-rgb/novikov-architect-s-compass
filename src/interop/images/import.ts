import { imageAssetSchema, type ImageAsset } from "../../domain/elements/reference/model.ts";
import { PROJECT_FILE_LIMIT } from "../project-file/size.ts";
/** Reads dimensions before decode to bound raster allocation. */
export function imageHeader(bytes: Uint8Array) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let width = 0,
    height = 0,
    mimeType: "image/png" | "image/jpeg";
  if (bytes.length >= 24 && [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v)) {
    mimeType = "image/png";
    width = view.getUint32(16);
    height = view.getUint32(20);
  } else if (bytes[0] === 255 && bytes[1] === 216) {
    mimeType = "image/jpeg";
    let i = 2;
    while (i + 3 < bytes.length) {
      if (bytes[i++] !== 255) throw new Error("Ungültiges JPEG.");
      while (bytes[i] === 255) i++;
      const marker = bytes[i++]!;
      if (marker === 217 || marker === 218) break;
      const length = view.getUint16(i);
      if (length < 2 || i + length > bytes.length) break;
      if ([192, 193, 194].includes(marker) && length >= 8) {
        height = view.getUint16(i + 3);
        width = view.getUint16(i + 5);
        break;
      }
      i += length;
    }
  } else throw new Error("Nur PNG und JPEG werden unterstützt.");
  if (!width || !height || width > 16384 || height > 16384 || width * height > 16_000_000)
    throw new Error("Bildmaße ungültig oder größer als 16 Millionen Pixel.");
  return { width, height, mimeType };
}
export async function importImage(file: File, id: string): Promise<ImageAsset> {
  if (file.size > PROJECT_FILE_LIMIT) throw new Error("Bilddatei zu groß (maximal 10 MiB).");
  imageHeader(new Uint8Array(await file.arrayBuffer()));
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    if (bitmap.width * bitmap.height > 16_000_000 || bitmap.width > 16384 || bitmap.height > 16384)
      throw new Error("Bild zu groß.");
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Bilddekodierung nicht verfügbar.");
    ctx.drawImage(bitmap, 0, 0);
    const data = canvas.toDataURL("image/png").split(",")[1]!;
    return imageAssetSchema.parse({
      id,
      mimeType: "image/png",
      pixelWidth: bitmap.width,
      pixelHeight: bitmap.height,
      data,
    });
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
export function checkedImageUrl(asset: ImageAsset): string | undefined {
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
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const header = imageHeader(bytes);
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
