import { useEffect, useMemo, useRef, useState } from "react";
import {
  advanceSnapDensity,
  emptySnapDensity,
  DENSE_SEGMENT_LIMIT,
  DENSE_RESUME_MS,
} from "@/application/snapping/density";
import type { SnapDensity } from "@/application/snapping/density";
import type { createToolSourceQuery } from "@/application/tools/snapping";
import type { Point2 } from "@/geometry/primitives/point";

type Query = ReturnType<typeof createToolSourceQuery>;
/** Event/time owner shared by idle, drawing and edit. Queries remain pure. */
export function useSnapDensity(
  query: Query,
  cursor: Point2 | null,
  scale: number,
  enabled: boolean,
  reset: number,
  camera: object,
  selected?: ReadonlySet<string> | null,
) {
  const count = useMemo(
    () => (enabled && cursor ? query.inspect(cursor, scale, 10, selected).segments.length : null),
    [query, cursor, scale, enabled, selected],
  );
  const [snapshot, setSnapshot] = useState<{
    query: Query;
    selected: typeof selected;
    reset: number;
    camera: object;
    state: SnapDensity;
  } | null>(null);
  const eventState = useRef(snapshot);
  useEffect(() => {
    const snapshot = eventState.current;
    const now = performance.now();
    const compatible =
      snapshot?.query === query && snapshot.reset === reset && snapshot.selected === selected;
    let previous = compatible ? snapshot.state : emptySnapDensity();
    if (compatible && snapshot.camera !== camera) previous = { ...previous, lowSince: null };
    const state = enabled ? advanceSnapDensity(previous, count, now) : emptySnapDensity();
    const next = { query, reset, camera, state, selected };
    eventState.current = next;
    setSnapshot(next);
    if (state.lowSince === null) return;
    const timer = window.setTimeout(
      () => {
        const resumed = { ...next, state: advanceSnapDensity(state, count, performance.now()) };
        eventState.current = resumed;
        setSnapshot(resumed);
      },
      Math.max(0, DENSE_RESUME_MS - (now - state.lowSince)) + 1,
    );
    return () => window.clearTimeout(timer);
  }, [query, cursor, count, enabled, reset, camera, selected]);
  const compatible =
    snapshot?.query === query && snapshot.reset === reset && snapshot.selected === selected;
  return {
    count: count ?? 0,
    paused:
      enabled && ((count ?? 0) > DENSE_SEGMENT_LIMIT || (compatible && snapshot.state.paused)),
  };
}
