/** Identity of the existing semantic plan, never a screen pane index. */
export type WorkingPlanIdentity = {
  kind: "working-plan";
  projectId: string;
  storeyId: string;
};
export type ScaleContext = { view: WorkingPlanIdentity; denominator: number };
export type DisplayLength = { mode: "model" | "paper"; metres: number };
export const DEFAULT_OUTPUT_SCALE = 100;

export function positiveFinite(value: number): number {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error("Eine endliche, positive Größe ist erforderlich.");
  return value;
}

export function viewScaleKey(view: WorkingPlanIdentity): string {
  if (view.kind !== "working-plan" || !view.projectId?.trim() || !view.storeyId?.trim())
    throw new Error("Ungültiger Ansichtskontext.");
  return JSON.stringify([view.kind, view.projectId, view.storeyId]);
}

export function validateScaleContext(context: ScaleContext): ScaleContext {
  viewScaleKey(context.view);
  positiveFinite(context.denominator);
  return context;
}

export function workingPlanScale(
  projectId: string,
  storeyId: string,
  denominator = DEFAULT_OUTPUT_SCALE,
): ScaleContext {
  return { view: { kind: "working-plan", projectId, storeyId }, denominator };
}
