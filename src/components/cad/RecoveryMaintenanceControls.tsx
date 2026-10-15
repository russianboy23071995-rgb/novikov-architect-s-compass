import { useEffect, useRef, useState } from "react";
import {
  createRecoveryMaintenance,
  type MaintenanceState,
  type RecoveryMaintenanceStorage,
} from "@/application/project-files/recovery-maintenance";
import { Button } from "@/components/ui/button";
/** Port-injected controls. Production mounting awaits explicit storage-activation approval. */
export function RecoveryMaintenanceControls({ storage }: { storage: RecoveryMaintenanceStorage }) {
  const [state, setState] = useState<MaintenanceState>({ status: "idle", message: "" });
  const controller = useRef<ReturnType<typeof createRecoveryMaintenance> | null>(null);
  useEffect(() => {
    const action = createRecoveryMaintenance(storage, setState);
    controller.current = action;
    setState({ status: "idle", message: "" });
    return () => {
      action.dispose();
      controller.current = null;
    };
  }, [storage]);
  const running = state.status === "running";
  return (
    <section
      className="space-y-2 rounded border p-3 text-xs"
      aria-label="Wiederherstellungsspeicher warten"
    >
      <p>
        Entfernt ungenutzte Bilddaten aus dem lokalen Wiederherstellungsspeicher. Gesicherte
        Projekte und ihre Vorgänger bleiben erhalten.
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={running}
          onClick={() => void controller.current?.run()}
        >
          Speicher warten
        </Button>
        {running && (
          <Button size="sm" variant="outline" onClick={() => controller.current?.cancel()}>
            Abbrechen
          </Button>
        )}
      </div>
      {state.message && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </section>
  );
}
