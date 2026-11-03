import type { Project } from "../../domain/project/schema.ts";
import { sectionDrawingInputs } from "./section-drawing.ts";

/**
 * What a drawing placed on a layout shows, as a list of object identities (docs/LAYOUTBUCH.md):
 * equal lists mean the drawing would look the same. A layout keeps its drawings at the state of
 * its last update; when a list differs, the layout shows an update symbol (user wish 03.11.2026).
 * Only owned snapshots keep their identities while unchanged; other projects always differ.
 */
export function placedDrawingKey(project: Project, documentId: string): readonly unknown[] | null {
  const document = project.drawingDocuments?.find((d) => d.id === documentId);
  const view = project.modelViews?.find((v) => v.id === document?.modelViewId);
  if (!document || !view) return null;
  if (view.kind === "section") {
    const section = project.sections?.find((s) => s.id === view.sectionId);
    return section ? [document, view, section, ...sectionDrawingInputs(project)] : null;
  }
  const storey = project.storeys.find((s) => s.id === view.storeyId);
  if (!storey) return null;
  // A plan reads its storey and the project-wide model settings; layouts, title blocks, other
  // documents, project information and the working view do not change it.
  const shared = Object.keys(project)
    .filter((name) => !NOT_SHOWN_IN_PLAN.has(name))
    .sort()
    .flatMap((name) => [name, (project as Record<string, unknown>)[name]]);
  return [document, view, storey, ...shared];
}
const NOT_SHOWN_IN_PLAN = new Set([
  "storeys",
  "drawingDocuments",
  "modelViews",
  "documentFolders",
  "layouts",
  "layoutFolders",
  "layoutDrawings",
  "masterLayouts",
  "titleBlocks",
  "projectInfo",
  "sections",
  "workingStoreyId",
  "workingViews",
  "bimVisibility",
]);

/** The two lists name the same objects in the same order. */
export const sameDrawingKey = (a: readonly unknown[] | null, b: readonly unknown[] | null) =>
  !!a && !!b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
