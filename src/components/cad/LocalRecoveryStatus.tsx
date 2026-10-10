import { useEffect, useRef, useState } from "react";
import type { Project } from "@/domain/project/schema";
import {
  createRecoveryStatusTracker,
  type RecoveryStatus,
} from "@/application/project-files/recovery-status";
import {
  browserRecoveryCatalog,
  subscribeRecoveryChanges,
} from "@/interop/project-file/recovery-storage";

export function LocalRecoveryStatus({
  project,
  context,
  onOpen,
}: {
  project: Project;
  context: unknown;
  onOpen: () => void;
}) {
  const tracker = useRef<ReturnType<typeof createRecoveryStatusTracker> | null>(null);
  const [result, setResult] = useState<{
    status: RecoveryStatus;
    project: Project;
    context: unknown;
  } | null>(null);
  useEffect(() => {
    const query = createRecoveryStatusTracker(browserRecoveryCatalog, (status, project, context) =>
      setResult({ status, project, context }),
    );
    tracker.current = query;
    const refresh = () => {
      void query.refresh();
    };
    const unsubscribe = subscribeRecoveryChanges(refresh);
    window.addEventListener("focus", refresh);
    const visible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      query.dispose();
      unsubscribe();
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visible);
      tracker.current = null;
    };
  }, []);
  useEffect(() => {
    tracker.current?.update(project, context);
  }, [project, context]);
  const status: RecoveryStatus =
    result?.project === project && result.context === context
      ? result.status
      : { kind: "checking" };
  const text =
    status.kind === "current"
      ? "Lokaler Snapshot aktuell"
      : status.kind === "changed"
        ? "Änderungen seit Snapshot"
        : status.kind === "missing"
          ? "Kein lokaler Snapshot"
          : status.kind === "unavailable"
            ? "Sicherungsstatus unbekannt"
            : "Snapshot wird geprüft…";
  const detail =
    status.kind === "current" || status.kind === "changed"
      ? `Stand: ${new Date(status.savedAt).toLocaleString()}. `
      : status.kind === "unavailable"
        ? `${status.message} `
        : "";
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Lokaler Sicherungsstatus: ${text}`}
      title={`${detail}Nur lokale Wiederherstellung in diesem Browser, kein externes Backup. Klicken öffnet die Wiederherstellung.`}
      className="max-w-56 truncate rounded px-2 text-[11px] text-muted-foreground hover:bg-secondary/60"
    >
      <span role="status">{text}</span>
    </button>
  );
}
