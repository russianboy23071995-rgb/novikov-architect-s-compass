import { hoveredSegment, withParallelDirections } from "@/constraints/inference/segment-hover";
import {
  acquisitionReference,
  withConstructionReferences,
} from "@/constraints/inference/construction-reference";
import { useEffect, useRef, useState } from "react";
import {
  advanceHoverReference,
  emptyHoverReference,
  sameHoverSession,
  suspendHoverReference,
  sameReference,
} from "@/constraints/inference/hover-reference";
import type { HoverReferenceState } from "@/constraints/inference/hover-reference";
import type { HoverContext } from "@/constraints/inference/hover-reference";
import { querySnap } from "@/constraints/snapping/engine";
import type { Point2 } from "@/geometry/primitives/point";
import { advanceGuideDirections } from "@/constraints/guides/directions";
import type { GuideDirection } from "@/constraints/guides/directions";

/** React supplies pointer/time events; acquisition decisions live in the pure inference module. */
export function useHoverReference(cursor: Point2 | null, context: HoverContext, dwellMs: number) {
  const state = useRef<{
    context: typeof context;
    value: HoverReferenceState;
    guides: GuideDirection[];
    cursor: Point2 | null;
  } | null>(null);
  const [snapshot, setSnapshot] = useState<typeof state.current>(null);
  useEffect(() => {
    if (!context.enabled) {
      state.current = null;
      setSnapshot(null);
      return;
    }
    const compatible = state.current && sameHoverSession(state.current.context, context);
    if (!compatible)
      state.current = { context, value: emptyHoverReference(), guides: [], cursor: null };
    if (!cursor || (compatible && state.current!.context !== context)) {
      const next = {
        ...state.current!,
        context,
        value: suspendHoverReference(state.current!.value, !cursor),
      };
      state.current = next;
      setSnapshot(next);
      return;
    }
    const current = state.current!.value;
    const active = withParallelDirections([
      ...(context.pinnedReferences ?? []),
      ...current.references,
    ]);
    const sources = withConstructionReferences(
      context.sourceQuery
        ? context.sourceQuery(cursor, context.pixelsPerMetre, 10, active)
        : context.references,
      active,
    );
    const guides = advanceGuideDirections(
      cursor,
      active,
      state.current?.context === context ? state.current.guides : [],
    );
    const candidate = querySnap(cursor, {
      ...context,
      sourceQuery: undefined,
      references: sources,
      activeReferences: active,
      guideDirections: guides,
      endpointRadiusPx: 10,
      gridSpacing: null,
      orthoOrigin: null,
    }).candidate;
    const exact =
      candidate && ["endpoint", "midpoint", "segment-intersection"].includes(candidate.kind);
    const acquired = exact
      ? acquisitionReference(candidate, sources)
      : (hoveredSegment(cursor, sources, context.pixelsPerMetre) ??
        acquisitionReference(candidate, sources));
    const reference =
      acquired && !context.pinnedReferences?.some((r) => sameReference(r, acquired))
        ? acquired
        : null;
    const update = () => {
      const before =
        state.current?.context === context ? state.current.value : emptyHoverReference();
      const value = advanceHoverReference(before, reference, performance.now(), dwellMs);
      const next = {
        context,
        cursor,
        value,
        guides: advanceGuideDirections(
          cursor,
          withParallelDirections([...(context.pinnedReferences ?? []), ...value.references]),
          guides,
        ),
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
  const compatible = snapshot && sameHoverSession(snapshot.context, context);
  const references = context.enabled
    ? withParallelDirections([
        ...(context.pinnedReferences ?? []),
        ...(compatible ? snapshot.value.references : []),
      ])
    : [];
  const guideCursor = compatible ? (cursor ?? snapshot.cursor) : null;
  return {
    references,
    guideCursor,
    guideDirections: guideCursor
      ? advanceGuideDirections(guideCursor, references, compatible ? snapshot.guides : [])
      : [],
  };
}
