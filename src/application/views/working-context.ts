import { storeyOf } from "../../domain/storeys/access.ts";
import { defaultWorkingPlan, resolveViewStorey } from "../storeys/context.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
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
  binding: WorkingPlanIdentity = defaultWorkingPlan(project),
  visibilityOverride?: LayerVisibilityContext,
) {
  const scale = projectScaleContext(project, binding);
  const context = resolveViewStorey(project, binding);
  return resolvedContext(
    project,
    context,
    binding,
    scale,
    visibilityOverride ?? {
      scope: { kind: "bim-project" },
      hiddenLayerIds: project.bimVisibility.hiddenLayerIds,
    },
  );
}

export function resolveDocumentView(project: Project, binding: DocumentIdentity) {
  if (binding.kind !== "drawing-document") throw new Error("Ungültiger Abbildkontext.");
  const context = resolveViewStorey(project, binding);
  const document = context.document!;
  return resolvedContext(
    project,
    context,
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
  context: ReturnType<typeof resolveViewStorey>,
  binding: T,
  scale: ScaleContext,
  filter: LayerVisibilityContext,
) {
  const visibility = createLayerVisibilityPolicy(project, filter);
  return Object.freeze({
    binding: Object.freeze({ ...binding }),
    scale: Object.freeze({ ...scale, view: Object.freeze({ ...scale.view }) }),
    visibility,
    storey: storeyOf(context),
    isCurrent: context.isCurrent,
  });
}
export type WorkingViewContext =
  ReturnType<typeof resolveWorkingView> | ReturnType<typeof resolveDocumentView>;

/** Reject a delayed pane/context from another snapshot, including an earlier load. */
export function assertWorkingViewCurrent(context: WorkingViewContext, project: Project) {
  if (!context.isCurrent(project))
    throw new Error("Die Arbeitsansicht wurde geändert. Ansicht erneut auflösen.");
}
