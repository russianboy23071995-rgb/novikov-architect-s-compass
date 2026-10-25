import { storeyOf } from "../src/domain/storeys/access.ts";
import { createBoundedRecoveryCodec } from "../src/interop/project-file/recovery-codec";
import { PROJECT_FILE_LIMIT } from "../src/interop/project-file/size";
import { assertProjectFileSize } from "../src/interop/project-file/size";
import { sameProjectModel } from "../src/domain/project/model-equality";
import { recoveryFixture } from "./recovery-capacity-fixture";
import { createImageAssetHandle } from "../src/domain/elements/reference/model";
import { serializeProject, validateProject } from "../src/lib/bim/model";
import { updateWall } from "../src/application/walls/actions.ts";
import { createHistory, commitProject, undoProject, redoProject } from "../src/lib/bim/history";
import {
  prepareProjectOpen,
  requestProjectDownload,
} from "../src/application/project-files/operations";
import {
  createRecoveryCatalog,
  openRecoveryDatabase,
} from "../src/interop/project-file/recovery-storage";
import { createAutosaveController } from "../src/application/project-files/autosave";
import { readProjectRecovery } from "../src/application/project-files/recovery-catalog";
if (!import.meta.env.DEV || location.port !== "8084") throw new Error("Diagnostic only");
const root = document.getElementById("root")!;
root.style.cssText = "font:15px system-ui;max-width:1100px;margin:30px auto";
root.innerHTML =
  '<h1>100 MiB: produktiver Datei- und Recovery-Ablauf</h1><p>Synthetisches Projekt, eigene Testdatenbank. Keine produktiven Nutzerdaten.</p><button id="run">Ablauf prüfen</button><p role="status">Bereit</p><pre id="output"></pre>';
const run = document.querySelector<HTMLButtonElement>("#run")!;
const status = document.querySelector<HTMLElement>('[role="status"]')!;
const output = document.querySelector<HTMLElement>("#output")!;
const pause = () => new Promise<void>((r) => setTimeout(r, 0));
const heap = () =>
  (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ??
  null;
run.onclick = async () => {
  run.disabled = true;
  const checks: string[] = [],
    phases: unknown[] = [],
    tasks: unknown[] = [];
  const report: Record<string, unknown> = {
    started: new Date().toISOString(),
    checks,
    phases,
    tasks,
  };
  const observer = new PerformanceObserver((list) =>
    tasks.push(...list.getEntries().map((e) => ({ start: e.startTime, ms: e.duration }))),
  );
  observer.observe({ type: "longtask" });
  const check = (ok: boolean, name: string) => {
    if (!ok) throw new Error(name);
    checks.push(name);
  };
  const phase = async <T>(name: string, action: () => T | Promise<T>): Promise<T> => {
    status.textContent = name;
    await pause();
    const start = performance.now();
    const result = await action();
    phases.push({ name, start, ms: performance.now() - start, heapAfter: heap() });
    output.textContent = JSON.stringify(report, null, 2);
    return result;
  };
  let controller: ReturnType<typeof createAutosaveController> | undefined;
  try {
    const project = await phase("Zwölf PNGs und 10.000 Linien vorbereiten", async () => {
      const p = recoveryFixture("capacity-100", 10000);
      for (let i = 1; i <= 12; i++) {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1280;
        const ctx = canvas.getContext("2d")!,
          image = ctx.createImageData(1280, 1280);
        let seed = i;
        for (let j = 0; j < image.data.length; j++) {
          seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
          image.data[j] = seed >>> 24;
        }
        ctx.putImageData(image, 0, 0);
        p.assets.push(
          createImageAssetHandle({
            id: `a${i}`,
            mimeType: "image/png",
            pixelWidth: 1280,
            pixelHeight: 1280,
            data: canvas.toDataURL("image/png").split(",")[1]!,
          }),
        );
        storeyOf(p).references.push({
          id: `r${i}`,
          kind: "image-reference",
          assetId: `a${i}`,
          layerId: p.defaultLayerIds.line,
          origin: { x: i * 10, y: 0 },
          rotation: 0,
          metresPerPixel: 0.01,
        });
        canvas.width = canvas.height = 0;
        await pause();
      }
      return p;
    });
    let text = await phase("Portable Datei erzeugen", () => serializeProject(project));
    report["bytes"] = new Blob([text]).size;
    check(Number(report["bytes"]) > 100 * 1024 * 1024, "Profil überschreitet 100 MiB");
    const opened = await phase("Datei öffnen", () =>
      prepareProjectOpen(new File([text], "capacity.json")),
    );
    await phase("Vollvergleich nach Öffnen", () =>
      check(serializeProject(opened.project) === text, "Dateiöffnung vollständig identisch"),
    );
    let history = await phase("History anlegen", () => createHistory(opened.project));
    const wall = storeyOf(history.present).walls[0]!;
    const candidate = updateWall(history.present, wall.id, { height: wall.height + 0.1 });
    const baselineCommit = () => {
      const next = validateProject(candidate);
      const json = JSON.stringify(next);
      assertProjectFileSize(json);
      if (json === serializeProject(history.present)) return history;
      if (sameProjectModel(history.present, next)) return { ...history, present: next };
      return { past: [...history.past, history.present].slice(-100), present: next, future: [] };
    };
    for (let i = 0; i < 3; i++) {
      const old = await phase(`Commit Vollpfad ${i + 1}`, baselineCommit);
      const optimized = await phase(`Commit optimiert ${i + 1}`, () =>
        commitProject(history, candidate),
      );
      await phase(`Commit Vergleich ${i + 1}`, () =>
        check(
          serializeProject(old.present) === serializeProject(optimized.present) &&
            old.past.length === optimized.past.length &&
            old.future.length === optimized.future.length,
          `Commit A/B ${i + 1} identisch`,
        ),
      );
    }
    history = commitProject(history, candidate);
    check(history.past.length === 1, "Änderung genau ein Undo-Schritt");
    history = await phase("Undo", () => undoProject(history));
    await phase("Vollvergleich Undo", () =>
      check(
        serializeProject(history.present) === text,
        "Undo stellt vollständigen Ausgangsstand her",
      ),
    );
    history = await phase("Redo", () => redoProject(history));
    await phase("Datei speichern über Download-Port", () =>
      requestProjectDownload(history.present, (value) => {
        text = value;
      }),
    );
    const reopened = await phase("Gespeicherte Datei erneut öffnen", () =>
      prepareProjectOpen(new File([text], "saved.json")),
    );
    await phase("Vollvergleich gespeicherter Datei", () =>
      check(
        serializeProject(reopened.project) === text,
        "Gespeicherte Datei einschließlich Bilder identisch",
      ),
    );
    for (let i = 1; i <= 3; i++) {
      for (const mode of ["Vollpfad", "optimiert"]) {
        const name = `novikov-capacity-test-${crypto.randomUUID()}`;
        const open = () => openRecoveryDatabase(name);
        const catalog = createRecoveryCatalog(open, true);
        if (mode === "Vollpfad") {
          const bounded = createBoundedRecoveryCodec({
            modelBytes: PROJECT_FILE_LIMIT,
            payloadBytes: PROJECT_FILE_LIMIT,
            pixels: 128_000_000,
          });
          // The captured codec object is also used by the storage port. Reproduce the old
          // product wrapper only in this diagnosis; no production injection API needed.
          Object.assign(catalog.v2!.codec, {
            async prepare(p: typeof reopened.project) {
              assertProjectFileSize(serializeProject(p));
              return bounded.prepare(p);
            },
            async restore(...args: Parameters<typeof bounded.restore>) {
              const p = await bounded.restore(...args);
              assertProjectFileSize(serializeProject(p));
              return p;
            },
          });
        }
        controller = createAutosaveController(catalog, () => {});
        controller.update(reopened.project, "first");
        await phase(`V2 sichern ${mode} ${i}`, () => controller!.saveNow());
        controller.dispose();
        controller = undefined;
        const restored = await phase(`V2 lesen ${mode} ${i}`, () =>
          readProjectRecovery(catalog, project.id),
        );
        await phase(`V2 Vergleich ${mode} ${i}`, () =>
          check(
            !!restored && serializeProject(restored.project) === text,
            `V2 ${mode} ${i} vollständig identisch`,
          ),
        );
      }
    }
    report["status"] = "passed";
    status.textContent = `Bestanden: ${checks.length} Prüfungen.`;
  } catch (error) {
    report["status"] = "failed";
    report["error"] = String(error);
    status.textContent = String(error);
  } finally {
    controller?.dispose();
    await pause();
    observer.disconnect();
    output.textContent = JSON.stringify(report, null, 2);
    run.disabled = false;
  }
};
