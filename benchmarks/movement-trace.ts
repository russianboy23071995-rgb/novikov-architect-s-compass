// Loaded only by the diagnostic Vite configuration, never by product imports.
export type MovementSample = {
  elapsedMs: number;
  input?: { clientX: number; clientY: number };
  phases: Record<string, { ms: number; calls: number }>;
  reactCommits: number;
  reactMs: number;
  previewStart?: { x: number; y: number };
};
let active: (MovementSample & { started: number }) | null = null;
export function startMovementSample() {
  if (active) throw new Error("Overlapping movement samples");
  active = { started: performance.now(), elapsedMs: 0, phases: {}, reactCommits: 0, reactMs: 0 };
}
export function tracePhase<T>(phase: string, fn: () => T): T {
  const sample = active;
  if (!sample) return fn();
  const start = performance.now();
  try {
    const result = fn();
    if (phase === "selection-preview") {
      const p = result as { storey?: { walls?: { start: { x: number; y: number } }[] } };
      if (p.storey?.walls?.[0]) sample.previewStart = { ...p.storey.walls[0].start };
    }
    return result;
  } finally {
    const entry = (sample.phases[phase] ??= { ms: 0, calls: 0 });
    entry.ms += performance.now() - start;
    entry.calls++;
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
