import type { Project } from "../../domain/project/schema.ts";
import {
  migrateLegacyRecovery,
  prepareCatalogV2Writer,
  type RecoveryCatalog,
} from "./recovery-catalog.ts";
import { prepareRecoveryWriter } from "./recovery.ts";
import { sameRecoveryContent } from "./recovery-status.ts";

export const AUTOSAVE_DELAY_MS = 2000;
export type AutosaveState = {
  enabled: boolean;
  busy: boolean;
  error: string | null;
  startupPending?: boolean;
};
export interface RecoveryTimer {
  schedule(callback: () => void, delay: number): () => void;
}
const timer: RecoveryTimer = {
  schedule(callback, delay) {
    const id = setTimeout(callback, delay);
    return () => clearTimeout(id);
  },
};

/** Holds an optimistic revision from activation, not from just before each write. */
async function prepareLease(catalog: RecoveryCatalog, id: string) {
  if (catalog.v2) return prepareCatalogV2Writer(catalog, id);
  await migrateLegacyRecovery(catalog);
  return prepareRecoveryWriter(catalog.project(id), id);
}

/** One serial writer for manual and automatic snapshots; no pointer/draft state enters here. */
export function createAutosaveController(
  catalog: RecoveryCatalog,
  notify: (state: AutosaveState) => void,
  clock: RecoveryTimer = timer,
  initialPreference?: boolean,
  onV2Committed?: () => void,
) {
  let state: AutosaveState = { enabled: false, busy: false, error: null };
  let preference = initialPreference;
  let project: Project | undefined;
  let context: unknown;
  let generation = 0;
  let disposed = false;
  let cancelTimer: (() => void) | undefined;
  let lease: Promise<Awaited<ReturnType<typeof prepareLease>>> | undefined;
  function publish(patch: Partial<AutosaveState>) {
    state = { ...state, ...patch };
    if (!disposed) notify(state);
  }
  function cancel() {
    cancelTimer?.();
    cancelTimer = undefined;
  }
  function schedule() {
    cancel();
    if (!state.enabled || state.busy || state.error || state.startupPending || !project || disposed)
      return;
    cancelTimer = clock.schedule(() => {
      cancelTimer = undefined;
      void save(false).catch(() => {});
    }, AUTOSAVE_DELAY_MS);
  }
  function acquire() {
    const result = prepareLease(catalog, project!.id);
    // Preparation may fail before the first timer fires; save() reports the failure without retry.
    void result.catch(() => {});
    return result;
  }
  async function save(manual: boolean) {
    if (disposed || !project) throw new Error("Kein aktives Projekt.");
    if (state.startupPending)
      throw new Error(
        "Bitte zuerst den Wiederherstellungsstand wählen oder ausdrücklich weiterarbeiten.",
      );
    if (state.busy) throw new Error("Eine lokale Sicherung läuft bereits.");
    cancel();
    const captured = project,
      epoch = generation;
    const current = () => !disposed && epoch === generation;
    publish({ busy: true });
    try {
      if (manual && state.error) lease = state.enabled ? acquire() : undefined;
      const active = await (lease ?? acquire());
      if (!current()) throw new Error("Projekt oder Autosicherung wurde gewechselt.");
      if (!manual && active.project && sameRecoveryContent(captured, active.project)) return null;
      const result = await active.save(captured, current);
      if (current()) {
        publish({ error: null });
        if (catalog.v2) {
          try {
            onV2Committed?.();
          } catch {
            /* Maintenance cannot invalidate a committed save. */
          }
        }
      }
      return result;
    } catch (error) {
      if (current())
        publish({
          error: error instanceof Error ? error.message : "Lokale Sicherung fehlgeschlagen.",
        });
      throw error;
    } finally {
      publish({ busy: false });
      // A committed old-context write remains bound to its captured ID, never to the new project.
      // Requeue only changes made during this operation, not an unchanged snapshot forever.
      if (project !== captured || !current()) schedule();
    }
  }
  return {
    setStartupPending(pending: boolean) {
      if (disposed || !!state.startupPending === pending) return;
      generation++;
      cancel();
      publish({ startupPending: pending });
      if (!pending) schedule();
    },
    update(next: Project, nextContext: unknown) {
      if (disposed) return;
      const switched = !project || next.id !== project.id || context !== nextContext;
      const changed = next !== project;
      project = next;
      context = nextContext;
      if (switched) {
        generation++;
        cancel();
        lease = undefined;
        publish({ enabled: preference ?? false, error: null });
        if (state.enabled) {
          lease = acquire();
          schedule();
        }
      } else if (changed) schedule();
    },
    setEnabled(enabled: boolean) {
      if (disposed || !project) return;
      if (initialPreference !== undefined) preference = enabled;
      if (enabled === state.enabled) return;
      generation++;
      cancel();
      lease = undefined;
      publish({ enabled, error: null });
      if (enabled) {
        lease = acquire();
        schedule();
      }
    },
    saveNow: () => save(true),
    dispose() {
      disposed = true;
      generation++;
      cancel();
    },
  };
}
