import {
  parseRecoveryRecord,
  prepareRecoverySnapshot,
} from "../../application/project-files/recovery.ts";
import type {
  RecoveryV2Codec,
  RecoveryRecordV2,
} from "../../application/project-files/recovery-v2.ts";
import { restoreRecoveryV2 } from "../../application/project-files/recovery-v2.ts";
import { createRecoveryV2Storage } from "./recovery-v2-storage.ts";

type Entry = { key: IDBValidKey; value: unknown };
function readEntries(db: IDBDatabase, store: string): Promise<Entry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store),
      entries: Entry[] = [];
    const request = tx.objectStore(store).openCursor();
    request.onsuccess = () => {
      const cursor = request.result;
      if (cursor) {
        entries.push({ key: cursor.key, value: cursor.value });
        cursor.continue();
      }
    };
    tx.oncomplete = () => resolve(entries);
    tx.onabort = () => reject(tx.error);
  });
}
function stored(record: RecoveryRecordV2) {
  const strip = (s: RecoveryRecordV2["current"]) => ({
    savedAt: s.savedAt,
    model: s.document.model,
  });
  return {
    version: record.version,
    projectId: record.projectId,
    revision: record.revision,
    current: strip(record.current),
    ...(record.previous ? { previous: strip(record.previous) } : {}),
  };
}
export type RetentionResult =
  | { status: "collected"; deleted: number; retained: number }
  | { status: "skipped"; reason: "unreadable-roots" | "changed-roots" | "unreadable-legacy" };
/** Diagnostic-only entry point. No production caller. Validation may yield; deletion never
 * trusts that old read: all heads are compared again inside the serializable write transaction.
 * Valid V1 snapshots embed their image bytes and remain untouched. Unknown legacy data blocks GC.
 */
export async function collectRecoveryV2Pilot(
  db: IDBDatabase,
  codec: RecoveryV2Codec,
  signal?: AbortSignal,
  layoutForSlot = (id: string) => ({
    legacy: "legacy",
    heads: "heads",
    assets: "assets",
    legacyKey: id,
    index: "",
  }),
): Promise<RetentionResult> {
  if (!db.name.startsWith("novikov-recovery-v2-pilot-"))
    throw new Error("Diagnostic database only");
  signal?.throwIfAborted();
  const layout = layoutForSlot("");
  const expected = await readEntries(db, layout.heads);
  const expectedLegacy = await readEntries(db, layout.legacy);
  try {
    for (const entry of expectedLegacy) {
      signal?.throwIfAborted();
      if (typeof entry.value !== "string") throw new Error("Unknown legacy data");
      const record = parseRecoveryRecord(entry.value);
      if (Object.keys(record).some((k) => !["version", "current", "previous"].includes(k)))
        throw new Error("Unknown legacy fields");
      for (const snapshot of [
        record.current,
        ...(record.previous !== undefined ? [record.previous] : []),
      ]) {
        if (Object.keys(snapshot).some((k) => !["savedAt", "json"].includes(k)))
          throw new Error("Unknown legacy snapshot fields");
        await prepareRecoverySnapshot(snapshot);
      }
    }
  } catch {
    signal?.throwIfAborted();
    return { status: "skipped", reason: "unreadable-legacy" };
  }
  const validatedKeys = new Set<string>();
  try {
    for (const entry of expected) {
      signal?.throwIfAborted();
      if (typeof entry.key !== "string") throw new Error("Invalid slot key");
      const source = await createRecoveryV2Storage(
        db,
        entry.key,
        codec,
        layoutForSlot(entry.key),
      ).read();
      const record = source.record as RecoveryRecordV2;
      // Check each candidate individually: fallback success must not authorize deletion.
      await restoreRecoveryV2({ ...record, previous: undefined }, entry.key, codec, signal);
      if (record.previous)
        await restoreRecoveryV2(
          { ...record, current: record.previous, previous: undefined },
          entry.key,
          codec,
          signal,
        );
      if (JSON.stringify(stored(record)) !== JSON.stringify(entry.value))
        throw new Error("Unrecognized or changed root");
      for (const snapshot of [record.current, record.previous])
        for (const link of snapshot?.document.model.assets ?? []) validatedKeys.add(link.key);
    }
  } catch {
    signal?.throwIfAborted();
    return { status: "skipped", reason: "unreadable-roots" };
  }
  signal?.throwIfAborted();
  return new Promise((resolve, reject) => {
    // Same scope as publish/migrate. A competing writer runs wholly before or after us.
    const tx = db.transaction(
      [layout.legacy, layout.heads, layout.assets, ...(layout.index ? [layout.index] : [])],
      "readwrite",
    );
    let result: RetentionResult = { status: "skipped", reason: "changed-roots" };
    let deleted = 0,
      retained = 0;
    const abort = () => {
      try {
        tx.abort();
      } catch {
        /* committed: success wins */
      }
    };
    const cleanup = () => signal?.removeEventListener("abort", abort);
    tx.onabort = () => {
      cleanup();
      reject(signal?.reason ?? tx.error ?? new Error("Retention aborted"));
    };
    tx.oncomplete = () => {
      cleanup();
      resolve(result);
    };
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
      return;
    }
    const entries: Entry[] = [];
    const legacyEntries: Entry[] = [];
    const legacy = tx.objectStore(layout.legacy).openCursor();
    let legacyDone = false,
      headsDone = false;
    legacy.onsuccess = () => {
      const cursor = legacy.result;
      if (cursor) {
        legacyEntries.push({ key: cursor.key, value: cursor.value });
        cursor.continue();
      } else {
        legacyDone = true;
        collect();
      }
    };
    const heads = tx.objectStore(layout.heads).openCursor();
    heads.onsuccess = () => {
      const cursor = heads.result;
      if (cursor) {
        entries.push({ key: cursor.key, value: cursor.value });
        cursor.continue();
        return;
      }
      headsDone = true;
      collect();
    };
    const collect = () => {
      if (!legacyDone || !headsDone) return;
      if (JSON.stringify(legacyEntries) !== JSON.stringify(expectedLegacy)) return;
      if (JSON.stringify(entries) !== JSON.stringify(expected)) return;
      // Root set is usable only after every slot matches the fully validated snapshot.
      const roots = validatedKeys;
      // Keys only: never load all image payloads just to delete an orphan.
      const assets = tx.objectStore(layout.assets).openKeyCursor();
      assets.onsuccess = () => {
        const cursor = assets.result;
        if (!cursor) {
          result = { status: "collected", deleted, retained };
          return;
        }
        if (typeof cursor.key === "string" && roots.has(cursor.key)) retained++;
        else {
          tx.objectStore(layout.assets).delete(cursor.primaryKey);
          deleted++;
        }
        cursor.continue();
      };
    };
  });
}
