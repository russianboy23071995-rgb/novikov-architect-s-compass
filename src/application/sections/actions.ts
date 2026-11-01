import { validateLike } from "../../domain/project/owned-snapshot.ts";
import type { Project } from "../../domain/project/schema.ts";
import {
  nextSectionMark,
  sectionName,
  elevationName,
  isElevation,
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

/** Tool defaults of the elevation tool (docs/ANSICHTEN.md, A1). */
export const ELEVATION_TOOL_DEFAULTS: SectionDefaults = {
  markKind: "numbers",
  namePrefix: "Ansicht",
  symbolSize: SECTION_SYMBOL_SIZE,
};

type SectionKind = "section" | "elevation";

/** Mark and name the next section or elevation gets; marks run per kind. */
export function nextSectionLabel(
  project: Project,
  defaults: SectionDefaults,
  kind: SectionKind = "section",
) {
  const same = (project.sections ?? []).filter((s) => isElevation(s) === (kind === "elevation"));
  const mark = nextSectionMark(same, defaults.markKind);
  return kind === "elevation"
    ? { mark, name: elevationName(defaults.namePrefix.trim() || "Ansicht", mark) }
    : { mark, name: sectionName(defaults.namePrefix.trim() || "Schnitt", mark) };
}

/** A new section with the next free mark; works in any storey (the section is the building's). */
export function addSection(
  project: Project,
  section: Pick<Section, "id" | "start" | "end" | "look"> & { kind?: SectionKind },
  defaults: SectionDefaults = SECTION_TOOL_DEFAULTS,
): Project {
  const { kind = "section", ...line } = section;
  return validateLike(project, {
    ...project,
    sections: [
      ...(project.sections ?? []),
      {
        ...nextSectionLabel(project, defaults, kind),
        symbolSize: defaults.symbolSize,
        ...line,
        ...(kind === "elevation" ? { kind } : {}),
      },
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

/** The four elevations around the building, 2 m from its outline, each looking at it. */
const FOUR = [
  { mark: "N", name: "Nordansicht" },
  { mark: "O", name: "Ostansicht" },
  { mark: "S", name: "Südansicht" },
  { mark: "W", name: "Westansicht" },
] as const;

/**
 * Quick start of the elevation tool (A1): north, east, south and west elevation around the
 * outline of all walls and slabs of all storeys, 2 m away, 1 m longer than the building at both
 * ends. Marks N, O, S, W; one that an elevation already uses is skipped.
 */
export function addFourElevations(
  project: Project,
  ids: () => string,
  defaults: SectionDefaults = ELEVATION_TOOL_DEFAULTS,
): Project {
  const points = project.storeys.flatMap((storey) => [
    ...storey.walls.flatMap((w) => [w.start, w.end].map((p) => ({ p, r: w.thickness }))),
    ...(storey.slabs ?? []).flatMap((s) => s.points.map((p) => ({ p, r: 0 }))),
  ]);
  if (!points.length) throw new Error("Für Ansichten braucht das Modell Wände oder Decken.");
  const minX = Math.min(...points.map(({ p, r }) => p.x - r)) - 2,
    maxX = Math.max(...points.map(({ p, r }) => p.x + r)) + 2,
    minY = Math.min(...points.map(({ p, r }) => p.y - r)) - 2,
    maxY = Math.max(...points.map(({ p, r }) => p.y + r)) + 2;
  // Each line runs so that the building lies to its left (look "left").
  const lines = {
    N: { start: { x: maxX - 1, y: maxY }, end: { x: minX + 1, y: maxY } },
    O: { start: { x: maxX, y: minY + 1 }, end: { x: maxX, y: maxY - 1 } },
    S: { start: { x: minX + 1, y: minY }, end: { x: maxX - 1, y: minY } },
    W: { start: { x: minX, y: maxY - 1 }, end: { x: minX, y: minY + 1 } },
  };
  const used = new Set((project.sections ?? []).filter(isElevation).map((s) => s.mark));
  const added = FOUR.filter((e) => !used.has(e.mark)).map((e) => ({
    id: ids(),
    name: e.name,
    mark: e.mark,
    ...lines[e.mark],
    look: "left" as const,
    symbolSize: defaults.symbolSize,
    kind: "elevation" as const,
  }));
  if (!added.length) throw new Error("Die vier Ansichten N, O, S, W gibt es schon.");
  return validateLike(project, { ...project, sections: [...(project.sections ?? []), ...added] });
}
