import {
  isRecoverySnapshotChecked,
  markRecoverySnapshotChecked,
  parseRecoveryV2,
  restoreRecoveryV2,
  sealRecoverySnapshot,
  type RecoveryV2Storage,
  type RecoveryV2Codec,
  type RecoveryRecordV2,
  type RecoverySnapshotV2,
  type RecoveryPayload,
} from "../../application/project-files/recovery-v2.ts";

type StoredSnapshot = Omit<RecoverySnapshotV2, "document"> & {
  model: RecoverySnapshotV2["document"]["model"];
};
type StoredHead = Omit<RecoveryRecordV2, "current" | "previous"> & {
  current: StoredSnapshot;
  previous?: StoredSnapshot;
};
const stores = ["legacy", "heads", "assets"];
/** Explicitly isolated until production catalog/upgrade integration is approved. */
export function openRecoveryV2Pilot(name: string): Promise<IDBDatabase> {
  if (!name.startsWith("novikov-recovery-v2-pilot-")) throw new Error("Diagnostic database only");
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      for (const name of stores) request.result.createObjectStore(name);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Recovery database blocked"));
    };
    request.onsuccess = () => {
      if (blocked) request.result.close();
      else {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      }
    };
  });
}
/** Slot-bound adapter. Codec validation precedes transaction; CAS covers concurrent preparation. */
export function createRecoveryV2Storage(
  db: IDBDatabase,
  projectId: string,
  codec: RecoveryV2Codec,
  layout = { legacy: "legacy", heads: "heads", assets: "assets", legacyKey: projectId, index: "" },
): RecoveryV2Storage {
  const stores = [
    layout.legacy,
    layout.heads,
    layout.assets,
    ...(layout.index ? [layout.index] : []),
  ];
  return {
    read() {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(stores, "readonly");
        let legacy: string | null = null,
          record: unknown | null = null,
          problem: unknown;
        const fail = (error: unknown) => {
          problem = error;
          tx.abort();
        };
        tx.onabort = () => reject(problem ?? tx.error ?? new Error("Recovery read aborted"));
        tx.oncomplete = () => resolve({ legacy, record });
        const old = tx.objectStore(layout.legacy).get(layout.legacyKey);
        old.onsuccess = () => {
          if (old.result !== undefined && typeof old.result !== "string") {
            fail(new Error("Invalid legacy slot"));
            return;
          }
          legacy = old.result ?? null;
        };
        const head = tx.objectStore(layout.heads).get(projectId);
        head.onsuccess = () => {
          if (head.result === undefined) return;
          try {
            // Unknown versions remain available to the Application rejection path.
            const raw = head.result as StoredHead;
            if (raw?.version !== 2) {
              record = raw;
              return;
            }
            parseRecoveryV2(raw);
            const hydrate = (s: StoredSnapshot): RecoverySnapshotV2 => {
              const blobs: Record<string, RecoveryPayload> = Object.create(null);
              const result = { savedAt: s?.savedAt, document: { model: s?.model, blobs } };
              // Preserve a malformed candidate so Application can try previous.
              if (Array.isArray(s?.model?.assets)) {
                const keys = s.model.assets.flatMap((a) =>
                  typeof a?.key === "string" ? [a.key] : [],
                );
                for (const key of new Set(keys)) {
                  const asset = tx.objectStore(layout.assets).get(key);
                  asset.onsuccess = () => {
                    if (asset.result !== undefined) blobs[key] = asset.result;
                  };
                }
              }
              return result;
            };
            record = {
              ...raw,
              current: hydrate(raw.current),
              ...(raw.previous ? { previous: hydrate(raw.previous) } : {}),
            };
          } catch (error) {
            fail(error);
          }
        };
      });
    },
    async publish(expected, input, signal, isCurrent = () => true) {
      signal?.throwIfAborted();
      if (!isCurrent()) throw new Error("Recovery context changed");
      // Own the candidate before any async validation; caller mutation cannot alter the commit.
      // Snapshots are sealed: frozen copies that share frozen image payloads instead of copying
      // every image on each save (docs/performance/AUTOSAVE_IMAGE_CHECKS.md).
      const { current, previous, ...record } = input;
      const next: RecoveryRecordV2 = {
        ...structuredClone(record),
        current: sealRecoverySnapshot(current),
        ...(previous ? { previous: sealRecoverySnapshot(previous) } : {}),
      };
      const tokens = { ...expected };
      if (next.projectId !== projectId || next.revision === tokens.revision)
        throw new Error("Recovery context/revision conflict");
      // Validate both individually: an invalid new current must not hide behind previous.
      // A sealed snapshot that already passed this check in this session (the previous save's
      // current) is not checked again.
      const validate = async (current: RecoverySnapshotV2) => {
        if (isRecoverySnapshotChecked(current)) return;
        await restoreRecoveryV2(
          { version: next.version, projectId, revision: next.revision, current },
          projectId,
          codec,
          signal,
          true,
        );
        markRecoverySnapshotChecked(current);
      };
      await validate(next.current);
      if (next.previous) await validate(next.previous);
      signal?.throwIfAborted();
      if (!isCurrent()) throw new Error("Recovery context changed");
      const payloads = new Map<string, Readonly<RecoveryPayload>>();
      const strip = (s: RecoverySnapshotV2): StoredSnapshot => {
        for (const link of s.document.model.assets) {
          const p = s.document.blobs[link.key]!;
          const old = payloads.get(link.key);
          if (old && !samePayload(old, p)) throw new Error("Payload collision");
          payloads.set(link.key, p);
        }
        return { savedAt: s.savedAt, model: s.document.model };
      };
      const head: StoredHead = {
        version: 2,
        projectId,
        revision: next.revision,
        current: strip(next.current),
        ...(next.previous ? { previous: strip(next.previous) } : {}),
      };
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(stores, "readwrite");
        let problem: unknown;
        const abort = () => {
          try {
            tx.abort();
          } catch {
            /* Already committed: success wins. */
          }
        };
        const fail = (error: unknown) => {
          problem = error;
          abort();
        };
        const cleanup = () => signal?.removeEventListener("abort", abort);
        tx.onabort = () => {
          cleanup();
          reject(
            problem ??
              (signal?.aborted ? signal.reason : tx.error) ??
              new Error("Recovery write aborted"),
          );
        };
        tx.oncomplete = () => {
          cleanup();
          resolve();
        };
        signal?.addEventListener("abort", abort, { once: true });
        if (signal?.aborted) {
          abort();
          return;
        }
        const oldLegacy = tx.objectStore(layout.legacy).get(layout.legacyKey);
        const oldHead = tx.objectStore(layout.heads).get(projectId);
        let ready = 0;
        const check = () => {
          if (++ready !== 2) return;
          try {
            const old = oldHead.result === undefined ? null : parseRecoveryV2(oldHead.result);
            if (
              (oldLegacy.result ?? null) !== tokens.legacy ||
              (old?.revision ?? null) !== tokens.revision ||
              (old && old.projectId !== projectId)
            )
              throw new Error("Recovery revision conflict");
            const finish = () => {
              try {
                if (!isCurrent()) throw new Error("Recovery context changed");
                if (layout.index)
                  tx.objectStore(layout.index).put(
                    { projectId, savedAt: head.current.savedAt },
                    projectId,
                  );
                const written = tx.objectStore(layout.heads).put(head, projectId);
                written.onsuccess = () => {
                  try {
                    if (!isCurrent()) fail(new Error("Recovery context changed"));
                  } catch (error) {
                    fail(error);
                  }
                };
              } catch (error) {
                fail(error);
              }
            };
            let remaining = payloads.size;
            const ready = () => {
              if (--remaining === 0) finish();
            };
            if (!remaining) finish();
            // Keys are SHA-256 content keys of checked payloads: an existing key holds this
            // image. Only its presence is read; the stored image is not loaded and compared.
            for (const [key, payload] of payloads) {
              const request = tx.objectStore(layout.assets).getKey(key);
              request.onsuccess = () => {
                if (request.result === undefined)
                  tx.objectStore(layout.assets).add(payload, key).onsuccess = ready;
                else ready();
              };
            }
          } catch (error) {
            fail(error);
          }
        };
        oldLegacy.onsuccess = check;
        oldHead.onsuccess = check;
      });
    },
  };
}
function samePayload(a: RecoveryPayload, b: RecoveryPayload) {
  return (
    a !== null &&
    typeof a === "object" &&
    Object.keys(a).length === 4 &&
    a?.mimeType === b.mimeType &&
    a?.pixelWidth === b.pixelWidth &&
    a?.pixelHeight === b.pixelHeight &&
    a?.data === b.data
  );
}
