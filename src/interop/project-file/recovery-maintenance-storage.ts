import type { RecoveryMaintenanceStorage } from "../../application/project-files/recovery-maintenance.ts";
import { createProjectRecoveryCodec } from "./recovery-codec.ts";
import { recoveryV2Layout } from "./recovery-layout.ts";
import { collectRecoveryPayloads } from "./recovery-retention.ts";
import { openRecoveryDatabase } from "./recovery-storage.ts";
/** Explicit action adapter. Construction never opens a database or schedules maintenance. */
export function createRecoveryMaintenanceStorage(
  openDatabase: () => Promise<IDBDatabase>,
): RecoveryMaintenanceStorage {
  const codec = createProjectRecoveryCodec();
  return {
    async collect(signal) {
      signal.throwIfAborted();
      const db = await openDatabase();
      try {
        signal.throwIfAborted();
        return await collectRecoveryPayloads(db, codec, signal, recoveryV2Layout);
      } finally {
        db.close();
      }
    },
  };
}
export const browserRecoveryMaintenance = createRecoveryMaintenanceStorage(() =>
  openRecoveryDatabase("novikov-recovery"),
);
