import type { Project } from "../../domain/project/schema.ts";
import {
  migrateLegacyRecovery,
  prepareCatalogV2Writer,
  type RecoveryCatalog,
} from "./recovery-catalog.ts";
import { prepareRecoveryWriter } from "./recovery.ts";
import { sameRecoveryContent } from "./recovery-status.ts";

export const AUTOSAVE_DELAY_MS = 2000;
export type AutosaveState = { enabled: boolean; busy: boolean; error: string | null };
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
) {
  let state: AutosaveState = { enabled: false, busy: false, error: null };
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
    if (!state.enabled || state.busy || state.error || !project || disposed) return;
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
      if (current()) publish({ error: null });
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
        publish({ enabled: false, error: null });
      } else if (changed) schedule();
    },
    setEnabled(enabled: boolean) {
      if (disposed || !project || enabled === state.enabled) return;
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
