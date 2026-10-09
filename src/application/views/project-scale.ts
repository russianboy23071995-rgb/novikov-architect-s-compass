import { validateProject, type Project } from "../../domain/project/schema.ts";
import {
  DEFAULT_OUTPUT_SCALE,
  positiveFinite,
  viewScaleKey,
  type WorkingPlanIdentity,
  type ScaleContext,
} from "../../domain/views/scale.ts";

export function projectScaleContext(project: Project): ScaleContext {
  return {
    view: { kind: "working-plan", projectId: project.id, storeyId: project.storey.id },
    denominator:
      project.workingViews?.find((view) => view.storeyId === project.storey.id)?.denominator ??
      DEFAULT_OUTPUT_SCALE,
  };
}

/** Validated view action; storage belongs to the project, not a pane or the model undo stack. */
export function changeProjectScale(
  project: Project,
  view: WorkingPlanIdentity,
  denominator: number,
): Project {
  viewScaleKey(view);
  if (view.projectId !== project.id || view.storeyId !== project.storey.id)
    throw new Error("Die Arbeitsansicht wurde geändert. Maßstab erneut wählen.");
  positiveFinite(denominator);
  if (projectScaleContext(project).denominator === denominator) return project;
  return validateProject({
    ...project,
    workingViews: [{ kind: "working-plan", storeyId: view.storeyId, denominator }],
  });
}
