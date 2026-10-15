import type { Project } from "../../domain/project/schema.ts";
import { createAutosaveController, type AutosaveState, type RecoveryTimer } from "./autosave.ts";
import type { RecoveryCatalog } from "./recovery-catalog.ts";
import { createMaintenanceCoordinator, type MaintenanceClock } from "./maintenance-coordinator.ts";
import type { MaintenanceState, RecoveryMaintenanceStorage } from "./recovery-maintenance.ts";
/** One owner for autosave and maintenance, independent of any settings dialog. */
export function createRecoverySession(
  catalog: RecoveryCatalog,
  storage: RecoveryMaintenanceStorage,
  notifySave: (state: AutosaveState) => void,
  notifyMaintenance: (state: MaintenanceState) => void,
  clock: MaintenanceClock & RecoveryTimer,
  enabled: boolean,
) {
  let save: AutosaveState = { enabled: false, busy: false, error: null };
  const holds = new Set<string>();
  let visible = true,
    context: unknown,
    id: string | undefined;
  const maintenance = createMaintenanceCoordinator(storage, notifyMaintenance, clock);
  const sync = () =>
    maintenance.update({
      enabled: save.enabled,
      healthy: !save.error,
      visible,
      busy: save.busy || holds.size > 0,
    });
  const autosave = createAutosaveController(
    catalog,
    (state) => {
      save = state;
      sync();
      notifySave(state);
    },
    clock,
    enabled,
    () => maintenance.committed(),
  );
  return {
    update(project: Project, nextContext: unknown) {
      if (id !== project.id || context !== nextContext) {
        maintenance.contextChanged();
        id = project.id;
        context = nextContext;
      }
      autosave.update(project, nextContext);
    },
    setEnabled(value: boolean) {
      maintenance.contextChanged();
      autosave.setEnabled(value);
    },
    saveNow: autosave.saveNow,
    hold(reason: string, value: boolean) {
      if (value) holds.add(reason);
      else holds.delete(reason);
      sync();
    },
    visible(value: boolean) {
      visible = value;
      sync();
    },
    activity: maintenance.activity,
    runMaintenance: maintenance.runManual,
    cancelMaintenance: maintenance.cancel,
    closeMaintenanceDialog: maintenance.closeManual,
    dispose() {
      autosave.dispose();
      maintenance.dispose();
    },
  };
}
