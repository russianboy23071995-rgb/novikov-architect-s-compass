import type { Project } from "@/domain/project/schema";
import type { Section } from "@/domain/views/sections";
import type { DocumentFraming } from "@/domain/views/documents";
import {
  rememberedSectionDrawing,
  sectionExtent,
  type SectionDrawing,
} from "@/rendering/viewport/section-drawing";

/** Storey marks outside the border (BS1): triangle 2,5 mm on paper like the section symbol. */
export const MARK_PAPER = 0.0025;

/** The section drawing, remembered per project and section and reused while nothing it reads
 * changes (docs/performance/SECTION_PARTS.md); a layout draws it every frame. */
export const cachedSectionDrawing = rememberedSectionDrawing;

/** Extent of the drawing with its storey marks at this scale (BS1, ZW4). */
export const sectionGraphicExtent = (drawing: SectionDrawing, denominator: number) =>
  sectionExtent(drawing, MARK_PAPER * denominator * 8);

/**
 * The frame a section or elevation document keeps (docs/ZEICHNUNG.md, ZW5): its whole drawing
 * now, so it stays when the model grows. Null when the line sees nothing. The zoom is unused for
 * sections; it only satisfies the frame schema.
 */
export function sectionFraming(
  project: Project,
  section: Section,
  denominator: number,
): DocumentFraming | null {
  const drawing = cachedSectionDrawing(project, section);
  if (!drawing.bounds) return null;
  const e = sectionGraphicExtent(drawing, denominator);
  return {
    center: { x: (e.minX + e.maxX) / 2, y: (e.minY + e.maxY) / 2 },
    width: e.maxX - e.minX,
    height: e.maxY - e.minY,
    pixelsPerMetre: 100,
  };
}
