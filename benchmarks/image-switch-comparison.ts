import { imageResourcePilotStats } from "./image-resource-pilot";

const names = [
  "Erdgeschoss",
  "1. Obergeschoss",
  "2. Obergeschoss",
  "3. Obergeschoss",
  "4. Obergeschoss",
];
const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const nextFrame = () =>
  new Promise<number>((resolve, reject) => {
    const timer = setTimeout(() => reject(Error("Animation frame timeout")), 5000);
    requestAnimationFrame((time) => {
      clearTimeout(timer);
      resolve(time);
    });
  });

/** Fixture UI only. Synthetic events exercise the real open-document handler.
 * RAF latency is not a CPU profile, image-decode completion, or a physical display timestamp.
 */
export async function compareImageSwitches() {
  if (document.visibilityState !== "visible") throw Error("Keep the diagnostic page visible");
  const tabs = [...document.querySelectorAll<HTMLElement>('[role="tab"]')];
  const documents = tabs.find((e) => e.textContent?.trim() === "Abbilder");
  if (!documents) throw Error("Abbilder tab missing");
  documents.click();
  await delay(1000);
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
  };
  document.addEventListener("pointerdown", interrupt, true);
  document.addEventListener("visibilitychange", interrupt);
  const longTasks: { start: number; duration: number }[] = [];
  const longFrames: { start: number; duration: number }[] = [];
  const taskObserver = new PerformanceObserver((list) => {
    longTasks.push(...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })));
  });
  const frameObserver = new PerformanceObserver((list) => {
    longFrames.push(
      ...list.getEntries().map((e) => ({ start: e.startTime, duration: e.duration })),
    );
  });
  if (PerformanceObserver.supportedEntryTypes.includes("longtask"))
    taskObserver.observe({ type: "longtask" });
  if (PerformanceObserver.supportedEntryTypes.includes("long-animation-frame"))
    frameObserver.observe({ type: "long-animation-frame" });
  const samples = [];
  try {
    for (let i = 0; i < 25; i++) {
      if (interrupted) throw Error("Measurement interrupted by input or visibility change");
      const name = names[i % names.length]!;
      const target = [...document.querySelectorAll<HTMLElement>('[role="treeitem"]')].find(
        (e) => e.getAttribute("aria-label") === name || e.textContent?.trim() === name,
      );
      if (!target) throw Error(`Missing fixture document: ${name}`);
      await nextFrame();
      const start = performance.now();
      target.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, button: 0, detail: 2 }));
      const dispatchMs = performance.now() - start;
      await nextFrame();
      await nextFrame();
      const end = performance.now();
      if (target.getAttribute("aria-selected") !== "true")
        throw Error(`Document did not open: ${name}`);
      samples.push({
        phase: i < 5 ? "first-pass" : "warm",
        name,
        start,
        end,
        dispatchMs,
        twoRafMs: end - start,
      });
      await delay(200);
    }
    await delay(200);
    if (interrupted) throw Error("Measurement interrupted");
    return {
      method:
        "25 synthetic dblclicks through real fixture UI; 5 first-pass then 20 warm; two RAF callbacks after dispatch. Not CPU/decode/display-complete evidence.",
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, dpr: devicePixelRatio },
      support: {
        longtask: PerformanceObserver.supportedEntryTypes.includes("longtask"),
        longAnimationFrame:
          PerformanceObserver.supportedEntryTypes.includes("long-animation-frame"),
      },
      resources: imageResourcePilotStats(),
      samples,
      longTasks,
      longFrames,
    };
  } finally {
    taskObserver.disconnect();
    frameObserver.disconnect();
    document.removeEventListener("pointerdown", interrupt, true);
    document.removeEventListener("visibilitychange", interrupt);
  }
}
