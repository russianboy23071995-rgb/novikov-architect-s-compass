import {
  createRecoveryMaintenance,
  type MaintenanceState,
  type RecoveryMaintenanceStorage,
  type RetentionResult,
} from "./recovery-maintenance.ts";
export const MAINTENANCE_QUIET_MS = 30_000;
export const MAINTENANCE_INTERVAL_MS = 300_000;
export interface MaintenanceClock {
  now(): number;
  schedule(callback: () => void, delay: number): () => void;
}
export type MaintenanceConditions = {
  enabled: boolean;
  healthy: boolean;
  visible: boolean;
  busy: boolean;
};
/** Application lifetime, not dialog lifetime. Adapters report committed V2 writes and activity.
 * No DOM, model scans, storage inspection or cross-tab exclusivity is implied here. */
export function createMaintenanceCoordinator(
  storage: RecoveryMaintenanceStorage,
  notify: (state: MaintenanceState) => void,
  clock: MaintenanceClock,
) {
  let conditions: MaintenanceConditions = {
    enabled: false,
    healthy: true,
    visible: true,
    busy: false,
  };
  let disposed = false,
    blocked = false,
    pending = false;
  let epoch = 0,
    generation = 0,
    attempts = 0;
  let quietSince = clock.now(),
    lastAutomatic = -Infinity;
  let cancelTimer: (() => void) | undefined;
  let active: { promise?: Promise<void> } | undefined;
  let outcome: RetentionResult | undefined,
    status: MaintenanceState["status"] = "idle";
  const service = createRecoveryMaintenance(
    {
      collect: async (signal) => {
        outcome = await storage.collect(signal);
        return outcome;
      },
    },
    (state) => {
      status = state.status;
      notify(state);
    },
  );
  function clearTimer() {
    cancelTimer?.();
    cancelTimer = undefined;
  }
  function eligible() {
    return (
      !disposed &&
      !blocked &&
      pending &&
      attempts < 2 &&
      conditions.enabled &&
      conditions.healthy &&
      conditions.visible &&
      !conditions.busy
    );
  }
  function schedule() {
    clearTimer();
    if (active || !eligible()) return;
    const delay = Math.max(
      0,
      quietSince + MAINTENANCE_QUIET_MS - clock.now(),
      lastAutomatic + MAINTENANCE_INTERVAL_MS - clock.now(),
    );
    cancelTimer = clock.schedule(() => {
      cancelTimer = undefined;
      if (eligible() && !active) void start(false);
    }, delay);
  }
  function start(manual: boolean): Promise<void> {
    if (disposed) return Promise.resolve();
    if (active) return active.promise ?? Promise.resolve();
    // Manual actions may bypass cooldown, never an active save/import/gesture.
    if (conditions.busy) return Promise.resolve();
    clearTimer();
    const run = {} as { promise?: Promise<void> };
    active = run;
    const capturedEpoch = epoch,
      capturedGeneration = generation;
    if (!manual) {
      attempts++;
      lastAutomatic = clock.now();
    }
    outcome = undefined;
    run.promise = service.run().finally(() => {
      if (!disposed && epoch === capturedEpoch) {
        if (status === "success") {
          if (manual) blocked = false;
          if (generation === capturedGeneration) pending = false;
        } else if (
          status === "error" ||
          (outcome?.status === "skipped" && outcome.reason !== "changed-roots")
        ) {
          blocked = true;
        } else if (manual && generation === capturedGeneration) {
          pending = false;
        }
      }
      active = undefined;
      schedule();
    });
    return run.promise;
  }
  return {
    /** Only call after actual V2 publication, never on no-op/failed saves. */
    committed() {
      if (disposed) return;
      generation++;
      attempts = 0;
      pending = true;
      quietSince = clock.now();
      schedule();
    },
    update(next: MaintenanceConditions) {
      if (disposed) return;
      const changed = Object.keys(next).some(
        (key) =>
          next[key as keyof MaintenanceConditions] !==
          conditions[key as keyof MaintenanceConditions],
      );
      conditions = { ...next };
      if (changed) quietSince = clock.now();
      if (!next.enabled || !next.healthy || !next.visible || next.busy) service.cancel();
      schedule();
    },
    activity() {
      if (disposed) return;
      quietSince = clock.now();
      service.cancel();
      schedule();
    },
    contextChanged() {
      if (disposed) return;
      epoch++;
      generation++;
      pending = false;
      attempts = 0;
      quietSince = clock.now();
      clearTimer();
      service.cancel();
    },
    runManual: () => start(true),
    cancel() {
      pending = false;
      clearTimer();
      service.cancel();
    },
    dispose() {
      disposed = true;
      clearTimer();
      service.dispose();
    },
  };
}
