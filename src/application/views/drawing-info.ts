import type { Project } from "../../domain/project/schema.ts";

/** Kind of the source of a drawing document. */
export type DrawingKind = "floor-plan" | "section" | "elevation";
export const DRAWING_KIND_LABELS: Record<DrawingKind, string> = {
  "floor-plan": "Grundriss",
  section: "Schnitt",
  elevation: "Ansicht",
};

/**
 * The information every drawing document carries (docs/ABBILDER.md, AB1): its drawing name
 * and its scale, whatever it shows. Automatic texts of title blocks read them from here; every
 * future kind of document must answer this query.
 */
export type DrawingInfo = {
  documentId: string;
  kind: DrawingKind;
  kindLabel: string;
  /** Zeichnungsname: the name given to the document. */
  name: string;
  denominator: number;
  /** Maßstab as written on a plan, „1:50“. */
  scale: string;
  /** Storey or section shown. */
  sourceName: string;
};

export function drawingInfo(project: Project, documentId: string): DrawingInfo {
  const document = project.drawingDocuments?.find((d) => d.id === documentId);
  if (!document) throw new Error("Das Abbild existiert nicht mehr.");
  const view = project.modelViews?.find((v) => v.id === document.modelViewId);
  if (!view) throw new Error("Die Modellansicht des Abbilds fehlt.");
  let kind: DrawingKind, sourceName: string;
  if (view.kind === "floor-plan") {
    kind = "floor-plan";
    sourceName = project.storeys.find((s) => s.id === view.storeyId)?.name ?? "";
  } else {
    const section = project.sections?.find((s) => s.id === view.sectionId);
    kind = section?.kind === "elevation" ? "elevation" : "section";
    sourceName = section?.name ?? "";
  }
  return {
    documentId,
    kind,
    kindLabel: DRAWING_KIND_LABELS[kind],
    name: document.name,
    denominator: document.denominator,
    scale: `1:${String(document.denominator).replace(".", ",")}`,
    sourceName,
  };
}
