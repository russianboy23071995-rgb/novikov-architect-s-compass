import type { Project } from "../../domain/project/schema.ts";
import type { SectionHeightMarks } from "../../domain/views/sections.ts";
import { updateSection } from "./actions.ts";

/**
 * Height marks of a section or elevation drawing (docs/SCHNITT.md, BS2). Each change is one
 * project change and so one undo step.
 */
const sectionOf = (project: Project, sectionId: string) => {
  const section = project.sections?.find((s) => s.id === sectionId);
  if (!section) throw new Error(`Unbekannter Schnitt: ${sectionId}`);
  return section;
};

/** One mark per height: points at the same height (1 mm) count once, the first one stays. */
export function distinctHeights(points: readonly SectionHeightMarks["points"][number][]) {
  const kept: SectionHeightMarks["points"][number][] = [];
  for (const p of points)
    if (!kept.some((q) => Math.abs(q.z - p.z) < 0.001)) kept.push({ x: p.x, z: p.z });
  return kept;
}

export function addHeightMarks(
  project: Project,
  sectionId: string,
  marks: SectionHeightMarks,
): Project {
  const section = sectionOf(project, sectionId);
  const points = distinctHeights(marks.points);
  if (!points.length) throw new Error("Mindestens einen Punkt für die Höhenkote anklicken.");
  return updateSection(project, sectionId, {
    heightMarks: [...(section.heightMarks ?? []), { ...marks, points }],
  });
}

export function updateHeightMarks(
  project: Project,
  sectionId: string,
  marksId: string,
  changes: Partial<Pick<SectionHeightMarks, "x" | "kind">>,
): Project {
  const section = sectionOf(project, sectionId);
  if (!section.heightMarks?.some((m) => m.id === marksId))
    throw new Error("Höhenkoten nicht gefunden.");
  return updateSection(project, sectionId, {
    heightMarks: section.heightMarks.map((m) => (m.id === marksId ? { ...m, ...changes } : m)),
  });
}

export function removeHeightMarks(project: Project, sectionId: string, marksId: string): Project {
  const section = sectionOf(project, sectionId);
  if (!section.heightMarks?.some((m) => m.id === marksId))
    throw new Error("Höhenkoten nicht gefunden.");
  return updateSection(project, sectionId, {
    heightMarks: section.heightMarks.filter((m) => m.id !== marksId),
  });
}
