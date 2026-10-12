import type { useLocalAutosave } from "./useLocalAutosave";
import { useEffect, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import {
  readProjectRecovery,
  listRecoveryProjects,
  queryRecoveryProjects,
  type RecoverySummary,
} from "@/application/project-files/recovery-catalog";
import {
  browserRecoveryCatalog,
  subscribeRecoveryChanges,
} from "@/interop/project-file/recovery-storage";
import { FloatingPanel } from "./FloatingPanel";
import { Button } from "@/components/ui/button";

export function RecoveryPanel({
  autosave,
  onClose,
  onPrepare,
}: {
  autosave: ReturnType<typeof useLocalAutosave>;
  onClose: () => void;
  onPrepare: (candidate: { name: string; project: Project }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [candidate, setCandidate] = useState<Awaited<ReturnType<typeof readProjectRecovery>>>(null);
  const [projects, setProjects] = useState<RecoverySummary[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const generation = useRef({ value: 0 });
  useEffect(() => {
    const lifetime = generation.current;
    const current = ++generation.current.value;
    setBusy(true);
    void listRecoveryProjects(browserRecoveryCatalog)
      .then(
        (result) => {
          if (generation.current.value === current) {
            setProjects(result.projects);
            setWarnings(result.warnings);
          }
        },
        (error) => {
          if (generation.current.value === current)
            setError(error instanceof Error ? error.message : "Speicher nicht verfügbar.");
        },
      )
      .finally(() => {
        if (generation.current.value === current) setBusy(false);
      });
    return () => {
      lifetime.value++;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeRecoveryChanges(() => {
      void queryRecoveryProjects(browserRecoveryCatalog).then(
        (result) => {
          if (active) setProjects(result.projects);
        },
        () => {
          /* Existing snapshot/error presentation remains available. */
        },
      );
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);
  const run = async (id?: string) => {
    const current = ++generation.current.value;
    setBusy(true);
    setError("");
    setMessage("");
    setCandidate(null);
    try {
      if (id === undefined) {
        const result = await autosave.saveNow();
        if (!result) return;
        const listing = await listRecoveryProjects(browserRecoveryCatalog);
        if (generation.current.value !== current) return;
        setProjects(listing.projects);
        setWarnings(listing.warnings);
        setMessage(`Lokaler Snapshot erstellt: ${new Date(result.savedAt).toLocaleString()}.`);
      } else {
        const result = await readProjectRecovery(browserRecoveryCatalog, id);
        if (generation.current.value !== current) return;
        setCandidate(result);
        if (!result) setMessage("Kein lokaler Wiederherstellungsstand vorhanden.");
      }
    } catch (e) {
      if (generation.current.value === current)
        setError(e instanceof Error ? e.message : "Wiederherstellungsspeicher nicht verfügbar.");
    } finally {
      if (generation.current.value === current) setBusy(false);
    }
  };
  return (
    <FloatingPanel open title="Lokale Wiederherstellung" onClose={onClose} width={600} height={560}>
      <div className="space-y-4 overflow-auto p-4 text-xs">
        <p>
          Je Projekt-ID ein gesicherter Stand und sein gültiger Vorgänger, nur in diesem Browser
          unter dieser Adresse. Andere Projekte bleiben erhalten; Dateien mit gleicher Projekt-ID
          teilen einen Stand. Dies ist kein externes Backup. Beim Löschen der Browserdaten gehen
          diese Stände verloren.
        </p>
        <p>
          Gespeichert werden die übernommenen Projektänderungen einschließlich Abbildern.
          Unbestätigte Eingaben und Undo-History sind nicht enthalten.
        </p>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autosave.state.enabled}
            onChange={(event) => autosave.setEnabled(event.target.checked)}
          />
          Automatisch lokal sichern (dieses geöffnete Projekt)
        </label>
        <p>
          Nach 2 Sekunden Bearbeitungspause. Nach Projektwechsel oder Neustart wieder ausgeschaltet.
          Eine bereits gestartete Transaktion kann noch abschließen.
        </p>
        {autosave.state.busy && <p role="status">Lokaler Snapshot wird geschrieben…</p>}
        {autosave.state.error && (
          <p role="alert">
            {autosave.state.enabled ? "Autosicherung pausiert. " : ""}
            {autosave.state.error} Zum erneuten Versuch ausschalten und wieder einschalten oder
            manuell sichern.
          </p>
        )}
        <div className="flex gap-2">
          <Button size="sm" disabled={busy || autosave.state.busy} onClick={() => void run()}>
            Snapshot erstellen
          </Button>
        </div>
        {warnings.map((warning, index) => (
          <p key={index} role="alert">
            {warning}
          </p>
        ))}
        <table className="w-full text-left">
          <caption className="text-left">Gesicherte Projekte</caption>
          <thead>
            <tr>
              <th>Projekt-ID</th>
              <th>Zeitpunkt</th>
              <th>
                <span className="sr-only">Aktion</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {projects.map((entry) => (
              <tr key={entry.projectId}>
                <td className="max-w-48 break-all">{entry.projectId}</td>
                <td>{new Date(entry.savedAt).toLocaleString()}</td>
                <td>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => void run(entry.projectId)}
                  >
                    Stand prüfen
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!busy && projects.length === 0 && !error && <p>Noch keine gesicherten Projekte.</p>}
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
