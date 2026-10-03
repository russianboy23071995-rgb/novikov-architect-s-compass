import {
  acquisitionReference,
  withConstructionReferences,
} from "@/constraints/inference/construction-reference";
import { useEffect, useRef, useState } from "react";
import {
  advanceHoverReference,
  emptyHoverReference,
} from "@/constraints/inference/hover-reference";
import type { HoverReferenceState } from "@/constraints/inference/hover-reference";
import { querySnap } from "@/constraints/snapping/engine";
import type { SnapReference } from "@/constraints/snapping/engine";
import type { Point2 } from "@/geometry/primitives/point";
import { advanceGuideDirections } from "@/constraints/guides/directions";
import type { GuideDirection } from "@/constraints/guides/directions";

/** React supplies pointer/time events; acquisition decisions live in the pure inference module. */
export function useHoverReference(
  cursor: Point2 | null,
  context: { enabled: boolean; references: readonly SnapReference[]; pixelsPerMetre: number },
  dwellMs: number,
) {
  const state = useRef<{
    context: typeof context;
    value: HoverReferenceState;
    guides: GuideDirection[];
  } | null>(null);
  const [snapshot, setSnapshot] = useState<typeof state.current>(null);
  useEffect(() => {
    if (!context.enabled || !cursor) {
      state.current = null;
      setSnapshot(null);
      return;
    }
    const current =
      state.current?.context === context ? state.current.value : emptyHoverReference();
    const sources = withConstructionReferences(context.references, current.references);
    const guides = advanceGuideDirections(
      cursor,
      current.references,
      state.current?.context === context ? state.current.guides : [],
    );
    const candidate = querySnap(cursor, {
      ...context,
      references: sources,
      activeReferences: current.references,
      guideDirections: guides,
      endpointRadiusPx: 10,
      gridSpacing: null,
      orthoOrigin: null,
    }).candidate;
    const reference = acquisitionReference(candidate, sources);
    const update = () => {
      const before =
        state.current?.context === context ? state.current.value : emptyHoverReference();
      const value = advanceHoverReference(before, reference, performance.now(), dwellMs);
      const next = {
        context,
        value,
        guides: advanceGuideDirections(cursor, value.references, guides),
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
  const references =
    context.enabled && cursor && snapshot?.context === context ? snapshot.value.references : [];
  return {
    references,
    guideDirections: cursor
      ? advanceGuideDirections(
          cursor,
          references,
          snapshot?.context === context ? snapshot.guides : [],
        )
      : [],
  };
}
