import type { Project } from "../../domain/project/schema.ts";
import { viewScaleKey, type WorkingPlanIdentity } from "../../domain/views/scale.ts";
import { projectScaleContext } from "./project-scale.ts";
import { createLayerVisibilityPolicy, type LayerVisibilityContext } from "../layers/visibility.ts";

/** Resolve once per immutable snapshot/binding, never per pointer or camera update.
 * An explicit visibility override is a caller-owned policy, not document persistence.
 */
export function resolveWorkingView(
  project: Project,
  binding: WorkingPlanIdentity = projectScaleContext(project).view,
  visibilityOverride?: LayerVisibilityContext,
) {
  viewScaleKey(binding);
  if (binding.projectId !== project.id || binding.storeyId !== project.storey.id)
    throw new Error("Die Arbeitsansicht gehört nicht zu diesem Projekt oder Geschoss.");
  const scale = projectScaleContext(project);
  const visibility = createLayerVisibilityPolicy(
    project,
    visibilityOverride ?? {
      scope: { kind: "bim-project" },
      hiddenLayerIds: project.bimVisibility.hiddenLayerIds,
    },
  );
  return Object.freeze({
    binding: Object.freeze({ ...binding }),
    scale: Object.freeze({ ...scale, view: Object.freeze({ ...scale.view }) }),
    visibility,
    isCurrent(current: Project) {
      return current === project;
    },
  });
}
export type WorkingViewContext = ReturnType<typeof resolveWorkingView>;

/** Reject a delayed pane/context from another snapshot, including an earlier load. */
export function assertWorkingViewCurrent(context: WorkingViewContext, project: Project) {
  if (!context.isCurrent(project))
    throw new Error("Die Arbeitsansicht wurde geändert. Ansicht erneut auflösen.");
}
