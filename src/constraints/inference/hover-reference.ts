import type { SnapReference, SnapSourceQuery } from "../snapping/engine.ts";

export const DEFAULT_HOVER_DWELL_MS = 600;

export type HoverContext = {
  intersectionsPaused?: boolean;
  sourceQuery?: SnapSourceQuery;
  enabled: boolean;
  references: readonly SnapReference[];
  pixelsPerMetre: number;
  resetKey?: number;
  pinnedReferences?: readonly SnapReference[];
};

/** View navigation changes screen scale, not the identity of model-space references. */
export function sameHoverSession(a: HoverContext, b: HoverContext): boolean {
  return (
    a.enabled &&
    b.enabled &&
    a.references === b.references &&
    a.sourceQuery === b.sourceQuery &&
    a.resetKey === b.resetKey
  );
}

/** Navigation cannot complete a dwell or toggle a reference. Leaving allows a fresh visit. */
export function suspendHoverReference(
  state: HoverReferenceState,
  leaving: boolean,
): HoverReferenceState {
  return { ...state, pending: null, consumed: leaving ? null : state.consumed };
}

export type HoverReferenceState = {
  pending: { reference: SnapReference; since: number } | null;
  active: SnapReference | null;
  consumed: SnapReference | null;
  references: SnapReference[];
};
export const emptyHoverReference = (): HoverReferenceState => ({
  pending: null,
  consumed: null,
  active: null,
  references: [],
});

export function sameReference(a: SnapReference, b: SnapReference): boolean {
  return (
    a.entityId === b.entityId &&
    a.feature === b.feature &&
    a.point.x === b.point.x &&
    a.point.y === b.point.y
  );
}

/** Explicit monotonic time in milliseconds. Leaving a point cancels acquisition, not tracking. */
export function advanceHoverReference(
  state: HoverReferenceState,
  reference: SnapReference | null,
  now: number,
  dwellMs: number,
): HoverReferenceState {
  if (!Number.isFinite(now) || !Number.isFinite(dwellMs) || dwellMs < 0)
    throw new Error("Invalid hover timing");
  if (!reference) return { ...state, pending: null, consumed: null };
  // One toggle per continuous visit; a departure or different source rearms dwell.
  if (state.consumed && sameReference(state.consumed, reference)) return state;
  const pending =
    state.pending && sameReference(state.pending.reference, reference) && now >= state.pending.since
      ? state.pending
      : {
          reference: { ...reference, point: { ...reference.point } },
          since: now,
        };
  if (now - pending.since < dwellMs) return { ...state, pending, consumed: null };
  const remaining = state.references.filter((r) => !sameReference(r, pending.reference));
  const references =
    remaining.length < state.references.length
      ? remaining
      : [...remaining, pending.reference].slice(-4);
  return {
    pending: null,
    consumed: pending.reference,
    active: references.at(-1) ?? null,
    references,
  };
}
