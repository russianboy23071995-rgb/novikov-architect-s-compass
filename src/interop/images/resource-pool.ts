import { isImageAssetHandle, type ImageAsset } from "../../domain/elements/reference/model.ts";
import { binaryBytes } from "./binary-bytes.ts";
import { imageHeader } from "./import.ts";

type Port = { create: (bytes: Uint8Array, mime: string) => string; revoke: (url: string) => void };
type Entry = { url: string; bytes: number; users: number };
/** Disposable presentation resources. No persistence, no trust based on asset IDs.
 * Budget includes active blobs; a full pinned pool falls back rather than growing.
 * This does not bound the browser's separate decoded-pixel/GPU cache.
 */
export function createImageResourcePool(
  port: Port,
  budget = { bytes: 64 * 1024 * 1024, entries: 64 },
) {
  if (
    !Number.isSafeInteger(budget.bytes) ||
    budget.bytes < 0 ||
    !Number.isSafeInteger(budget.entries) ||
    budget.entries < 0
  )
    throw new Error("Invalid image resource budget");
  const entries = new Map<ImageAsset, Entry>();
  let sources = new Set<ImageAsset>();
  let bytes = 0;
  let created = 0,
    hits = 0,
    revoked = 0,
    fallbacks = 0;
  const remove = (asset: ImageAsset, entry: Entry) => {
    port.revoke(entry.url);
    entries.delete(asset);
    bytes -= entry.bytes;
    revoked++;
  };
  return {
    setSources(assets: readonly ImageAsset[]) {
      sources = new Set(assets);
      for (const [asset, entry] of entries)
        if (!sources.has(asset) && entry.users === 0) remove(asset, entry);
    },
    acquire(asset: ImageAsset): { url: string; release: () => void } | undefined {
      if (!isImageAssetHandle(asset)) {
        fallbacks++;
        return;
      }
      let entry = entries.get(asset);
      if (entry) {
        hits++;
        entries.delete(asset);
        entries.set(asset, entry);
      } else {
        // Canonical base64 length allows budget rejection before allocating binary data.
        const size =
          (asset.data.length / 4) * 3 -
          (asset.data.endsWith("==") ? 2 : asset.data.endsWith("=") ? 1 : 0);
        if (size > budget.bytes || budget.entries === 0) {
          fallbacks++;
          return;
        }
        for (const [oldAsset, old] of entries) {
          if (bytes + size <= budget.bytes && entries.size < budget.entries) break;
          if (old.users === 0) remove(oldAsset, old);
        }
        if (bytes + size > budget.bytes || entries.size >= budget.entries) {
          fallbacks++;
          return;
        }
        try {
          const binary = atob(asset.data);
          const header = imageHeader(binary);
          if (
            header.width !== asset.pixelWidth ||
            header.height !== asset.pixelHeight ||
            header.mimeType !== asset.mimeType
          ) {
            fallbacks++;
            return;
          }
          const url = port.create(binaryBytes(binary), asset.mimeType);
          entry = { url, bytes: binary.length, users: 0 };
          entries.set(asset, entry);
          bytes += entry.bytes;
          created++;
        } catch {
          fallbacks++;
          return;
        }
      }
      entry.users++;
      const pinned = entry;
      let released = false;
      return {
        url: entry.url,
        release() {
          if (released) return;
          released = true;
          pinned.users--;
          if (pinned.users === 0 && !sources.has(asset)) remove(asset, pinned);
        },
      };
    },
    // Invalidates idle entries immediately; mounted users release their own leases.
    clear() {
      sources.clear();
      for (const [asset, entry] of entries) if (entry.users === 0) remove(asset, entry);
    },
    stats() {
      return {
        entries: entries.size,
        bytes,
        active: [...entries.values()].filter((e) => e.users > 0).length,
        created,
        hits,
        revoked,
        fallbacks,
      };
    },
  };
}
