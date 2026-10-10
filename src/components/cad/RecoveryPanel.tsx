import { useState } from "react";
import type { Project } from "@/domain/project/schema";
import { readRecovery, saveRecovery } from "@/application/project-files/recovery";
import { browserRecoveryStorage } from "@/interop/project-file/recovery-storage";
import { FloatingPanel } from "./FloatingPanel";
import { Button } from "@/components/ui/button";

export function RecoveryPanel({
  project,
  onClose,
  onPrepare,
}: {
  project: Project;
  onClose: () => void;
  onPrepare: (candidate: { name: string; project: Project }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState<Awaited<ReturnType<typeof readRecovery>>>(null);
  const run = async (save: boolean) => {
    setBusy(true);
    setError("");
    setMessage("");
    setCandidate(null);
    try {
      if (save) {
        const result = await saveRecovery(project, browserRecoveryStorage);
        setMessage(`Lokaler Snapshot erstellt: ${new Date(result.savedAt).toLocaleString()}.`);
      } else {
        const result = await readRecovery(browserRecoveryStorage);
        setCandidate(result);
        if (!result) setMessage("Noch kein lokaler Wiederherstellungsstand vorhanden.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Wiederherstellungsspeicher nicht verfügbar.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <FloatingPanel open title="Lokale Wiederherstellung" onClose={onClose} width={600} height={420}>
      <div className="space-y-4 overflow-auto p-4 text-xs">
        <p>
          Ein manuell erstellter Stand und sein gültiger Vorgänger, nur in diesem Browser unter
          dieser Adresse. Ein neuer Snapshot ersetzt den bisherigen, auch bei einem anderen Projekt.
          Keine automatische Sicherung und kein externes Backup. Beim Löschen der Browserdaten gehen
          diese Stände verloren.
        </p>
        <p>
          Gespeichert werden die übernommenen Projektänderungen einschließlich Abbildern.
          Unbestätigte Eingaben und Undo-History sind nicht enthalten.
        </p>
        <div className="flex gap-2">
          <Button size="sm" disabled={busy} onClick={() => void run(true)}>
            Snapshot erstellen
          </Button>
          <Button size="sm" variant="outline" disabled={busy} onClick={() => void run(false)}>
            Stand prüfen
          </Button>
        </div>
        {message && <p role="status">{message}</p>}
        {error && <p role="alert">{error}</p>}
        {candidate && (
          <div className="space-y-3 rounded border p-3">
            <p>
              {candidate.fallback
                ? "Gültiger Vorgänger (letzter Stand beschädigt)"
                : "Letzter gültiger Stand"}{" "}
              · {new Date(candidate.savedAt).toLocaleString()}
            </p>
            <p>
              Projekt: {candidate.project.id} · {candidate.project.storey.walls.length} Wände ·{" "}
              {candidate.project.storey.windows.length} Fenster
            </p>
            <Button
              size="sm"
              onClick={() => {
                onPrepare(candidate);
                onClose();
              }}
            >
              Wiederaufnahme vorbereiten
            </Button>
          </div>
        )}
      </div>
    </FloatingPanel>
  );
}
