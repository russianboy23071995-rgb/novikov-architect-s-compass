import { createAssetRecoveryStore, openPilotDatabase } from "./asset-recovery-store";
if (!import.meta.env.DEV || location.port !== "8084") throw new Error("Diagnostic origin only");
document.getElementById("root")!.innerHTML = `<h1>Recovery-Lesekosten isolieren</h1>
<p>Nur vorhandene Pilotdatenbank lesen. Drei Serviceaufrufe, Ergebnisvergleich jeweils in separater Aufgabe. Keine Kontrollhülle im Speicher.</p>
<label>Datenbank <input id="database" size="85"></label> <button id="run">Lesetest starten</button>
<button id="download" disabled>Ergebnis herunterladen</button><p role="status">Bereit</p><pre id="output"></pre>`;
document.body.style.cssText = "font:14px system-ui;margin:30px;line-height:1.5";
const input = document.querySelector<HTMLInputElement>("#database")!;
const run = document.querySelector<HTMLButtonElement>("#run")!;
const download = document.querySelector<HTMLButtonElement>("#download")!;
const status = document.querySelector<HTMLElement>('[role="status"]')!;
const output = document.getElementById("output")!;
const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0));
const heap = () => {
  const m = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return m?.usedJSHeapSize ?? null;
};
let report: Record<string, unknown> = {};
run.onclick = async () => {
  run.disabled = true;
  download.disabled = true;
  const dbName = input.value.trim();
  const phases: { name: string; start: number; end: number; heap: number | null }[] = [];
  const longTasks: { start: number; ms: number }[] = [];
  const checks: string[] = [];
  report = {
    dbName,
    started: new Date().toISOString(),
    userAgent: navigator.userAgent,
    phases,
    checks,
    heapBefore: heap(),
  };
  const observer = PerformanceObserver.supportedEntryTypes.includes("longtask")
    ? new PerformanceObserver((list) => {
        for (const e of list.getEntries()) longTasks.push({ start: e.startTime, ms: e.duration });
      })
    : undefined;
  observer?.observe({ type: "longtask" });
  report["longTasks"] = observer ? longTasks : null;
  let db: IDBDatabase | undefined;
  try {
    // Never create/upgrade a database in this read-only scenario.
    const known = await indexedDB.databases();
    if (
      !dbName.startsWith("novikov-asset-recovery-pilot-") ||
      !known.some((d) => d.name === dbName && d.version === 1)
    )
      throw new Error("Existing pilot database required");
    db = await openPilotDatabase(dbName);
    const expected = await new Promise<{ projectId: string; hash: string; revision: string }>(
      (resolve, reject) => {
        const tx = db!.transaction("control");
        const req = tx.objectStore("control").get("expected");
        tx.oncomplete = () => resolve(req.result);
        tx.onabort = () => reject(tx.error);
      },
    );
    if (!expected || typeof expected.hash !== "string")
      throw new Error("Run the current fixture pilot first");
    const store = createAssetRecoveryStore(db);
    for (let round = 0; round < 3; round++) {
      await pause();
      status.textContent = `Service lesen ${round + 1}/3`;
      const times: Record<string, number> = {};
      const start = performance.now();
      let result: Awaited<ReturnType<typeof store.read>> | undefined = await store.read(
        expected.projectId,
        false,
        {
          measure: (name, ms) => {
            times[name] = (times[name] ?? 0) + ms;
          },
        },
      );
      phases.push({ name: `service-${round}`, start, end: performance.now(), heap: heap() });
      report[`serviceParts${round}`] = times;
      await pause(); // Separate task boundary: comparison is not part of the service task.
      status.textContent = `Ergebnis getrennt prüfen ${round + 1}/3`;
      const verifyStart = performance.now();
      const digest = Array.from(
        new Uint8Array(
          await crypto.subtle.digest(
            "SHA-256",
            new TextEncoder().encode(JSON.stringify(result.project)),
          ),
        ),
      ).join(",");
      if (digest !== expected.hash || result.revision !== expected.revision)
        throw new Error("Model/payload/revision mismatch");
      checks.push(`full model, payloads and revision ${round + 1}`);
      phases.push({
        name: `comparison-${round}`,
        start: verifyStart,
        end: performance.now(),
        heap: heap(),
      });
      result = undefined;
      await pause();
      report[`releasedHeap${round}`] = heap();
      output.textContent = JSON.stringify(report, null, 2);
    }
    report["status"] = "passed";
    status.textContent = "Bestanden: 3 vollständige Vergleiche. Datenbank unverändert.";
  } catch (e) {
    report["status"] = "failed";
    report["error"] = String(e);
    status.textContent = String(e);
  } finally {
    await pause();
    for (const e of observer?.takeRecords() ?? [])
      longTasks.push({ start: e.startTime, ms: e.duration });
    observer?.disconnect();
    db?.close();
    report["heapAfter"] = heap();
    output.textContent = JSON.stringify(report, null, 2);
    run.disabled = false;
    download.disabled = false;
  }
};
download.onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "recovery-read-isolation.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
