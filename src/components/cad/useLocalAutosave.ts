import { useEffect, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import { createAutosaveController, type AutosaveState } from "@/application/project-files/autosave";
import { browserRecoveryCatalog } from "@/interop/project-file/recovery-storage";

export function useLocalAutosave(project: Project, context: unknown) {
  const controller = useRef<ReturnType<typeof createAutosaveController> | null>(null);
  const [state, setState] = useState<AutosaveState>({ enabled: false, busy: false, error: null });
  useEffect(() => {
    const service = createAutosaveController(browserRecoveryCatalog, setState);
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
    setEnabled(enabled: boolean) {
      controller.current?.setEnabled(enabled);
    },
    async saveNow() {
      if (!controller.current) throw new Error("Wiederherstellung noch nicht bereit.");
      return controller.current.saveNow();
    },
  };
}
