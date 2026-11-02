import type { Project } from "@/domain/project/schema";
import type { Section } from "@/domain/views/sections";
import {
  sectionDrawing,
  sectionExtent,
  type SectionDrawing,
} from "@/rendering/viewport/section-drawing";

/** Storey marks outside the border (BS1): triangle 2,5 mm on paper like the section symbol. */
export const MARK_PAPER = 0.0025;

const drawings = new WeakMap<Project, WeakMap<Section, SectionDrawing>>();
/** The section drawing, derived once per project and section (a layout draws it every frame). */
export function cachedSectionDrawing(project: Project, section: Section): SectionDrawing {
  let bySection = drawings.get(project);
  if (!bySection) drawings.set(project, (bySection = new WeakMap()));
  let drawing = bySection.get(section);
  if (!drawing) bySection.set(section, (drawing = sectionDrawing(project, section)));
  return drawing;
}

/** Extent of the drawing with its storey marks at this scale (BS1, ZW4). */
export const sectionGraphicExtent = (drawing: SectionDrawing, denominator: number) =>
  sectionExtent(drawing, MARK_PAPER * denominator * 8);
