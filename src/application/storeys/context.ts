import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
  viewScaleKey,
  type ViewIdentity,
  type WorkingPlanIdentity,
} from "../../domain/views/scale.ts";

/** The schema21 single-storey default lives here, not in view consumers. */
export function defaultWorkingPlan(project: Project): WorkingPlanIdentity {
  return { kind: "working-plan", projectId: project.id, storeyId: storeyOf(project).id };
}

/** Read-only resolution against a validated immutable snapshot; no active-view fallback. */
export function resolveViewStorey(project: Project, binding: ViewIdentity) {
  viewScaleKey(binding);
  if (binding.projectId !== project.id) throw new Error("Fremder Projektkontext.");
  const document =
    binding.kind === "drawing-document"
      ? project.drawingDocuments?.find((item) => item.id === binding.documentId)
      : undefined;
  if (binding.kind === "drawing-document" && !document)
    throw new Error("Das Abbild existiert nicht mehr.");
  const source = document
    ? project.modelViews?.find((item) => item.id === document.modelViewId)
    : undefined;
  if (document && (!source || source.kind !== "floor-plan"))
    throw new Error("Die Modellansicht des Abbilds fehlt.");
  const storeyId = binding.kind === "working-plan" ? binding.storeyId : source!.storeyId;
  const storey = project.storeys.find((s) => s.id === storeyId);
  if (!storey) throw new Error("Unbekanntes Geschoss im Ansichtskontext.");
  return Object.freeze({
    binding: Object.freeze({ ...binding }),
    storey,
    document,
    source,
    isCurrent: (current: Project) => current === project,
  });
}
