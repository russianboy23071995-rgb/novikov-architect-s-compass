import type { SnapReference } from "../snapping/engine.ts";

export type HoverReferenceState = {
  pending: { reference: SnapReference; since: number } | null;
  active: SnapReference | null;
};
export const emptyHoverReference = (): HoverReferenceState => ({ pending: null, active: null });

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
  if (!reference) return { pending: null, active: state.active };
  const pending =
    state.pending && sameReference(state.pending.reference, reference) && now >= state.pending.since
      ? state.pending
      : {
          reference: { ...reference, point: { ...reference.point } },
          since: now,
        };
  return { pending, active: now - pending.since >= dwellMs ? pending.reference : state.active };
}
