// Loaded only by the diagnostic Vite configuration, never by product imports.
import { isManualCaptureActive, recordManualPhase } from "./manual-capture";
export type MovementSample = {
  elapsedMs: number;
  input?: { clientX: number; clientY: number };
  phases: Record<string, { ms: number; calls: number }>;
  reactCommits: number;
  reactMs: number;
  previewStart?: { x: number; y: number };
};
const preparationMs: number[] = [];
export function takePreparations() {
  return preparationMs.splice(0);
}
let active: (MovementSample & { started: number }) | null = null;
export function startMovementSample() {
  if (active) throw new Error("Overlapping movement samples");
  active = { started: performance.now(), elapsedMs: 0, phases: {}, reactCommits: 0, reactMs: 0 };
}
export function tracePhase<T>(phase: string, fn: () => T): T {
  const sample = active;
  if (phase === "selection-prepare") {
    const started = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - started;
      preparationMs.push(duration);
      recordManualPhase(phase, started, duration);
    }
  }
  if (!sample && !isManualCaptureActive()) return fn();
  const start = performance.now();
  try {
    const result = fn();
    if (sample && phase === "selection-preview") {
      const p = (
        result as { geometry: { storey?: { walls?: { start: { x: number; y: number } }[] } } }
      ).geometry;
      if (p.storey?.walls?.[0]) sample.previewStart = { ...p.storey.walls[0].start };
    }
    return result;
  } finally {
    const duration = performance.now() - start;
    recordManualPhase(phase, start, duration);
    if (sample) {
      const entry = (sample.phases[phase] ??= { ms: 0, calls: 0 });
      entry.ms += duration;
      entry.calls++;
    }
  }
}
export function traceReactCommit(duration: number) {
  if (active) {
    active.reactCommits++;
    active.reactMs += duration;
  }
}
export function finishMovementSample(): MovementSample {
  if (!active) throw new Error("Missing movement sample");
  const { started, ...result } = active;
  active = null;
  return { ...result, elapsedMs: performance.now() - started };
}
export function discardMovementSample() {
  active = null;
}
export function movementPreview() {
  return active?.reactCommits ? active.previewStart : undefined;
}
