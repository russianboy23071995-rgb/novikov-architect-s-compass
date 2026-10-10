import { drawingDocument } from "./documents.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
  viewScaleKey,
  type ViewIdentity,
  type ScaleContext,
  type DocumentIdentity,
  type WorkingPlanIdentity,
} from "../../domain/views/scale.ts";
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
  if (
    binding.kind !== "working-plan" ||
    binding.projectId !== project.id ||
    binding.storeyId !== project.storey.id
  )
    throw new Error("Die Arbeitsansicht gehört nicht zu diesem Projekt oder Geschoss.");
  const scale = projectScaleContext(project);
  return resolvedContext(
    project,
    binding,
    scale,
    visibilityOverride ?? {
      scope: { kind: "bim-project" },
      hiddenLayerIds: project.bimVisibility.hiddenLayerIds,
    },
  );
}

export function resolveDocumentView(project: Project, binding: DocumentIdentity) {
  viewScaleKey(binding);
  if (binding.kind !== "drawing-document" || binding.projectId !== project.id)
    throw new Error("Fremder Abbildkontext.");
  const document = drawingDocument(project, binding.documentId);
  const source = project.modelViews?.find((v) => v.id === document.modelViewId);
  if (!source || source.kind !== "floor-plan" || source.storeyId !== project.storey.id)
    throw new Error("Die Modellansicht des Abbilds fehlt.");
  return resolvedContext(
    project,
    binding,
    { view: binding, denominator: document.denominator },
    {
      scope: { kind: "drawing-document", documentId: document.id },
      hiddenLayerIds: document.hiddenLayerIds,
    },
  );
}
function resolvedContext<T extends ViewIdentity>(
  project: Project,
  binding: T,
  scale: ScaleContext,
  filter: LayerVisibilityContext,
) {
  const visibility = createLayerVisibilityPolicy(project, filter);
  return Object.freeze({
    binding: Object.freeze({ ...binding }),
    scale: Object.freeze({ ...scale, view: Object.freeze({ ...scale.view }) }),
    visibility,
    isCurrent(current: Project) {
      return current === project;
    },
  });
}
export type WorkingViewContext =
  ReturnType<typeof resolveWorkingView> | ReturnType<typeof resolveDocumentView>;

/** Reject a delayed pane/context from another snapshot, including an earlier load. */
export function assertWorkingViewCurrent(context: WorkingViewContext, project: Project) {
  if (!context.isCurrent(project))
    throw new Error("Die Arbeitsansicht wurde geändert. Ansicht erneut auflösen.");
}
