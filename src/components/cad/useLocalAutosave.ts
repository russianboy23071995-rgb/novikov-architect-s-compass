import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import type { AutosaveState } from "@/application/project-files/autosave";
import { createRecoverySession } from "@/application/project-files/recovery-session";
import type { MaintenanceState } from "@/application/project-files/recovery-maintenance";
import { browserRecoveryMaintenance } from "@/interop/project-file/recovery-maintenance-storage";
import { observeRecoveryActivity } from "@/interop/project-file/recovery-activity";
import { browserRecoveryCatalog } from "@/interop/project-file/recovery-storage";

import {
  readAutosavePreference,
  writeAutosavePreference,
} from "@/interop/project-file/autosave-preference";

export function useLocalAutosave(project: Project, context: unknown) {
  const [maintenanceState, setMaintenanceState] = useState<MaintenanceState>({
    status: "idle",
    message: "",
  });
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const controller = useRef<ReturnType<typeof createRecoverySession> | null>(null);
  const [state, setState] = useState<AutosaveState>({ enabled: false, busy: false, error: null });
  useEffect(() => {
    let enabled = true;
    try {
      enabled = readAutosavePreference(window.localStorage);
    } catch {
      // An unreadable preference could hide an opt-out: do not overwrite that choice.
      enabled = false;
      setPreferenceError(
        "Gespeicherte Einstellung nicht lesbar. Bitte Autosicherung bewusst aktivieren.",
      );
    }
    const service = createRecoverySession(
      browserRecoveryCatalog,
      browserRecoveryMaintenance,
      setState,
      setMaintenanceState,
      {
        now: () => performance.now(),
        schedule(callback, delay) {
          const id = setTimeout(callback, delay);
          return () => clearTimeout(id);
        },
      },
      enabled,
    );
    const stopActivity = observeRecoveryActivity(document, window, service);
    controller.current = service;
    return () => {
      stopActivity();
      service.dispose();
      controller.current = null;
    };
  }, []);
  useEffect(() => {
    controller.current?.update(project, context);
  }, [project, context]);
  return {
    state,
    preferenceError,
    maintenanceState,
    closeMaintenanceDialog: useCallback(() => controller.current?.closeMaintenanceDialog(), []),
    hold: useCallback(
      (reason: string, value: boolean) => controller.current?.hold(reason, value),
      [],
    ),
    runMaintenance: useCallback(() => controller.current?.runMaintenance(), []),
    cancelMaintenance: useCallback(() => controller.current?.cancelMaintenance(), []),
    setEnabled(enabled: boolean) {
      controller.current?.setEnabled(enabled);
      try {
        writeAutosavePreference(window.localStorage, enabled);
        setPreferenceError(null);
      } catch {
        setPreferenceError(
          "Einstellung gilt nur für diese Sitzung; sie konnte nicht dauerhaft gespeichert werden.",
        );
      }
    },
    async saveNow() {
      if (!controller.current) throw new Error("Wiederherstellung noch nicht bereit.");
      return controller.current.saveNow();
    },
  };
}
