import { readRecovery, type RecoveryStorage } from "./recovery.ts";

export type RecoveryOffer =
  | { kind: "available"; candidate: NonNullable<Awaited<ReturnType<typeof readRecovery>>> }
  | { kind: "empty" }
  | { kind: "unavailable"; message: string };

/** Read-only startup query. Disposing suppresses even delayed errors, never writes a snapshot. */
export function startRecoveryOffer(
  storage: RecoveryStorage,
  notify: (offer: RecoveryOffer) => void,
) {
  let disposed = false;
  const done = readRecovery(storage).then(
    (candidate) => {
      if (!disposed) notify(candidate ? { kind: "available", candidate } : { kind: "empty" });
    },
    (error) => {
      if (!disposed)
        notify({
          kind: "unavailable",
          message: error instanceof Error ? error.message : "Speicher nicht verfügbar.",
        });
    },
  );
  return {
    dispose: () => {
      disposed = true;
    },
    done,
  };
}
