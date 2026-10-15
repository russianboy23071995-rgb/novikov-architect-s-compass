import { useEffect, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import { createAutosaveController, type AutosaveState } from "@/application/project-files/autosave";
import { browserRecoveryCatalog } from "@/interop/project-file/recovery-storage";

import {
  readAutosavePreference,
  writeAutosavePreference,
} from "@/interop/project-file/autosave-preference";

export function useLocalAutosave(project: Project, context: unknown) {
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const controller = useRef<ReturnType<typeof createAutosaveController> | null>(null);
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
    const service = createAutosaveController(browserRecoveryCatalog, setState, undefined, enabled);
    controller.current = service;
    return () => {
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
