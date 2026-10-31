/** Identity of the existing semantic plan, never a screen pane index. */
export type WorkingPlanIdentity = {
  kind: "working-plan";
  projectId: string;
  storeyId: string;
};
export type DocumentIdentity = { kind: "drawing-document"; projectId: string; documentId: string };
export type ViewIdentity = WorkingPlanIdentity | DocumentIdentity;
export type ScaleContext = { view: ViewIdentity; denominator: number };
export type DisplayLength = { mode: "model" | "paper"; metres: number };
export const DEFAULT_OUTPUT_SCALE = 100;

export function positiveFinite(value: number): number {
  if (!Number.isFinite(value) || value <= 0)
    throw new Error("Eine endliche, positive Größe ist erforderlich.");
  return value;
}

export function viewScaleKey(view: ViewIdentity): string {
  if (view.kind === "drawing-document") {
    if (!view.projectId?.trim() || !view.documentId?.trim())
      throw new Error("Ungültiger Abbildkontext.");
    return JSON.stringify([view.kind, view.projectId, view.documentId]);
  }
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
): ScaleContext & { view: WorkingPlanIdentity } {
  return { view: { kind: "working-plan", projectId, storeyId }, denominator };
}

/** Output scale of the working storey's plan (1:denominator); 1:100 until one is set. */
export function planDenominator(project: {
  workingStoreyId?: string | undefined;
  groundStoreyId?: string;
  storeys: readonly { id: string }[];
  workingViews?: readonly { storeyId: string; denominator: number }[] | undefined;
}): number {
  const storeyId = project.workingStoreyId ?? project.storeys[0]?.id;
  return (
    project.workingViews?.find((v) => v.storeyId === storeyId)?.denominator ?? DEFAULT_OUTPUT_SCALE
  );
}
