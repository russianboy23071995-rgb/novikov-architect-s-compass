import { createImageAssetHandle } from "../src/domain/elements/reference/model.ts";
import { openRecoveryDatabase } from "../src/interop/project-file/recovery-storage.ts";
export function image(seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1024;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(1024, 1024);
  let value = seed;
  for (let i = 0; i < pixels.data.length; i += 4) {
    value = (Math.imul(value, 1664525) + 1013904223) | 0;
    pixels.data[i] = value & 255;
    pixels.data[i + 1] = (value >>> 8) & 255;
    pixels.data[i + 2] = (value >>> 16) & 255;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return createImageAssetHandle({
    id: "image",
    mimeType: "image/png",
    pixelWidth: 1024,
    pixelHeight: 1024,
    data: canvas.toDataURL().split(",")[1],
  });
}
export async function payloadStats(name: string) {
  const db = await openRecoveryDatabase(name);
  try {
    return await new Promise<{ count: number; base64Characters: number }>((resolve, reject) => {
      const tx = db.transaction("recovery-v2-assets"),
        req = tx.objectStore("recovery-v2-assets").openCursor();
      let count = 0,
        base64Characters = 0;
      req.onsuccess = () => {
        const c = req.result;
        if (c) {
          count++;
          base64Characters += String(c.value.data ?? "").length;
          c.continue();
        }
      };
      tx.oncomplete = () => resolve({ count, base64Characters });
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
