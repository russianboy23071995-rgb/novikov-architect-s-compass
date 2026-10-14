import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
  viewScaleKey,
  type ViewIdentity,
  type WorkingPlanIdentity,
} from "../../domain/views/scale.ts";

/** Shared working-plan identity; files without an explicit choice start at EG. */
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

/** File summaries describe the complete document, independent of the active view. */
export function projectElementCounts(project: Project | undefined) {
  const result = { walls: 0, windows: 0, lines: 0, hatches: 0, references: 0 };
  for (const storey of project?.storeys ?? [])
    for (const kind of Object.keys(result) as (keyof typeof result)[])
      result[kind] += storey[kind]?.length ?? 0;
  return result;
}
