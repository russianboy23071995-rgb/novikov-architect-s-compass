import { recoveryFixture, summary } from "./recovery-capacity-fixture";
import { validateProject, type Project } from "../src/domain/project/schema";
import { serializeProject } from "../src/lib/bim/model";
import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage";
import { readProjectRecovery } from "../src/application/project-files/recovery-catalog";
import { createAutosaveController } from "../src/application/project-files/autosave";
import { prepareProjectOpen } from "../src/application/project-files/operations";
import { PROJECT_FILE_LIMIT } from "../src/interop/project-file/size";
import { sameRecoveryContent } from "../src/application/project-files/recovery-status";
import type { ImageAsset } from "../src/domain/elements/reference/model";

const root = document.querySelector<HTMLElement>("#root")!;
root.style.cssText =
  "max-width:1200px;margin:30px auto;padding:15px;font:14px system-ui;line-height:1.6;color:#263840";
root.innerHTML =
  '<h1>Recovery-Kapazitätsmessung</h1><p>Isolierte synthetische Daten, keine Produktionsprojekte. Ein erster Lauf und fünf warme Wiederholungen je Profil. Erster Lauf ist nicht gleich kalter Browserprozess. Bilddekodierung/GPU und Stromausfall sind nicht Teil dieser Prüfung.</p><label>Quellstand <input id="revision" aria-label="Quellstand" value="9eac205 + Recovery-Diagnose" size="45"></label> <button id="run">Messung starten</button> <button id="download" disabled>Ergebnis herunterladen</button><p role="status" id="status">Bereit</p><pre id="environment"></pre><div id="results"></div>';
const button = document.querySelector<HTMLButtonElement>("#run")!;
const download = document.querySelector<HTMLButtonElement>("#download")!;
const status = document.querySelector<HTMLElement>("#status")!;
let result: unknown;
const pause = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const phases = [
  "validate",
  "serialize",
  "indexedDB",
  "manual",
  "automatic",
  "recoveryRead",
  "filePrepare",
] as const;
type Phase = (typeof phases)[number];
type Sample = {
  phase: Phase;
  run: number;
  ms: number;
  maxTimerDelayMs: number;
  maxLongTaskMs: number | null;
};
const longTasks: PerformanceEntry[] = [];
const observer =
  typeof PerformanceObserver !== "undefined" &&
  PerformanceObserver.supportedEntryTypes.includes("longtask")
    ? new PerformanceObserver((list) => longTasks.push(...list.getEntries()))
    : null;
observer?.observe({ entryTypes: ["longtask"] });
async function measure<T>(phase: Phase, run: number, fn: () => T | Promise<T>) {
  await pause(25); // Yield between phases; excluded from wall duration.
  let lag = 0,
    due = performance.now() + 8;
  const pulse = setInterval(() => {
    const now = performance.now();
    lag = Math.max(lag, now - due);
    due = now + 8;
  }, 8);
  const begin = performance.now();
  try {
    const value = await fn();
    const end = performance.now();
    await pause(25); // Deliver timers/Long Tasks belonging to the measured operation.
    const tasks = longTasks.filter((e) => e.startTime <= end && e.startTime + e.duration >= begin);
    return {
      value,
      sample: {
        phase,
        run,
        ms: end - begin,
        maxTimerDelayMs: Math.max(0, lag),
        maxLongTaskMs: observer ? Math.max(0, ...tasks.map((e) => e.duration)) : null,
      } satisfies Sample,
    };
  } finally {
    clearInterval(pulse);
  }
}
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

// Deterministic, decodable noise PNG, created outside timed operations. No padding/fake payload.
function image(side: number): ImageAsset {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = side;
  const ctx = canvas.getContext("2d")!;
  const pixels = ctx.createImageData(side, side);
  let seed = 731;
  for (let i = 0; i < pixels.data.length; i += 4) {
    for (let j = 0; j < 3; j++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      pixels.data[i + j] = seed >>> 24;
    }
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  return {
    id: "noise",
    mimeType: "image/png",
    pixelWidth: side,
    pixelHeight: side,
    data: canvas.toDataURL("image/png").split(",")[1]!,
  };
}
const updated = (project: Project, run: number) => ({
  ...project,
  storey: {
    ...project.storey,
    walls: project.storey.walls.map((w) => ({ ...w, height: 2.8 + (run + 1) / 100 })),
  },
});
function render(rows: { name: string; bytes: number; samples: Sample[] }[]) {
  const target = document.querySelector<HTMLElement>("#results")!;
  target.replaceChildren();
  for (const row of rows) {
    const title = document.createElement("h2");
    title.textContent = `${row.name} · ${(row.bytes / 1048576).toFixed(2)} MiB`;
    target.append(title);
    const table = document.createElement("table");
    table.style.cssText = "width:100%;text-align:right;border-collapse:collapse";
    table.innerHTML =
      "<thead><tr><th>Phase</th><th>Erster Lauf ms</th><th>Warm Median ms</th><th>Warm p95 ms</th><th>Timerverzug max ms</th><th>Long Task max ms</th></tr></thead>";
    const body = document.createElement("tbody");
    for (const phase of phases) {
      const samples = row.samples.filter((s) => s.phase === phase);
      if (!samples.length) continue;
      const warm = samples.filter((s) => s.run > 0);
      const stats = warm.length ? summary(warm.map((s) => s.ms)) : null;
      const tr = document.createElement("tr");
      for (const value of [
        phase,
        samples[0]!.ms,
        stats?.median,
        stats?.p95,
        Math.max(...samples.map((s) => s.maxTimerDelayMs)),
        observer ? Math.max(...samples.map((s) => s.maxLongTaskMs ?? 0)) : "nicht verfügbar",
      ]) {
        const td = document.createElement("td");
        td.style.borderBottom = "1px solid #ddd";
        td.textContent =
          typeof value === "number" ? value.toFixed(1) : value === undefined ? "–" : String(value);
        tr.append(td);
      }
      body.append(tr);
    }
    table.append(body);
    target.append(table);
  }
}
download.onclick = () => {
  const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "novikov-recovery-capacity.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
button.onclick = async () => {
  button.disabled = true;
  download.disabled = true;
  longTasks.length = 0;
  const name = `novikov-recovery-capacity-test-${crypto.randomUUID()}`;
  const catalog = createRecoveryCatalog(() => openRecoveryDatabase(name));
  const rows: {
    name: string;
    bytes: number;
    elements: number;
    pixels: number;
    recoveryBytes: number;
    samples: Sample[];
  }[] = [];
  const environment = {
    at: new Date().toISOString(),
    revision: document.querySelector<HTMLInputElement>("#revision")!.value,
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency,
    deviceMemory: (navigator as Navigator & { deviceMemory?: number }).deviceMemory,
    visibility: document.visibilityState,
    longTasksSupported: !!observer,
    warmRuns: 5,
    limitBytes: PROJECT_FILE_LIMIT,
  };
  document.querySelector<HTMLElement>("#environment")!.textContent = JSON.stringify(
    environment,
    null,
    2,
  );
  try {
    const cases = [
      { name: "Geometrie 1000", lines: 1000, side: 0 },
      { name: "Geometrie 10000", lines: 10000, side: 0 },
      { name: "Bild klein", lines: 0, side: 512 },
      { name: "Bild mittel", lines: 0, side: 1024 },
      { name: "Bild nahe Grenze", lines: 0, side: 1450 },
      { name: "Gemischt", lines: 5000, side: 1024 },
    ];
    for (const [index, c] of cases.entries()) {
      status.textContent = `Erzeuge ${c.name}…`;
      await pause(30);
      let asset = c.side ? image(c.side) : undefined;
      let base = recoveryFixture(`capacity-${index}`, c.lines, asset);
      let json = JSON.stringify(base);
      let bytes = new TextEncoder().encode(json).length;
      // Keep the near-limit fixture below the existing limit without changing production limits.
      if (c.name === "Bild nahe Grenze" && (bytes < 9 * 1048576 || bytes > 9.8 * 1048576)) {
        const side = Math.floor(c.side * Math.sqrt((9.5 * 1048576) / bytes));
        asset = image(side);
        base = recoveryFixture(`capacity-${index}`, c.lines, asset);
        json = serializeProject(base);
        bytes = new TextEncoder().encode(json).length;
      }
      assert(bytes < PROJECT_FILE_LIMIT, "Testdatei überschreitet bestehendes Limit");
      json = serializeProject(base);
      const manual = { ...base, id: `${base.id}-manual` },
        automatic = { ...base, id: `${base.id}-auto` };
      let fire: (() => void) | undefined;
      let complete: (() => void) | undefined;
      let autoError: string | null = null;
      const auto = createAutosaveController(
        catalog,
        (state) => {
          if (!state.busy) {
            autoError = state.error;
            complete?.();
            complete = undefined;
          }
        },
        {
          schedule(callback) {
            fire = callback;
            return () => {
              fire = undefined;
            };
          },
        },
      );
      const row = {
        name: c.name,
        bytes,
        elements: c.lines + 2 + (asset ? 1 : 0),
        pixels: asset ? asset.pixelWidth * asset.pixelHeight : 0,
        recoveryBytes: 0,
        samples: [] as Sample[],
      };
      rows.push(row);
      const manualController = createAutosaveController(catalog, () => {});
      manualController.update(manual, 0);
      auto.update(automatic, 0);
      auto.setEnabled(true);
      try {
        for (let run = 0; run <= 5; run++) {
          status.textContent = `${c.name}: ${run === 0 ? "erster Lauf" : `warm ${run}/5`}`;
          row.samples.push((await measure("validate", run, () => validateProject(base))).sample);
          row.samples.push((await measure("serialize", run, () => serializeProject(base))).sample);
          const port = catalog.project(`${base.id}-raw`);
          const expected = await port.read();
          const record = JSON.stringify({
            version: 1,
            current: { json, savedAt: new Date().toISOString() },
            previous: { json, savedAt: new Date().toISOString() },
          });
          row.recoveryBytes = new TextEncoder().encode(record).length;
          row.samples.push(
            (await measure("indexedDB", run, () => port.replace(expected, record))).sample,
          );
          const current = updated(manual, run);
          row.samples.push(
            (
              await measure("manual", run, () => {
                manualController.update(current, 0);
                return manualController.saveNow();
              })
            ).sample,
          );
          const autoCurrent = updated(automatic, run);
          row.samples.push(
            (
              await measure("automatic", run, async () => {
                auto.update(autoCurrent, 0);
                await new Promise<void>((resolve) => {
                  complete = resolve;
                  const callback = fire;
                  fire = undefined;
                  assert(callback, "Autosave timer missing");
                  callback();
                });
                assert(!autoError, autoError ?? "Autosave failed");
              })
            ).sample,
          );
          const read = await measure("recoveryRead", run, () =>
            readProjectRecovery(catalog, current.id),
          );
          row.samples.push(read.sample);
          const automaticRead = await readProjectRecovery(catalog, autoCurrent.id);
          assert(
            automaticRead && sameRecoveryContent(autoCurrent, automaticRead.project),
            "Autosave roundtrip differs",
          );
          assert(
            read.value && sameRecoveryContent(current, read.value.project),
            "Recovery roundtrip differs",
          );
          const file = await measure("filePrepare", run, () =>
            prepareProjectOpen({ name: "synthetic.json", size: bytes, text: async () => json }),
          );
          row.samples.push(file.sample);
          assert(sameRecoveryContent(base, file.value.project), "File roundtrip differs");
          render(rows);
        }
      } finally {
        auto.dispose();
        manualController.dispose();
      }
    }
    result = { environment, rows };
    download.disabled = false;
    status.textContent =
      "PASS: Alle Profile und Rundläufe abgeschlossen. Rohdaten können heruntergeladen werden.";
  } catch (error) {
    result = { environment, rows, error: String(error) };
    download.disabled = false;
    status.textContent = `FAIL: ${String(error)}`;
  } finally {
    await new Promise<void>((resolve) => {
      const request = indexedDB.deleteDatabase(name);
      request.onsuccess = () => resolve();
      request.onerror = () => {
        status.textContent += " Testdatenbank konnte nicht entfernt werden.";
        resolve();
      };
      request.onblocked = () => {
        status.textContent += " Testdatenbank-Löschung blockiert.";
        resolve();
      };
    });
    button.disabled = false;
  }
};
