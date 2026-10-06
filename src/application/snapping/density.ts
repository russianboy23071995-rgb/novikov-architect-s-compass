/** Provisional measured guard. Time is supplied by the event owner, never querySnap. */
export const DENSE_SEGMENT_LIMIT = 32;
export const DENSE_RESUME_LIMIT = 24;
export const DENSE_RESUME_MS = 250;
export type SnapDensity = { paused: boolean; lowSince: number | null };
export const emptySnapDensity = (): SnapDensity => ({ paused: false, lowSince: null });
export function advanceSnapDensity(
  state: SnapDensity,
  count: number | null,
  now: number,
): SnapDensity {
  if (count === null) return { paused: state.paused, lowSince: null };
  if (count > DENSE_SEGMENT_LIMIT) return { paused: true, lowSince: null };
  if (!state.paused) return emptySnapDensity();
  if (count > DENSE_RESUME_LIMIT) return { paused: true, lowSince: null };
  const since = state.lowSince ?? now;
  return now - since >= DENSE_RESUME_MS ? emptySnapDensity() : { paused: true, lowSince: since };
}
