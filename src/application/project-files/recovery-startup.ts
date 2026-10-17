import { startRecoveryOffer, type RecoveryOffer } from "./recovery-offer.ts";
import type { RecoveryCatalog } from "./recovery-catalog.ts";

/** Protect saved slots before the first autosave, until the startup choice is resolved. */
export function createRecoveryStartup(
  catalog: RecoveryCatalog,
  setPending: (value: boolean) => void,
  notify: (offer: RecoveryOffer | null) => void,
) {
  let resolved = false;
  setPending(true);
  const query = startRecoveryOffer(catalog, (offer) => {
    if (resolved) return;
    if (offer.kind === "empty") resolve();
    else notify(offer);
  });
  function resolve() {
    if (resolved) return;
    resolved = true;
    query.dispose();
    notify(null);
    setPending(false);
  }
  return {
    resolve,
    dispose: () => {
      resolved = true;
      query.dispose();
    },
    done: query.done,
  };
}
