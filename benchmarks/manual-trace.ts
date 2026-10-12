/** Bounded diagnostic data only: no model, DOM nodes, text inputs or asset data. */
export type TraceEvent = { at: number } & (
  | {
      kind: "pointer";
      name: string;
      x: number;
      y: number;
      shift: boolean;
      trusted: boolean;
      delayMs: number;
    }
  | { kind: "shift"; down: boolean; repeat: boolean; trusted: boolean; delayMs: number }
  | { kind: "phase"; name: string; duration: number }
  | { kind: "react"; phase: string; duration: number; renderStartedAt: number }
  | { kind: "frame" | "long-task"; duration: number }
  | { kind: "lifecycle"; name: "blur" | "hidden" | "visible" }
);

export function createManualTrace(start: number, capacity = 10000, durationMs = 30000) {
  if (
    !Number.isFinite(start) ||
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  )
    throw new Error("Invalid trace limits");
  const entries: TraceEvent[] = [];
  let next = 0,
    total = 0;
  return {
    start,
    durationMs,
    add(event: TraceEvent) {
      if (!Number.isFinite(event.at) || event.at < start || event.at > start + durationMs) return;
      const entry = { ...event, at: event.at - start };
      if (entry.kind === "react") entry.renderStartedAt -= start;
      entries[next] = entry;
      next = (next + 1) % capacity;
      total++;
    },
    snapshot(end: number) {
      const ordered =
        total > capacity ? [...entries.slice(next), ...entries.slice(0, next)] : entries;
      return {
        schemaVersion: 1,
        durationMs: Math.max(0, Math.min(durationMs, end - start)),
        capacity,
        droppedEvents: Math.max(0, total - capacity),
        clock: "milliseconds relative to recording start; performance.now()" as const,
        // Observers deliver asynchronously: sort by occurrence, not delivery time.
        events: ordered.map((e) => ({ ...e })).sort((a, b) => a.at - b.at),
      };
    },
  };
}

export type ManualTraceData = ReturnType<ReturnType<typeof createManualTrace>["snapshot"]>;
