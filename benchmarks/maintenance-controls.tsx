import { useMemo, useState, useEffect } from "react";
import { createMaintenanceCoordinator } from "../src/application/project-files/maintenance-coordinator";
import type { MaintenanceState } from "../src/application/project-files/recovery-maintenance";
import { createRoot } from "react-dom/client";
import { RecoveryMaintenanceControls } from "../src/components/cad/RecoveryMaintenanceControls";
import type { RecoveryMaintenanceStorage } from "../src/application/project-files/recovery-maintenance";
import "../src/styles.css";
const storage: RecoveryMaintenanceStorage = {
  collect(signal) {
    return new Promise((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve({ status: "collected", deleted: 2, retained: 3 });
      }, 3000);
      signal.addEventListener("abort", abort, { once: true });
      if (signal.aborted) abort();
    });
  },
};
export function Harness() {
  const [state, setState] = useState<MaintenanceState>({ status: "idle", message: "" });
  const service = useMemo(
    () =>
      createMaintenanceCoordinator(storage, setState, {
        now: () => performance.now(),
        schedule(callback, delay) {
          const id = setTimeout(callback, delay);
          return () => clearTimeout(id);
        },
      }),
    [],
  );
  useEffect(() => () => service.dispose(), [service]);
  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <h1>Wartungssteuerung: Bedienprüfung</h1>
      <p>Simulation mit Test-Port. Kein Datenbankzugriff, keine echten Löschungen.</p>
      <RecoveryMaintenanceControls
        state={state}
        run={service.runManual}
        cancel={service.cancel}
        close={service.closeManual}
      />
    </main>
  );
}
createRoot(document.getElementById("root")!).render(<Harness />);
