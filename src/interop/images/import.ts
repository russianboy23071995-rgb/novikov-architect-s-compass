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

const checkedUrls = new WeakMap<ImageAsset, string | undefined>();
export function checkedImageUrl(asset: ImageAsset): string | undefined {
  if (checkedUrls.has(asset)) return checkedUrls.get(asset);
  const result = checkImageUrl(asset);
  checkedUrls.set(asset, result);
  return result;
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
