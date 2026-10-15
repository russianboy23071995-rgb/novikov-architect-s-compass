import { useEffect } from "react";
import type { MaintenanceState } from "@/application/project-files/recovery-maintenance";
import { Button } from "@/components/ui/button";
/** Consumer of shared state; unmount only cancels a dialog-owned manual run. */
export function RecoveryMaintenanceControls({
  state,
  run,
  cancel,
  close,
}: {
  state: MaintenanceState;
  run: () => Promise<void> | undefined;
  cancel: () => void;
  close: () => void;
}) {
  useEffect(() => () => close(), [close]);
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
          onClick={() => {
            void run();
          }}
        >
          Speicher warten
        </Button>
        {running && (
          <Button size="sm" variant="outline" onClick={cancel}>
            Abbrechen
          </Button>
        )}
      </div>
      {state.message && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
    </section>
  );
}
