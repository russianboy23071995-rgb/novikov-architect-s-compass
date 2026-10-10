import {
  queryRecoveryProjects,
  type RecoveryCatalog,
  type RecoverySummary,
} from "./recovery-catalog.ts";

export type RecoveryOffer =
  | { kind: "available"; projects: RecoverySummary[] }
  | { kind: "empty" }
  | { kind: "unavailable"; message: string };

/** Read-only startup query. Disposing suppresses even delayed errors, never writes a snapshot. */
export function startRecoveryOffer(
  storage: RecoveryCatalog,
  notify: (offer: RecoveryOffer) => void,
) {
  let disposed = false;
  const done = queryRecoveryProjects(storage).then(
    ({ projects, warnings }) => {
      if (!disposed)
        notify(
          projects.length
            ? { kind: "available", projects }
            : warnings.length
              ? { kind: "unavailable", message: warnings.join(" ") }
              : { kind: "empty" },
        );
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
