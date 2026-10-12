import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  workingPlanScale,
  positiveFinite,
  viewScaleKey,
  type WorkingPlanIdentity,
  type ScaleContext,
} from "../../domain/views/scale.ts";

export function projectScaleContext(
  project: Project,
): ScaleContext & { view: WorkingPlanIdentity } {
  return workingPlanScale(
    project.id,
    project.storey.id,
    project.workingViews?.find((view) => view.storeyId === project.storey.id)?.denominator,
  );
}

/** Validated view action; storage belongs to the project, not a pane or the model undo stack. */
export function changeProjectScale(
  project: Project,
  view: WorkingPlanIdentity,
  denominator: number,
): Project {
  viewScaleKey(view);
  if (view.projectId !== project.id || view.storeyId !== project.storey.id)
    throw new Error("Die Arbeitsansicht wurde geÃ¤ndert. MaÃŸstab erneut wÃ¤hlen.");
  positiveFinite(denominator);
  if (projectScaleContext(project).denominator === denominator) return project;
  return validateProject({
    ...project,
    workingViews: [{ kind: "working-plan", storeyId: view.storeyId, denominator }],
  });
}
