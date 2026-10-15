export type RetentionResult =
  | { status: "collected"; deleted: number; retained: number }
  | { status: "skipped"; reason: "unreadable-roots" | "changed-roots" | "unreadable-legacy" };
/** Storage resolves only after a committed transaction; rejected calls preserve prior data. */
export interface RecoveryMaintenanceStorage {
  collect(signal: AbortSignal): Promise<RetentionResult>;
}
export type MaintenanceState = {
  status: "idle" | "running" | "success" | "skipped" | "cancelled" | "error";
  message: string;
};
const skippedMessages = {
  "unreadable-roots": "Sicherungsstände sind unbekannt oder beschädigt. Es wurde nichts bereinigt.",
  "changed-roots": "Die Sicherungen wurden zwischenzeitlich geändert. Bitte später erneut starten.",
  "unreadable-legacy":
    "Ein älterer Sicherungsstand ist nicht vollständig lesbar. Es wurde nichts bereinigt.",
};
/** Explicit user action only: no timer, retry loop, autosave coupling or model/history mutation. */
export function createRecoveryMaintenance(
  storage: RecoveryMaintenanceStorage,
  notify: (state: MaintenanceState) => void,
) {
  let active: AbortController | undefined;
  let disposed = false;
  const publish = (state: MaintenanceState) => {
    if (!disposed) {
      try {
        notify(state);
      } catch {
        /* Presentation cannot change committed storage outcome. */
      }
    }
  };
  return {
    async run() {
      if (active || disposed) return;
      const request = new AbortController();
      active = request;
      publish({
        status: "running",
        message: "Sicherungsstände werden geprüft und ungenutzte Bilddaten bereinigt…",
      });
      try {
        const result = await storage.collect(request.signal);
        // Never reinterpret a committed result as cancellation after a late click.
        publish(
          result.status === "collected"
            ? {
                status: "success",
                message: `${result.deleted} ungenutzte Bilddaten entfernt; ${result.retained} benötigte Bilddaten erhalten.`,
              }
            : { status: "skipped", message: skippedMessages[result.reason] },
        );
      } catch (error) {
        const name = error instanceof Error || error instanceof DOMException ? error.name : "";
        publish(
          name === "AbortError"
            ? {
                status: "cancelled",
                message: "Wartung abgebrochen. Vorhandene Sicherungen bleiben erhalten.",
              }
            : {
                status: "error",
                message:
                  name === "QuotaExceededError"
                    ? "Speichergrenze erreicht. Die Wartung wurde nicht übernommen; vorhandene Sicherungen bleiben erhalten."
                    : "Wartung fehlgeschlagen. Vorhandene Sicherungen bleiben erhalten. Ein neuer Versuch muss manuell gestartet werden.",
              },
        );
      } finally {
        active = undefined;
      }
    },
    cancel() {
      active?.abort();
    },
    dispose() {
      disposed = true;
      active?.abort();
    },
  };
}
