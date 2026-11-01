import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
  nextSectionMark,
  sectionName,
  type Section,
  type SectionMarkKind,
} from "../../domain/views/sections.ts";

/** Tool defaults of the section tool (docs/SCHNITT.md, SC2). */
export type SectionDefaults = { markKind: SectionMarkKind; namePrefix: string };
export const SECTION_TOOL_DEFAULTS: SectionDefaults = {
  markKind: "letters",
  namePrefix: "Schnitt",
};

/** Mark and name the next section gets with these defaults. */
export function nextSectionLabel(project: Project, defaults: SectionDefaults) {
  const mark = nextSectionMark(project.sections ?? [], defaults.markKind);
  return { mark, name: sectionName(defaults.namePrefix.trim() || "Schnitt", mark) };
}

/** A new section with the next free mark; works in any storey (the section is the building's). */
export function addSection(
  project: Project,
  section: Pick<Section, "id" | "start" | "end" | "look">,
  defaults: SectionDefaults = SECTION_TOOL_DEFAULTS,
): Project {
  return validateLike(project, {
    ...project,
    sections: [...(project.sections ?? []), { ...nextSectionLabel(project, defaults), ...section }],
  });
}

export function updateSection(
  project: Project,
  sectionId: string,
  changes: Partial<Omit<Section, "id">>,
): Project {
  const sections = project.sections ?? [];
  if (!sections.some((s) => s.id === sectionId))
    throw new Error(`Unbekannter Schnitt: ${sectionId}`);
  return validateLike(project, {
    ...project,
    sections: sections.map((s) => (s.id === sectionId ? { ...s, ...changes, id: s.id } : s)),
  });
}

export function removeSection(project: Project, sectionId: string): Project {
  const sections = project.sections ?? [];
  if (!sections.some((s) => s.id === sectionId))
    throw new Error(`Unbekannter Schnitt: ${sectionId}`);
  return validateLike(project, {
    ...project,
    sections: sections.filter((s) => s.id !== sectionId),
  });
}
