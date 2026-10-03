import { useEffect, useRef, useState } from "react";
import {
  advanceHoverReference,
  emptyHoverReference,
} from "@/constraints/inference/hover-reference";
import type { HoverReferenceState } from "@/constraints/inference/hover-reference";
import { querySnap } from "@/constraints/snapping/engine";
import type { SnapReference } from "@/constraints/snapping/engine";
import type { Point2 } from "@/geometry/primitives/point";

/** React supplies pointer/time events; acquisition decisions live in the pure inference module. */
export function useHoverReference(
  cursor: Point2 | null,
  context: { enabled: boolean; references: readonly SnapReference[]; pixelsPerMetre: number },
  dwellMs: number,
): readonly SnapReference[] {
  const state = useRef<{ context: typeof context; value: HoverReferenceState } | null>(null);
  const [snapshot, setSnapshot] = useState<typeof state.current>(null);
  useEffect(() => {
    if (!context.enabled || !cursor) {
      state.current = null;
      setSnapshot(null);
      return;
    }
    const candidate = querySnap(cursor, {
      ...context,
      endpointRadiusPx: 10,
      gridSpacing: null,
      orthoOrigin: null,
    }).candidate;
    const reference = candidate
      ? {
          point: candidate.worldPoint,
          entityId: candidate.sourceEntityId!,
          feature: candidate.sourceFeature,
        }
      : null;
    const update = () => {
      const before =
        state.current?.context === context ? state.current.value : emptyHoverReference();
      const next = {
        context,
        value: advanceHoverReference(before, reference, performance.now(), dwellMs),
      };
      state.current = next;
      setSnapshot(next);
      return next.value;
    };
    const value = update();
    if (!value.pending) return;
    const timer = window.setTimeout(
      update,
      Math.max(0, dwellMs - (performance.now() - value.pending.since)) + 1,
    );
    return () => window.clearTimeout(timer);
  }, [cursor, context, dwellMs]);
  return context.enabled && cursor && snapshot?.context === context
    ? snapshot.value.references
    : [];
}
