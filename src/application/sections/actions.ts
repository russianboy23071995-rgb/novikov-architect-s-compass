import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
  nextSectionMark,
  sectionName,
  SECTION_SYMBOL_SIZE,
  type SectionSymbolSize,
  type Section,
  type SectionMarkKind,
} from "../../domain/views/sections.ts";

/** Tool defaults of the section tool (docs/SCHNITT.md, SC2; symbol size SC4). */
export type SectionDefaults = {
  markKind: SectionMarkKind;
  namePrefix: string;
  symbolSize: SectionSymbolSize;
};
export const SECTION_TOOL_DEFAULTS: SectionDefaults = {
  markKind: "letters",
  namePrefix: "Schnitt",
  symbolSize: SECTION_SYMBOL_SIZE,
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
    sections: [
      ...(project.sections ?? []),
      { ...nextSectionLabel(project, defaults), symbolSize: defaults.symbolSize, ...section },
    ],
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

/** Grips of a selected section line in plan (docs/SCHNITT.md, SC5). */
export type SectionGrip = "start" | "end" | "move";
type Line = Pick<Section, "start" | "end">;
type Point = Section["start"];

/** Where a grip sits on the line. */
export function sectionGripPoint(section: Line, grip: SectionGrip): Point {
  if (grip !== "move") return section[grip];
  return {
    x: (section.start.x + section.end.x) / 2,
    y: (section.start.y + section.end.y) / 2,
  };
}

/**
 * The line after dragging a grip to `to`: an end goes there (longer, shorter, turned), the
 * middle grip moves the whole line. `keepDirection` (Shift) keeps the direction, so an end only
 * lengthens or shortens the line. Null when the line would shrink to a point or flip over.
 */
export function dragSectionGrip(
  section: Line,
  grip: SectionGrip,
  to: Point,
  keepDirection = false,
): Line | null {
  if (grip === "move") {
    const from = sectionGripPoint(section, "move");
    const dx = to.x - from.x,
      dy = to.y - from.y;
    return {
      start: { x: section.start.x + dx, y: section.start.y + dy },
      end: { x: section.end.x + dx, y: section.end.y + dy },
    };
  }
  const fixed = grip === "start" ? section.end : section.start;
  let point = to;
  if (keepDirection) {
    const moving = section[grip];
    const length = Math.hypot(moving.x - fixed.x, moving.y - fixed.y);
    const ux = (moving.x - fixed.x) / length,
      uy = (moving.y - fixed.y) / length;
    const t = (to.x - fixed.x) * ux + (to.y - fixed.y) * uy;
    if (t < 1e-3) return null;
    point = { x: fixed.x + ux * t, y: fixed.y + uy * t };
  }
  if (Math.hypot(point.x - fixed.x, point.y - fixed.y) < 1e-3) return null;
  return grip === "start"
    ? { start: point, end: section.end }
    : { start: section.start, end: point };
}

/** The line with a new length, measured from its start in the same direction. */
export function withSectionLength(section: Line, length: number): Line {
  if (!(length > 1e-3) || !Number.isFinite(length))
    throw new Error("Die Schnittlinie braucht eine Länge größer als 0.");
  const dx = section.end.x - section.start.x,
    dy = section.end.y - section.start.y;
  const current = Math.hypot(dx, dy);
  return {
    start: section.start,
    end: {
      x: section.start.x + (dx / current) * length,
      y: section.start.y + (dy / current) * length,
    },
  };
}
