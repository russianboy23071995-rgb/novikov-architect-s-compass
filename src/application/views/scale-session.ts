import {
  DEFAULT_OUTPUT_SCALE,
  positiveFinite,
  viewScaleKey,
  type ScaleContext,
  type WorkingPlanIdentity,
} from "../../domain/views/scale.ts";

/** Session data outside project snapshots/history and independent of pane lifetime. */
export type ViewScaleSession = Readonly<Record<string, number>>;

export function readViewScale(session: ViewScaleSession, view: WorkingPlanIdentity): ScaleContext {
  return { view: { ...view }, denominator: session[viewScaleKey(view)] ?? DEFAULT_OUTPUT_SCALE };
}

export function changeViewScale(
  session: ViewScaleSession,
  view: WorkingPlanIdentity,
  denominator: number,
): ViewScaleSession {
  const key = viewScaleKey(view);
  positiveFinite(denominator);
  if (readViewScale(session, view).denominator === denominator) return session;
  return { ...session, [key]: denominator };
}

/** Accept a denominator or 1:S; never parse a prefix of an invalid expression. */
export function parseOutputScale(text: string): number {
  const match = /^(?:1\s*:\s*)?(\d+(?:[.,]\d+)?)$/.exec(text.trim());
  if (!match) throw new Error("Maßstab als 1:50 oder positive Zahl eingeben.");
  return positiveFinite(Number(match[1]!.replace(",", ".")));
}
