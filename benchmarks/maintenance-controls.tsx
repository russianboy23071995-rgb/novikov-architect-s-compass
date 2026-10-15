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
createRoot(document.getElementById("root")!).render(
  <main style={{ maxWidth: 600, margin: "40px auto" }}>
    <h1>Wartungssteuerung: Bedienprüfung</h1>
    <p>Simulation mit Test-Port. Kein Datenbankzugriff, keine echten Löschungen.</p>
    <RecoveryMaintenanceControls storage={storage} />
  </main>,
);
