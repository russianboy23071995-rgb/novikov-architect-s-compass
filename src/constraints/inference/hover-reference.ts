import type { SnapReference } from "../snapping/engine.ts";

export type HoverReferenceState = {
  pending: { reference: SnapReference; since: number } | null;
  active: SnapReference | null;
  references: SnapReference[];
};
export const emptyHoverReference = (): HoverReferenceState => ({
  pending: null,
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
  if (!reference) return { ...state, pending: null };
  const pending =
    state.pending && sameReference(state.pending.reference, reference) && now >= state.pending.since
      ? state.pending
      : {
          reference: { ...reference, point: { ...reference.point } },
          since: now,
        };
  if (now - pending.since < dwellMs) return { ...state, pending };
  const references = [
    ...state.references.filter((r) => !sameReference(r, pending.reference)),
    pending.reference,
  ].slice(-4);
  return { pending, active: pending.reference, references };
}
