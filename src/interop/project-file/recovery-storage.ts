import type { RecoveryStorage } from "../../application/project-files/recovery.ts";

export function openRecoveryDatabase(name: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let blocked = false;
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("snapshots");
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
export function createRecoveryStorage(openDatabase: () => Promise<IDBDatabase>): RecoveryStorage {
  return {
    async read() {
      const db = await openDatabase();
      try {
        return await new Promise<string | null>((resolve, reject) => {
          const tx = db.transaction("snapshots", "readonly");
          const request = tx.objectStore("snapshots").get("manual");
          tx.oncomplete = () => resolve(request.result ?? null);
          tx.onabort = () => reject(tx.error ?? new Error("Lesen abgebrochen."));
          tx.onerror = () => reject(tx.error);
        });
      } finally {
        db.close();
      }
    },
    async replace(expected, next) {
      const db = await openDatabase();
      try {
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction("snapshots", "readwrite");
          const store = tx.objectStore("snapshots");
          const request = store.get("manual");
          let conflict = false;
          request.onsuccess = () => {
            if ((request.result ?? null) !== expected) {
              conflict = true;
              tx.abort();
              return;
            }
            store.put(next, "manual");
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
