import { createRecoveryV2Storage } from "./recovery-v2-storage.ts";
import { createBoundedRecoveryCodec } from "./recovery-codec.ts";
import { assertProjectFileSize, PROJECT_FILE_LIMIT } from "./size.ts";
import { serializeProject } from "../../lib/bim/model.ts";
import type { RecoveryV2Storage } from "../../application/project-files/recovery-v2.ts";
import type {
  RecoveryCatalog,
  RecoverySummary,
} from "../../application/project-files/recovery-catalog.ts";
import type { RecoveryStorage } from "../../application/project-files/recovery.ts";

export function openRecoveryDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(name, 3);
    request.onupgradeneeded = () => {
      for (const store of [
        "snapshots",
        "recovery-index",
        "recovery-v2-heads",
        "recovery-v2-assets",
      ])
        if (!request.result.objectStoreNames.contains(store))
          request.result.createObjectStore(store);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => {
      blocked = true;
      reject(new Error("Wiederherstellungsspeicher ist durch einen anderen Tab blockiert."));
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
/** One local slot with predecessor; IndexedDB publishes only the completed transaction. */
export function createRecoveryStorage(
  openDatabase: () => Promise<IDBDatabase>,
  key = "manual",
  projectId?: string,
): RecoveryStorage {
  return {
    async read() {
      const db = await openDatabase();
      try {
        return await new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction("snapshots", "readonly");
          const request = tx.objectStore("snapshots").get(key);
          tx.oncomplete = () => resolve(request.result ?? null);
          tx.onabort = () => reject(tx.error ?? new Error("Lesen abgebrochen."));
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    async replace(expected, next) {
      const savedAt =
        projectId === undefined
          ? undefined
          : (JSON.parse(next) as { current: { savedAt: string } }).current.savedAt;
      const db = await openDatabase();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(
            projectId === undefined
              ? ["snapshots"]
              : ["snapshots", "recovery-index", "recovery-v2-heads"],
            "readwrite",
          );
          const store = tx.objectStore("snapshots");
          const request = store.get(key);
          let conflict = false;
          request.onsuccess = () => {
            if ((request.result ?? null) !== expected) {
              conflict = true;
              tx.abort();
              return;
            }
            const write = () => {
              store.put(next, key);
              if (projectId !== undefined)
                tx.objectStore("recovery-index").put({ projectId, savedAt }, projectId);
            };
            if (projectId === undefined) write();
            else {
              const v2 = tx.objectStore("recovery-v2-heads").get(projectId);
              v2.onsuccess = () => {
                if (v2.result !== undefined) {
                  conflict = true;
                  tx.abort();
                } else write();
              };
            }
          };
          tx.oncomplete = () => resolve();
          tx.onabort = () =>
            reject(
              conflict
                ? new Error("Ein anderer Vorgang hat den Snapshot geändert. Erneut versuchen.")
                : (tx.error ??
                    new Error("Speicherung abgebrochen; vorheriger Stand bleibt erhalten.")),
            );
          tx.onerror = () => reject(tx.error ?? new Error("Lokale Speicherung fehlgeschlagen."));
        });
      } finally {
        db.close();
      }
    },
  };
}

export const browserRecoveryStorage = createRecoveryStorage(() =>
  openRecoveryDatabase("novikov-recovery"),
);

/** Metadata and payload publish in the same transaction; listing never loads all project files. */
export function createRecoveryCatalog(
  openDatabase: () => Promise<IDBDatabase>,
  useV2 = false,
): RecoveryCatalog {
  const bounded = createBoundedRecoveryCodec({
    modelBytes: PROJECT_FILE_LIMIT,
    payloadBytes: PROJECT_FILE_LIMIT,
    pixels: 128_000_000,
  });
  const codec = {
    async prepare(project: Parameters<typeof bounded.prepare>[0]) {
      assertProjectFileSize(serializeProject(project));
      return bounded.prepare(project);
    },
    async restore(...args: Parameters<typeof bounded.restore>) {
      const project = await bounded.restore(...args);
      assertProjectFileSize(serializeProject(project));
      return project;
    },
  };
  const projectV2 = (id: string): RecoveryV2Storage => ({
    async read() {
      const db = await openDatabase();
      try {
        return await createRecoveryV2Storage(db, id, codec, {
          legacy: "snapshots",
          heads: "recovery-v2-heads",
          assets: "recovery-v2-assets",
          legacyKey: `project:${id}`,
          index: "recovery-index",
        }).read();
      } finally {
        db.close();
      }
    },
    async publish(...args) {
      const db = await openDatabase();
      try {
        await createRecoveryV2Storage(db, id, codec, {
          legacy: "snapshots",
          heads: "recovery-v2-heads",
          assets: "recovery-v2-assets",
          legacyKey: `project:${id}`,
          index: "recovery-index",
        }).publish(...args);
      } finally {
        db.close();
      }
    },
  });
  return {
    ...(useV2 ? { v2: { codec, project: projectV2 } } : {}),
    legacy: createRecoveryStorage(openDatabase),
    project: (id) => createRecoveryStorage(openDatabase, `project:${id}`, id),
    async list() {
      const db = await openDatabase();
      try {
        return await new Promise<RecoverySummary[]>((resolve, reject) => {
          const tx = db.transaction("recovery-index", "readonly");
          const request = tx.objectStore("recovery-index").getAll();
          tx.oncomplete = () => resolve(request.result);
          tx.onabort = () => reject(tx.error ?? new Error("Projektliste nicht verfügbar."));
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
  };
}
const localListeners = new Set<() => void>();
let changeChannel: BroadcastChannel | undefined;
/** Browser-specific wake-up hint only; consumers always reread the authoritative database. */
export function subscribeRecoveryChanges(listener: () => void) {
  localListeners.add(listener);
  if (!changeChannel && typeof BroadcastChannel !== "undefined") {
    changeChannel = new BroadcastChannel("novikov-recovery-changes");
    changeChannel.onmessage = () => {
      for (const notify of localListeners) notify();
    };
  }
  return () => {
    localListeners.delete(listener);
    if (!localListeners.size) {
      changeChannel?.close();
      changeChannel = undefined;
    }
  };
}
const catalog = createRecoveryCatalog(() => openRecoveryDatabase("novikov-recovery"), true);
function notifyRecoveryChanged() {
  // Notify only after commit. Failure of a hint must never report a committed save as failed.
  for (const notify of localListeners) {
    try {
      notify();
    } catch {
      /* Observer is disposable. */
    }
  }
  try {
    if (changeChannel) changeChannel.postMessage("changed");
    else if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel("novikov-recovery-changes");
      channel.postMessage("changed");
      channel.close();
    }
  } catch {
    /* Focus refresh remains available. */
  }
}
export const browserRecoveryCatalog: RecoveryCatalog = {
  ...catalog,
  v2: {
    codec: catalog.v2!.codec,
    project(id) {
      const port = catalog.v2!.project(id);
      return {
        read: port.read,
        async publish(...args) {
          await port.publish(...args);
          notifyRecoveryChanged();
        },
      };
    },
  },
  project(id) {
    const storage = catalog.project(id);
    return {
      read: storage.read,
      async replace(expected, next) {
        await storage.replace(expected, next);
        notifyRecoveryChanged();
      },
    };
  },
};
