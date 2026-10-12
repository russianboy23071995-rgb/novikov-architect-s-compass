/** Isolated experiment: no production import, migration or garbage collection. */
import { validateProject, type Project } from "../src/domain/project/schema.ts";
import type { ImageAsset } from "../src/domain/elements/reference/model.ts";
import {
  payloadKey,
  verifyPayload,
  restoreProject,
  type Document,
  type Manifest,
  type Payload,
  type ReadProbe,
} from "./asset-contract.ts";
const bytes = (value: unknown) => new TextEncoder().encode(JSON.stringify(value)).length;
export type Head = { revision: string; current: Manifest; previous?: Manifest };
export type ReadControl = ReadProbe & {
  signal?: AbortSignal;
  schedule?: () => Promise<void>;
};
/** A real task boundary, not just a resolved promise. No transaction spans this wait. */
export async function readCheckpoint(control: ReadControl) {
  control.signal?.throwIfAborted();
  await (control.schedule?.() ?? new Promise<void>((resolve) => setTimeout(resolve, 0)));
  control.signal?.throwIfAborted();
}
export function createPreparation(profile: 50 | 100 = 50) {
  if (profile !== 50 && profile !== 100) throw new Error("Unknown pilot profile");
  const maxBytes = (profile === 100 ? 128 : 64) * 1024 * 1024;
  const maxPixels = profile === 100 ? 40_000_000 : 32_000_000;
  const cache = new WeakMap<ImageAsset, { key: string; payload: Payload }>();
  let hashes = 0;
  return {
    get hashes() {
      return hashes;
    },
    async prepare(input: Project): Promise<Document> {
      const project = validateProject(input);
      const blobs: Record<string, Payload> = Object.create(null);
      const assets = [];
      let size = 0,
        pixels = 0;
      for (const asset of project.assets) {
        size += asset.data.length;
        pixels += asset.pixelWidth * asset.pixelHeight;
        if (size > maxBytes || pixels > maxPixels) throw new Error("Pilot budget exceeded");
        let entry = cache.get(asset);
        if (!entry) {
          const { id: _id, ...raw } = asset;
          const payload = Object.freeze(verifyPayload(raw));
          entry = { key: await payloadKey(payload), payload };
          hashes++;
          cache.set(asset, entry);
        }
        blobs[entry.key] = entry.payload;
        assets.push({ id: asset.id, key: entry.key });
      }
      return { model: { ...project, assets }, blobs };
    },
  };
}
export function openPilotDatabase(name: string): Promise<IDBDatabase> {
  if (!name.startsWith("novikov-asset-recovery-pilot-"))
    throw new Error("Diagnostic database only");
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1);
    req.onupgradeneeded = () => {
      for (const key of ["assets", "heads", "control"]) req.result.createObjectStore(key);
    };
    req.onerror = () => reject(req.error);
    req.onblocked = () => reject(new Error("Pilot database blocked"));
    req.onsuccess = () => resolve(req.result);
  });
}
export function createAssetRecoveryStore(db: IDBDatabase) {
  return {
    publish(doc: Document, expected: string | null, abortAfterWrites = false) {
      const model = structuredClone(doc.model);
      const payloads = Object.entries(doc.blobs);
      const revision = crypto.randomUUID();
      return new Promise<{
        revision: string;
        payloadWrites: number;
        payloadBytes: number;
        manifestBytes: number;
      }>((resolve, reject) => {
        const tx = db.transaction(["assets", "heads"], "readwrite");
        const heads = tx.objectStore("heads"),
          assets = tx.objectStore("assets");
        let reason = "Transaction aborted",
          payloadWrites = 0,
          payloadBytes = 0,
          manifestBytes = 0;
        tx.onabort = () => reject(new Error(reason));
        tx.onerror = () => {
          reason = tx.error?.message ?? "IndexedDB error";
        };
        tx.oncomplete = () => resolve({ revision, payloadWrites, payloadBytes, manifestBytes });
        const read = heads.get(model.id);
        read.onsuccess = () => {
          const old = read.result as Head | undefined;
          if ((old?.revision ?? null) !== expected) {
            reason = "Revision conflict";
            tx.abort();
            return;
          }
          const next: Head = {
            revision,
            current: model,
            ...(old ? { previous: old.current } : {}),
          };
          manifestBytes = bytes(next);
          let remaining = payloads.length;
          const finish = () => {
            const put = heads.put(next, model.id);
            if (abortAfterWrites)
              put.onsuccess = () => {
                reason = "Injected abort";
                tx.abort();
              };
          };
          if (!remaining) finish();
          for (const [key, payload] of payloads) {
            const check = assets.getKey(key);
            check.onsuccess = () => {
              if (check.result === undefined) {
                assets.add(payload, key);
                payloadWrites++;
                payloadBytes += bytes(payload);
              }
              if (--remaining === 0) finish();
            };
          }
        };
      });
    },
    async read(
      projectId: string,
      previous = false,
      probe: ReadControl = {},
    ): Promise<{ project: Project; revision: string }> {
      probe.signal?.throwIfAborted();
      const readStart = performance.now();
      const snapshot = await new Promise<{
        model: Manifest;
        blobs: Record<string, Payload>;
        revision: string;
      }>((resolve, reject) => {
        const tx = db.transaction(["heads", "assets"], "readonly");
        let model: Manifest, revision: string, problem: Error | undefined;
        const blobs: Record<string, Payload> = Object.create(null);
        tx.onabort = () => reject(problem ?? tx.error ?? new Error("Read aborted"));
        tx.oncomplete = () => resolve({ model, blobs, revision });
        const req = tx.objectStore("heads").get(projectId);
        req.onsuccess = () => {
          const head = req.result as Head | undefined;
          const selected = previous ? head?.previous : head?.current;
          if (!head || !selected || selected.id !== projectId) {
            problem = new Error("Missing or foreign manifest");
            tx.abort();
            return;
          }
          model = selected;
          revision = head.revision;
          for (const key of new Set(model.assets.map((a) => a.key))) {
            const asset = tx.objectStore("assets").get(key);
            asset.onsuccess = () => {
              if (asset.result === undefined) {
                problem = new Error("Missing asset");
                tx.abort();
              } else blobs[key] = asset.result as Payload;
            };
          }
        };
      });
      probe.measure?.("indexedDB", performance.now() - readStart);
      await readCheckpoint(probe);
      for (const [key, raw] of Object.entries(snapshot.blobs)) {
        const payload = verifyPayload(raw, probe);
        if ((await payloadKey(payload, probe)) !== key) throw new Error("Asset integrity mismatch");
        snapshot.blobs[key] = payload;
        await readCheckpoint(probe);
      }
      const validateStart = performance.now();
      const project = restoreProject(snapshot);
      probe.measure?.("model", performance.now() - validateStart);
      // Deliver pending user cancellation before publishing a completely validated result.
      await readCheckpoint(probe);
      return { project, revision: snapshot.revision };
    },
  };
}
