import { useEffect, useRef, useState } from "react";
import { startManualCapture, type ManualReport } from "./manual-capture";

export function ManualRecorder({
  ready,
  onRecordingChange,
}: {
  ready: boolean;
  onRecordingChange: (active: boolean) => void;
}) {
  const stop = useRef<ReturnType<typeof startManualCapture> | null>(null);
  const [recording, setRecording] = useState(false);
  const [report, setReport] = useState<ManualReport | null>(null);
  useEffect(() => () => stop.current?.("unmount"), []);
  function start() {
    if (stop.current) return;
    setReport(null);
    stop.current = startManualCapture((value) => {
      stop.current = null;
      if (value.reason === "unmount") return;
      setRecording(false);
      onRecordingChange(false);
      setReport(value);
    });
    setRecording(true);
    onRecordingChange(true);
  }
  const text = report ? JSON.stringify(report, null, 2) : "";
  function download() {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "novikov-movement-trace.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section aria-label="Manuelle Bewegungsdiagnose" className="mt-2 border-t p-2">
      <strong>Bewegungsaufzeichnung</strong>
      <p>
        T pair laden → Wände/Fenster auswählen → Auswahl frei bewegen → Ursprung klicken. Dann
        Aufnahme starten und mit/ohne Shift bewegen.
      </p>
      <button
        className="rounded border px-2 py-1 disabled:opacity-40"
        disabled={!ready || recording}
        onClick={start}
      >
        Aufnahme starten
      </button>{" "}
      <button
        className="rounded border px-2 py-1 disabled:opacity-40"
        disabled={!recording}
        onClick={() => stop.current?.()}
      >
        Aufnahme stoppen
      </button>{" "}
      <button
        className="rounded border px-2 py-1 disabled:opacity-40"
        disabled={!report}
        onClick={download}
      >
        Diagnose speichern
      </button>
      <p>Maximal 30 Sekunden / 10.000 Ereignisse. Speicherung nur auf deinem Gerät.</p>
      <p role="status">
        {recording
          ? "Aufnahme läuft – maximal 30 Sekunden"
          : report
            ? `Aufnahme beendet (${report.reason}): ${report.events.length} Ereignisse, ${report.droppedEvents} verworfen. Long Tasks: ${report.longTasksSupported ? "verfügbar" : "nicht unterstützt"}.`
            : "Aufnahme bereit"}
      </p>
      {report && (
        <textarea
          aria-label="Manuelle Diagnose JSON"
          readOnly
          value={text}
          style={{ width: "100%", height: 65 }}
        />
      )}
    </section>
  );
}
