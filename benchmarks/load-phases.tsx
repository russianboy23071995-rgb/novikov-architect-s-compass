import React, { Profiler } from "react";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { createExampleProject } from "../src/components/cad/bim-view";
import { serializeProject } from "../src/lib/bim/model";
import { phases, type Phase } from "./load-phase-trace";
import "../src/styles.css";
if (!import.meta.env.DEV || location.port !== "8083") throw Error("Diagnostic origin only");
const commits: { start: number; renderMs: number }[] = [];
const longTasks: { start: number; ms: number }[] = [];
const imageLoads: number[] = [];
new PerformanceObserver((list) =>
  longTasks.push(...list.getEntries().map((e) => ({ start: e.startTime, ms: e.duration }))),
).observe({ entryTypes: ["longtask"] });
document.addEventListener(
  "load",
  (event) => {
    if (event.target instanceof SVGImageElement) imageLoads.push(performance.now());
  },
  true,
);
createRoot(document.getElementById("root")!).render(
  <Profiler
    id="workspace"
    onRender={(_id, _phase, actual, _base, _start, commit) =>
      commits.push({ start: commit, renderMs: actual })
    }
  >
    <CadWorkspace />
  </Profiler>,
);
const panel = document.createElement("aside");
panel.style.cssText =
  "position:fixed;right:20px;bottom:40px;z-index:10000;background:white;padding:8px;border:1px solid #aaa;font:12px system-ui";
panel.innerHTML =
  '<label>Große Testdatei <input id="fixture" type="file" accept=".json"></label><button id="run">Phasen messen</button><button id="download">Rohdaten</button><p id="progress">Datei auswählen</p>';
document.body.append(panel);
const rows: unknown[] = [];
const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));
const button = (name: string) => {
  const e = Array.from(
    document.querySelectorAll<HTMLButtonElement>("main button,[role=dialog] button"),
  ).find((b) => (b.getAttribute("aria-label") ?? b.textContent?.trim()) === name);
  if (!e) throw Error(`Missing button ${name}`);
  e.click();
};
async function until(check: () => boolean) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await pause(30);
  }
  throw Error("UI state timeout");
}
let large: File | undefined;
panel.querySelector<HTMLInputElement>("#fixture")!.onchange = (e) => {
  large = (e.target as HTMLInputElement).files?.[0];
};
panel.querySelector<HTMLButtonElement>("#run")!.onclick = async () => {
  const progress = panel.querySelector("#progress")!;
  const run = panel.querySelector<HTMLButtonElement>("#run")!;
  run.disabled = true;
  try {
    if (!large) throw Error("Select generated fixture first");
    const small = new File([serializeProject(createExampleProject())], "small.json", {
      type: "application/json",
    });
    for (const [profile, file] of [
      ["small", small],
      ["large", large],
    ] as const)
      for (let iteration = 0; iteration < 6; iteration++) {
        progress.textContent = `${profile} ${iteration}/5`;
        const input = Array.from(
          document.querySelectorAll<HTMLInputElement>('main input[type="file"]'),
        ).find((e) => e.accept.includes("json"));
        if (!input) throw Error("Project file input missing");
        const data = new DataTransfer();
        data.items.add(file);
        input.files = data.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
        await until(() =>
          Array.from(document.querySelectorAll("button")).some(
            (e) => e.textContent?.trim() === "Projekt laden",
          ),
        );
        const begin = performance.now();
        const p = phases.length,
          c = commits.length,
          l = longTasks.length,
          im = imageLoads.length;
        button("Projekt laden");
        await until(
          () =>
            !Array.from(document.querySelectorAll("button")).some(
              (e) => e.textContent?.trim() === "Projekt laden",
            ),
        );
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        const framesMs = performance.now() - begin;
        await pause(300);
        const references = document.querySelectorAll(
          'svg image[aria-label^="Select reference"]',
        ).length;
        if (references !== (profile === "large" ? 1 : 0)) throw Error("Wrong reference count");
        rows.push({
          profile,
          iteration,
          framesMs,
          phases: phases.slice(p) as Phase[],
          commits: commits.slice(c),
          longTasks: longTasks.slice(l),
          imageLoads: imageLoads.slice(im),
          references,
        });
      }
    progress.textContent = "PASS: 12 Ladebestätigungen; Referenzanzahlen stimmen";
  } catch (e) {
    progress.textContent = `FAIL: ${e}`;
  } finally {
    run.disabled = false;
  }
};
panel.querySelector<HTMLButtonElement>("#download")!.onclick = () => {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([JSON.stringify({ userAgent: navigator.userAgent, rows }, null, 2)], {
      type: "application/json",
    }),
  );
  a.download = "load-phases.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
