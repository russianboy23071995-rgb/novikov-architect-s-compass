import { createManualTrace, type TraceEvent, type ManualTraceData } from "./manual-trace";

export type ManualReport = ManualTraceData & {
  reason: "manual" | "timeout" | "unmount";
  longTasksSupported: boolean;
  userAgent: string;
  viewport: { width: number; height: number; devicePixelRatio: number };
};
let sink: ((event: TraceEvent) => void) | null = null;
export const isManualCaptureActive = () => sink !== null;
export function recordManualPhase(name: string, at: number, duration: number) {
  sink?.({ kind: "phase", name, at, duration });
}
export function recordManualReact(
  phase: string,
  duration: number,
  at: number,
  renderStartedAt: number,
) {
  sink?.({ kind: "react", phase, at, duration, renderStartedAt });
}

/** Listen only. Never prevent input or change the project. No per-event React updates. */
export function startManualCapture(done: (report: ManualReport) => void) {
  if (sink) throw new Error("A recording is already running");
  const trace = createManualTrace(performance.now());
  sink = trace.add;
  let stopped = false;
  let previousFrame = trace.start;
  let raf = 0;
  let observer: PerformanceObserver | undefined;
  let longTasksSupported = false;
  const longTasks = (entries: PerformanceEntry[]) => {
    for (const entry of entries)
      trace.add({ kind: "long-task", at: entry.startTime, duration: entry.duration });
  };
  if (
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes?.includes("longtask")
  ) {
    try {
      observer = new PerformanceObserver((list) => longTasks(list.getEntries()));
      observer.observe({ type: "longtask" });
      longTasksSupported = true;
    } catch {
      observer?.disconnect();
      observer = undefined;
    }
  }
  const frame = (at: number) => {
    trace.add({ kind: "frame", at, duration: at - previousFrame });
    previousFrame = at;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  const pointer = (event: MouseEvent) => {
    if (!(event.target instanceof Element) || !event.target.closest("main")) return;
    const at = performance.now();
    trace.add({
      kind: "pointer",
      name: event.type,
      at,
      x: event.clientX,
      y: event.clientY,
      shift: event.shiftKey,
      trusted: event.isTrusted,
      delayMs: Math.max(0, at - event.timeStamp),
    });
  };
  const key = (event: KeyboardEvent) => {
    if (event.key !== "Shift") return;
    const at = performance.now();
    trace.add({
      kind: "shift",
      at,
      down: event.type === "keydown",
      repeat: event.repeat,
      trusted: event.isTrusted,
      delayMs: Math.max(0, at - event.timeStamp),
    });
  };
  const blur = () => trace.add({ kind: "lifecycle", at: performance.now(), name: "blur" });
  const visibility = () =>
    trace.add({
      kind: "lifecycle",
      at: performance.now(),
      name: document.hidden ? "hidden" : "visible",
    });
  const pointerTypes = ["pointermove", "pointerdown", "pointerup", "click"] as const;
  for (const type of pointerTypes) window.addEventListener(type, pointer, true);
  window.addEventListener("keydown", key, true);
  window.addEventListener("keyup", key, true);
  window.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  const timer = window.setTimeout(() => stop("timeout"), trace.durationMs);
  function stop(reason: ManualReport["reason"] = "manual") {
    if (stopped) return;
    stopped = true;
    sink = null;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    if (observer) {
      longTasks(observer.takeRecords());
      observer.disconnect();
    }
    for (const type of pointerTypes) window.removeEventListener(type, pointer, true);
    window.removeEventListener("keydown", key, true);
    window.removeEventListener("keyup", key, true);
    window.removeEventListener("blur", blur);
    document.removeEventListener("visibilitychange", visibility);
    done({
      ...trace.snapshot(performance.now()),
      reason,
      longTasksSupported,
      userAgent: navigator.userAgent,
      viewport: { width: innerWidth, height: innerHeight, devicePixelRatio },
    });
  }
  return stop;
}
