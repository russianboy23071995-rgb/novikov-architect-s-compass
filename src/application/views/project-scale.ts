import { defaultWorkingPlan, resolveViewStorey } from "../storeys/context.ts";
import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  workingPlanScale,
  positiveFinite,
  type WorkingPlanIdentity,
  type ScaleContext,
} from "../../domain/views/scale.ts";

export function projectScaleContext(
  project: Project,
  view: WorkingPlanIdentity = defaultWorkingPlan(project),
): ScaleContext & { view: WorkingPlanIdentity } {
  if (view.kind !== "working-plan") throw new Error("Ungültige Arbeitsansicht.");
  const { storey } = resolveViewStorey(project, view);
  return workingPlanScale(
    project.id,
    storey.id,
    project.workingViews?.find((view) => view.storeyId === storey.id)?.denominator,
  );
}

/** Validated view action; storage belongs to the project, not a pane or the model undo stack. */
export function changeProjectScale(
  project: Project,
  view: WorkingPlanIdentity,
  denominator: number,
): Project {
  const current = projectScaleContext(project, view);
  positiveFinite(denominator);
  if (current.denominator === denominator) return project;
  return validateProject({
    ...project,
    workingViews: [{ kind: "working-plan", storeyId: view.storeyId, denominator }],
  });
}
