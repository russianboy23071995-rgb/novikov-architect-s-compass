import { releasedDerivedCount } from "../src/domain/project/derived-cache.ts";
import { createRoot } from "react-dom/client";
import { CadWorkspace } from "../src/components/cad/CadWorkspace";
import { serializeProject } from "../src/lib/bim/model";
import { previewCreateReference } from "../src/application/references/actions";
import { selectWorkingStorey } from "../src/application/storeys/working-storey";
import type { Project } from "../src/domain/project/schema";
import { schoolPlanCounts, schoolPlanFixture } from "./school-plan-fixture";
import { schoolFixture } from "./school-fixture";
import "../src/styles.css";

/** Acceptance run on the five-storey school (user decision 25.10.2026). The real production
 * CadWorkspace on an isolated origin; the script drives it only through user paths (file open
 * dialog, keyboard, command bar, buttons, pointer events) and observes timing, long tasks,
 * heap and errors. Nothing in the workspace, model or adapters is replaced. Downloads are not
 * written to disk: the saved file is captured in memory for the reopen step.
 */
if (!import.meta.env.PROD || location.port !== "8085")
  throw new Error("Use the isolated production workspace on port 8085");

const params = new URLSearchParams(location.search);
const size = (params.get("size") ?? "s") as "s" | "l" | "x";
const withImages = params.get("images") !== "0";
const RESULT_KEY = `school-run-${size}`;
const PROJECT_ID = size === "x" ? "school" : "school-plan";
const idle = async (ms: number) => {
  await new Promise((r) => setTimeout(r, ms));
  return heapMB();
};

// --- observation -----------------------------------------------------------------------
const errors: { at: string; text: string }[] = [];
let currentStep = "start";
const originalError = console.error;
console.error = (...args: unknown[]) => {
  errors.push({ at: currentStep, text: String(args[0]).slice(0, 300) });
  originalError(...args);
};
addEventListener("error", (e) => errors.push({ at: currentStep, text: "uncaught " + e.message }));
addEventListener("unhandledrejection", (e) =>
  errors.push({ at: currentStep, text: "rejection " + String(e.reason).slice(0, 300) }),
);
let longTaskMs = 0,
  lastLongTaskEnd = 0;
if (PerformanceObserver.supportedEntryTypes.includes("longtask"))
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      longTaskMs += entry.duration;
      lastLongTaskEnd = Math.max(lastLongTaskEnd, entry.startTime + entry.duration);
    }
  }).observe({ entryTypes: ["longtask"] });
const heapMB = () => {
  const memory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
  return memory ? Math.round((memory.usedJSHeapSize / 1048576) * 10) / 10 : null;
};
// Capture the project download instead of writing a file.
let captured: { text: string; at: number } | null = null;
const nativeClick = HTMLAnchorElement.prototype.click;
HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
  if (this.download && this.href.startsWith("blob:")) {
    void fetch(this.href)
      .then((r) => r.text())
      .then((text) => (captured = { text, at: performance.now() }));
    return;
  }
  nativeClick.call(this);
};

// fresh=1: start without records of earlier runs, so no background recovery check overlaps.
async function clearStorage() {
  for (const db of await indexedDB.databases())
    await new Promise((r) => {
      const request = indexedDB.deleteDatabase(db.name!);
      request.onsuccess = request.onerror = request.onblocked = r;
    });
  localStorage.clear();
}
void (
  params.get("fresh") === "1" && !sessionStorage.getItem(`${RESULT_KEY}-reload`)
    ? clearStorage()
    : Promise.resolve()
).then(() => createRoot(document.getElementById("root")!).render(<CadWorkspace />));

// --- helpers -----------------------------------------------------------------------------
const frame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
const paint = async () => {
  await frame();
  await frame();
};
async function until(check: () => boolean, timeout = 60000) {
  const start = performance.now();
  while (!check()) {
    if (performance.now() - start > timeout) throw new Error("Zeitüberschreitung");
    await frame();
  }
}
const label = (text: string) => document.querySelector<HTMLElement>(`[aria-label="${text}"]`);
const button = (text: string) =>
  [...document.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === text && !b.disabled,
  );
const element = (kind: string, id: string) => label(`Select ${kind} ${id}`);
const bodyText = () => document.body.innerText;
const centre = (el: Element) => {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};
function pointer(target: Element, type: string, x: number, y: number) {
  target.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      clientX: x,
      clientY: y,
      pointerId: 1,
      pointerType: "mouse",
      button: 0,
      buttons: type === "pointermove" ? 0 : 1,
      isPrimary: true,
    }),
  );
}
function click(target: Element, at = centre(target)) {
  pointer(target, "pointerdown", at.x, at.y);
  pointer(target, "pointerup", at.x, at.y);
  target.dispatchEvent(
    new MouseEvent("click", { bubbles: true, cancelable: true, clientX: at.x, clientY: at.y }),
  );
}
function key(k: string, ctrl = false) {
  dispatchEvent(new KeyboardEvent("keydown", { key: k, ctrlKey: ctrl, bubbles: true }));
}
const planSvg = () =>
  (element("wall", targets.wall) as SVGGraphicsElement | null)?.ownerSVGElement ?? null;
function screen(point: { x: number; y: number }) {
  const svg = planSvg()!;
  const p = new DOMPoint(point.x, -point.y).matrixTransform(svg.getScreenCTM()!);
  return { x: p.x, y: p.y };
}
function setInput(input: HTMLInputElement, value: string) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  setter.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
}
const openCount = () => document.querySelectorAll('[aria-label^="Select "]').length;

// --- model ---------------------------------------------------------------------------------
async function noiseImage(seed: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 1000;
  const context = canvas.getContext("2d")!;
  const data = context.createImageData(canvas.width, canvas.height);
  let s = seed;
  for (let i = 0; i < data.data.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    data.data[i] = i % 4 === 3 ? 255 : s >>> 24;
  }
  context.putImageData(data, 0, 0);
  const blob = await new Promise<Blob>((r) => canvas.toBlob((b) => r(b!), "image/png"));
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { data: btoa(binary), bytes: bytes.length, width: canvas.width, height: canvas.height };
}
async function buildModel(): Promise<{ project: Project; imageBytes: number }> {
  let p =
    size === "x"
      ? schoolFixture(20000)
      : schoolPlanFixture(size === "l" ? { wings: 3, desksPerRoom: 50 } : {});
  let imageBytes = 0;
  if (withImages)
    for (const [i, s] of p.storeys.entries()) {
      const image = await noiseImage(i + 1);
      imageBytes += image.bytes;
      p = selectWorkingStorey(p, p, s.id);
      p = previewCreateReference(p, p, {
        projectId: p.id,
        asset: {
          id: `scan-${s.id}`,
          mimeType: "image/png",
          pixelWidth: image.width,
          pixelHeight: image.height,
          data: image.data,
        },
        reference: {
          id: `scan-ref-${s.id}`,
          kind: "image-reference",
          assetId: `scan-${s.id}`,
          layerId: p.defaultLayerIds.line,
          origin: { x: -2, y: -2 },
          rotation: 0,
          metresPerPixel: 0.05,
        },
      });
    }
  return {
    project: selectWorkingStorey(p, p, size === "x" ? "s2" : "s0"),
    imageBytes,
  };
}
const targets =
  size === "x"
    ? {
        wall: "s2-b0",
        lengths: ["3 m", "3,5 m"],
        window: "s2-win0",
        door: null as string | null,
        line: "s2-line0",
        partition: null as { x: number; y: number } | null,
        storeys: ["Geschoss 0", "Geschoss 1", "Geschoss 3", "Geschoss 4", "Geschoss 2"],
        home: "Geschoss 2",
      }
    : {
        wall: "s0-w0-par-n3",
        lengths: ["8 m", "8,2 m"],
        window: "s0-w0-win-s0a",
        door: "s0-w0-door-n2" as string | null,
        line: "s0-w0-desk-s0-0",
        partition: { x: 25, y: 4.45 } as { x: number; y: number } | null,
        storeys: [
          "1. Obergeschoss",
          "2. Obergeschoss",
          "3. Obergeschoss",
          "4. Obergeschoss",
          "Erdgeschoss",
        ],
        home: "Erdgeschoss",
      };

// --- steps ---------------------------------------------------------------------------------
type StepResult = {
  step: string;
  ms: number;
  longTaskMs: number;
  heapMB: number | null;
  ok: boolean;
  note?: string;
};
const results: StepResult[] = [];
async function step(name: string, action: () => unknown, check: () => boolean, timeout?: number) {
  currentStep = name;
  const lt = longTaskMs,
    t0 = performance.now();
  let ok = true,
    note: string | undefined;
  try {
    await action();
    await until(check, timeout);
    await paint();
  } catch (e) {
    ok = false;
    note = e instanceof Error ? e.message : String(e);
  }
  const r = {
    step: name,
    ms: Math.round((performance.now() - t0) * 10) / 10,
    longTaskMs: Math.round(longTaskMs - lt),
    heapMB: heapMB(),
    ok,
    ...(note ? { note } : {}),
  };
  results.push(r);
  return r;
}
async function select(kind: string, id: string) {
  await step(
    `Auswahl ${kind}`,
    async () => {
      await until(() => !!element(kind, id), 10000);
      click(element(kind, id)!);
    },
    () => element(kind, id)?.getAttribute("aria-pressed") === "true",
  );
  key("Escape");
  await paint();
  // Escape resets the tool and closes the menu but keeps the selection.
}
async function command(name: string, text: string) {
  const input = label("Modellbefehl") as HTMLInputElement;
  await step(
    `${name} – Vorschau`,
    () => {
      input.focus();
      setInput(input, text);
      input.form!.requestSubmit();
    },
    () => !!button("Übernehmen"),
  );
  await step(
    `${name} – Übernehmen`,
    () => click(button("Übernehmen")!),
    () => !button("Übernehmen"),
  );
}
async function openFile(name: string, text: string) {
  const input = label("Projektdatei auswählen") as HTMLInputElement;
  const transfer = new DataTransfer();
  transfer.items.add(new File([text], "schule.json", { type: "application/json" }));
  await step(
    `${name} – Datei prüfen`,
    () => {
      input.files = transfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    },
    () => !!button("Projekt laden"),
    120000,
  );
  await step(
    `${name} – Projekt laden`,
    () => click(button("Projekt laden")!),
    () => !button("Projekt laden") && !!element("wall", targets.wall),
    120000,
  );
}
function summary(project: Project, imageBytes: number, fileBytes: number) {
  return {
    size,
    withImages,
    counts: size === "x" ? null : schoolPlanCounts(project),
    imageBytes,
    fileMB: Math.round((fileBytes / 1048576) * 100) / 100,
    userAgent: navigator.userAgent,
  };
}
function stats(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))]!;
  return { n: s.length, median: at(0.5), p95: at(0.95), max: s[s.length - 1]! };
}

async function phaseOne() {
  await until(() => !!label("Projektdatei auswählen"), 60000);
  await paint();
  const t = performance.now();
  const { project, imageBytes } = await buildModel();
  const fileBytes = new Blob([serializeProject(project)]).size;
  const text = serializeProject(project);
  const setupMs = Math.round(performance.now() - t);
  results.push({
    step: "Modell erzeugen (nicht App)",
    ms: setupMs,
    longTaskMs: 0,
    heapMB: heapMB(),
    ok: true,
  });
  // A recovery offer from an earlier run would pause autosave; continue explicitly.
  if (button("Weiterarbeiten")) click(button("Weiterarbeiten")!);
  await openFile("Öffnen", text);
  if (params.get("drag") === "1") return dragRun(summary(project, imageBytes, fileBytes));

  for (const name of targets.storeys)
    await step(
      `Geschoss ${name}`,
      () =>
        click(
          [...document.querySelectorAll("button")].find((b) => b.textContent?.trim() === name)!,
        ),
      () => bodyText().includes(`BIM Project · ${name}`),
    );

  await select("wall", targets.wall);
  await command("Wandlänge", `Wandlänge auf ${targets.lengths[0]}`);
  await select("window", targets.window);
  await command("Fensterbreite", "Fensterbreite 120 cm");
  if (targets.door) {
    await select("door", targets.door);
    await command("Tür DIN", "Tür DIN links");
  }
  if (targets.partition) {
    const before = document.querySelectorAll('[aria-label^="Select door"]').length;
    await step(
      "Tür setzen",
      async () => {
        key("t");
        await paint();
        const at = screen(targets.partition!);
        const svg = planSvg()!;
        pointer(svg, "pointermove", at.x, at.y);
        await paint();
        svg.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX: at.x,
            clientY: at.y,
          }),
        );
      },
      () => document.querySelectorAll('[aria-label^="Select door"]').length === before + 1,
      10000,
    );
    key("Escape");
    await paint();
  }
  if (targets.door) {
    await select("door", targets.door);
    const doorEl = () => element("door", targets.door!)!;
    const start = centre(doorEl());
    await step(
      "Tür entlang Wand",
      async () => {
        click(doorEl());
        await until(() => !!button("Tür entlang Wand"), 5000);
        click(button("Tür entlang Wand")!);
        await paint();
        const svg = planSvg()!;
        for (let i = 1; i <= 10; i++) {
          pointer(svg, "pointermove", start.x + i * 4, start.y);
          await frame();
        }
        svg.dispatchEvent(
          new MouseEvent("click", {
            bubbles: true,
            cancelable: true,
            clientX: start.x + 40,
            clientY: start.y,
          }),
        );
      },
      () => Math.abs(centre(doorEl()).x - start.x) > 5,
      10000,
    );
    key("Escape");
    await paint();
  }
  const count = openCount();
  await select("line", targets.line);
  await step(
    "Löschen (Entf)",
    () => key("Delete"),
    () => !element("line", targets.line) && openCount() === count - 1,
  );

  // Snap: 100 pointer moves over the dense desk area with the line tool.
  key("l");
  await paint();
  const svg = planSvg()!;
  const origin = screen(size === "x" ? { x: 5, y: -2 } : { x: 3, y: 2 });
  const snap: number[] = [];
  currentStep = "Fang";
  for (let i = 0; i < 100; i++) {
    const t0 = performance.now();
    pointer(svg, "pointermove", origin.x + (i % 25) * 9, origin.y + Math.floor(i / 25) * 9);
    await paint();
    snap.push(performance.now() - t0);
  }
  key("Escape");
  await paint();

  // 3D: switch, move a door along its wall in 3D (scenario of the open error boundary case).
  if (targets.door) await select("door", targets.door);
  await step(
    "2D → 3D",
    () => click(button("3D")!),
    () => !!document.querySelector("canvas"),
  );
  // The 3D view keeps deriving after its canvas appears; count that apart from the drag.
  await step(
    "3D – Szene fertig",
    async () => {
      const quietSince = () => performance.now() - lastLongTaskEnd;
      const t0 = performance.now();
      while (quietSince() < 500 && performance.now() - t0 < 15000) await frame();
    },
    () => true,
  );
  await step(
    "3D: Tür entlang Wand ziehen",
    async () => {
      if (!targets.door) return;
      click(label("Demand menu")!);
      await until(() => !!button("Tür entlang Wand"), 5000);
      click(button("Tür entlang Wand")!);
      const canvas = document.querySelector("canvas")!;
      const c = centre(canvas);
      for (let i = 0; i < 30; i++) {
        pointer(canvas, "pointermove", c.x + (i - 15) * 6, c.y + Math.sin(i) * 20);
        await frame();
      }
      key("Escape");
    },
    () => true,
  );
  await step(
    "3D → 2D",
    () => click(button("2D")!),
    () => !!element("wall", targets.wall),
  );

  const undo: number[] = [],
    redo: number[] = [];
  for (const [list, ctrlKey, name] of [
    [undo, "z", "Undo"],
    [redo, "y", "Redo"],
  ] as const)
    for (let i = 0; i < 20; i++) {
      currentStep = name;
      const t0 = performance.now();
      key(ctrlKey, true);
      await paint();
      list.push(performance.now() - t0);
    }

  captured = null;
  await step(
    "Speichern (Datei erzeugen)",
    () => click(label("Save project")!),
    () => !!captured,
  );
  const saved = captured as { text: string } | null;
  if (saved) await openFile("Neu öffnen", saved.text);

  // Long session: 50 alternating wall edits, heap sampled each round.
  const session: number[] = [],
    sessionHeap: (number | null)[] = [],
    sessionReleased: number[] = [];
  for (let i = 0; i < 50; i++) {
    await select("wall", targets.wall);
    const r0 = results.length;
    const released = releasedDerivedCount();
    await command(`Dauerlauf ${i + 1}`, `Wandlänge auf ${targets.lengths[(i + 1) % 2]}`);
    session.push(results.slice(r0).reduce((n, r) => n + r.ms, 0));
    sessionHeap.push(heapMB());
    sessionReleased.push(releasedDerivedCount() - released);
    results.splice(r0 - 1);
  }

  // Heap after idle time: usedJSHeapSize includes garbage until the engine collects it.
  const heapAfterIdle = await idle(5000);

  // Autosave then reload; phase two restores from recovery.
  await step(
    "Autosicherung aktuell",
    () => undefined,
    () => bodyText().includes("Lokaler Snapshot aktuell"),
    120000,
  );
  const report = {
    model: summary(project, imageBytes, fileBytes),
    steps: results,
    snap: stats(snap),
    undo: stats(undo),
    redo: stats(redo),
    session: stats(session),
    sessionHeap,
    // Derived entries the history dropped per edit (one per cache built for the former present).
    sessionReleased,
    heapAfterIdle,
    errors: [...errors],
  };
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(report));
  sessionStorage.setItem(`${RESULT_KEY}-reload`, String(Date.now()));
  location.reload();
}

// --- drag=1: only the 3D door drag, per pointer move (docs/performance/DRAG_RENDERING_3D.md) ----
type Frame = {
  startTime: number;
  duration: number;
  renderStart: number;
  styleAndLayoutStart: number;
  blockingDuration: number;
  scripts: { duration: number }[];
};
const animationFrames: Frame[] = [];
if (PerformanceObserver.supportedEntryTypes.includes("long-animation-frame"))
  new PerformanceObserver((list) =>
    animationFrames.push(...(list.getEntries() as unknown as Frame[])),
  ).observe({ type: "long-animation-frame", buffered: true });
const sum = (values: number[]) => values.reduce((n, v) => n + v, 0);
const round = (v: number) => Math.round(v * 10) / 10;

async function dragRun(model: ReturnType<typeof summary>) {
  const events = () =>
    (globalThis as { renderEvents?: { name: string; start: number; ms: number; value?: number }[] })
      .renderEvents ?? [];
  const quiet = async () => {
    const t0 = performance.now();
    while (performance.now() - lastLongTaskEnd < 500 && performance.now() - t0 < 15000)
      await frame();
  };
  await select("door", targets.door!);
  await step(
    "2D → 3D",
    () => click(button("3D")!),
    () => !!document.querySelector("canvas"),
  );
  await step("3D – Szene fertig", quiet, () => true);
  const moves: Record<string, number | null>[] = [];
  const drags: { ms: number; longTaskMs: number; frames: Frame[] }[] = [];
  const repeats = Number(params.get("repeats") ?? 5);
  for (let r = 0; r < repeats; r++) {
    await quiet();
    click(label("Demand menu")!);
    await until(() => !!button("Tür entlang Wand"), 5000);
    click(button("Tür entlang Wand")!);
    await paint();
    const canvas = document.querySelector("canvas")!;
    const c = centre(canvas);
    const lt = longTaskMs,
      t0 = performance.now(),
      times: { dispatch: number; handled: number; frame: number }[] = [];
    for (let i = 0; i < 30; i++) {
      const dispatch = performance.now();
      pointer(canvas, "pointermove", c.x + (i - 15) * 6, c.y + Math.sin(i) * 20);
      const handled = performance.now();
      await frame();
      times.push({ dispatch, handled, frame: performance.now() });
    }
    await paint();
    const end = performance.now();
    drags.push({
      ms: round(end - t0),
      longTaskMs: Math.round(longTaskMs - lt),
      frames: animationFrames.filter((f) => f.startTime + f.duration > t0 && f.startTime < end),
    });
    key("Escape");
    for (const [i, t] of times.entries()) {
      const next = times[i + 1]?.dispatch ?? end;
      const inMove = events().filter((e) => e.start >= t.dispatch && e.start < next);
      const of = (name: string) => inMove.filter((e) => e.name === name);
      const draws = of("draw");
      const lastDraw = draws[draws.length - 1];
      moves.push({
        repeat: r,
        move: i,
        moveMs: round(next - t.dispatch),
        frameMs: round(t.frame - t.dispatch),
        handlerMs: round(t.handled - t.dispatch),
        resolveMs: round(sum(of("resolve").map((e) => e.ms))),
        aimMs: round(sum(of("aim").map((e) => e.ms))),
        renders: of("render").length,
        draws: draws.length,
        toDrawMs: draws[0] ? round(draws[0].start - t.dispatch) : null,
        evaluateMs: round(sum(of("evaluate").map((e) => e.ms))),
        updateMs: round(sum(of("update").map((e) => e.ms))),
        drawMs: round(sum(draws.map((e) => e.ms))),
        gpuMs: round(sum(of("gpu").map((e) => e.ms))),
        uploadBytes: sum([...of("upload-patch"), ...of("upload-full")].map((e) => e.value ?? 0)),
        fullUploads: of("upload-full").length,
        triangles: of("triangles")[0]?.value ?? null,
        afterDrawMs: lastDraw ? round(next - (lastDraw.start + lastDraw.ms)) : null,
      });
    }
  }
  const median = (key: string) => {
    const values = moves.map((m) => m[key]).filter((v): v is number => typeof v === "number");
    return values.length ? stats(values).median : null;
  };
  const frames = drags.flatMap((d) => d.frames);
  const report = {
    mode: { gpu: params.get("gpu") === "1", fresh: params.get("fresh") === "1" },
    model,
    steps: results,
    drag: stats(drags.map((d) => d.ms)),
    dragLongTaskMs: drags.map((d) => d.longTaskMs),
    perMoveMedian: Object.fromEntries(
      [
        "moveMs",
        "frameMs",
        "handlerMs",
        "resolveMs",
        "aimMs",
        "renders",
        "draws",
        "toDrawMs",
        "evaluateMs",
        "updateMs",
        "drawMs",
        "gpuMs",
        "uploadBytes",
        "afterDrawMs",
      ].map((k) => [k, median(k)]),
    ),
    perMoveSum: {
      moves: moves.length,
      withoutDraw: moves.filter((m) => !m["draws"]).length,
      fullUploads: sum(moves.map((m) => m["fullUploads"] ?? 0)),
      triangles: moves.find((m) => m["triangles"])?.["triangles"] ?? null,
    },
    // Chrome long animation frames (> 50 ms) during the drags.
    longFrames: {
      count: frames.length,
      durationMs: round(sum(frames.map((f) => f.duration))),
      scriptMs: round(sum(frames.flatMap((f) => f.scripts.map((s) => s.duration)))),
      renderMs: round(
        sum(frames.map((f) => (f.renderStart ? f.startTime + f.duration - f.renderStart : 0))),
      ),
      styleLayoutMs: round(
        sum(
          frames.map((f) =>
            f.styleAndLayoutStart ? f.startTime + f.duration - f.styleAndLayoutStart : 0,
          ),
        ),
      ),
      blockingMs: round(sum(frames.map((f) => f.blockingDuration))),
    },
    moves,
    errors: [...errors],
  };
  (window as unknown as { schoolRun: unknown }).schoolRun = report;
}

async function phaseTwo() {
  const report = JSON.parse(sessionStorage.getItem(RESULT_KEY)!);
  sessionStorage.removeItem(`${RESULT_KEY}-reload`);
  results.length = 0;
  await step(
    "Neuladen bis Wiederherstellungsangebot",
    () => undefined,
    () => !!button("Stände auswählen"),
    120000,
  );
  await step(
    "Wiederherstellung – Stand prüfen",
    async () => {
      click(button("Stände auswählen")!);
      await until(() => !!button("Wiederaufnahme vorbereiten") || !!button("Stand prüfen"), 30000);
      if (!button("Wiederaufnahme vorbereiten")) {
        // Choose the row of this run's project, not the first offered project.
        const row = [...document.querySelectorAll<HTMLButtonElement>("button")]
          .filter((b) => b.textContent?.trim() === "Stand prüfen")
          .find((b) => {
            let row: Element | null = b;
            for (let i = 0; i < 4 && row; i++, row = row.parentElement)
              if (
                row.textContent?.includes(PROJECT_ID) &&
                (PROJECT_ID !== "school" || !row.textContent.includes("school-plan")) &&
                !row.textContent.includes("Gesicherte")
              )
                return true;
            return false;
          });
        click(row ?? button("Stand prüfen")!);
      }
      await until(() => !!button("Wiederaufnahme vorbereiten"), 60000);
      click(button("Wiederaufnahme vorbereiten")!);
    },
    () => !!button("Projekt laden"),
    120000,
  );
  await step(
    "Wiederherstellung – Projekt laden",
    () => click(button("Projekt laden")!),
    () => !button("Projekt laden") && !!element("wall", targets.wall),
    120000,
  );
  report.steps.push(...results);
  report.errors.push(...errors);
  report.loadToRestoredMs = Math.round(performance.now());
  report.heapAfterRestoreIdle = await idle(5000);
  sessionStorage.setItem(RESULT_KEY, JSON.stringify(report));
  (window as unknown as { schoolRun: unknown }).schoolRun = report;
}

(window as unknown as { schoolRunState: () => unknown }).schoolRunState = () => ({
  step: currentStep,
  done: !!(window as unknown as { schoolRun?: unknown }).schoolRun,
  results: results.length,
});
if (sessionStorage.getItem(`${RESULT_KEY}-reload`)) void phaseTwo();
else if (params.get("run") === "1") void phaseOne();
// Diagnostic: entries the undo history dropped so far (docs/performance/HISTORY_MEMORY.md).
(window as unknown as { derivedReleased: () => number }).derivedReleased = releasedDerivedCount;
