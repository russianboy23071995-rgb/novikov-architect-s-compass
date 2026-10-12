import type {
  RecoveryCatalog,
  RecoverySummary,
} from "../../application/project-files/recovery-catalog.ts";
import type { RecoveryStorage } from "../../application/project-files/recovery.ts";

export function openRecoveryDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(name, 2);
    request.onupgradeneeded = () => {
      for (const store of ["snapshots", "recovery-index"])
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
      else resolve(request.result);
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
            projectId === undefined ? ["snapshots"] : ["snapshots", "recovery-index"],
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
            store.put(next, key);
            if (projectId !== undefined) {
              tx.objectStore("recovery-index").put({ projectId, savedAt }, projectId);
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
export function createRecoveryCatalog(openDatabase: () => Promise<IDBDatabase>): RecoveryCatalog {
  return {
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
const catalog = createRecoveryCatalog(() => openRecoveryDatabase("novikov-recovery"));
export const browserRecoveryCatalog: RecoveryCatalog = {
  ...catalog,
  project(id) {
    const storage = catalog.project(id);
    return {
      read: storage.read,
      async replace(expected, next) {
        await storage.replace(expected, next);
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
      },
    };
  },
};
