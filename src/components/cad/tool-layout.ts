import type { ToolId } from "./cad-types.ts";

/**
 * Tool rail layout (docs/WERKZEUGLEISTE.md, WL1): the select tool stays on top, the other tools
 * sit in three groups the user arranges freely. The layout is a user preference of this browser,
 * not part of a project.
 */
export const TOOL_GROUPS = [
  { id: "3d", label: "3D-Werkzeuge", short: "3D" },
  { id: "2d", label: "2D-Werkzeuge", short: "2D" },
  { id: "doc", label: "Dokumentationswerkzeuge", short: "DOK" },
] as const;
export type ToolGroupId = (typeof TOOL_GROUPS)[number]["id"];
export type ToolLayout = Record<ToolGroupId, ToolId[]>;

export const DEFAULT_TOOL_LAYOUT: ToolLayout = {
  "3d": ["wall", "column", "stair", "window", "door", "slab", "roof", "room"],
  "2d": ["line", "hatch", "text"],
  doc: ["dimension", "section"],
};

const groupIds = TOOL_GROUPS.map((g) => g.id);
const homeGroup = new Map<ToolId, ToolGroupId>(
  groupIds.flatMap((g) => DEFAULT_TOOL_LAYOUT[g].map((tool) => [tool, g] as const)),
);
const railTools = new Set<string>(homeGroup.keys());

/**
 * A stored layout made safe: unknown tools and repeats are dropped, missing groups are empty,
 * and every rail tool appears exactly once (tools added later go to their default group).
 */
export function normalizeToolLayout(raw: unknown): ToolLayout {
  const seen = new Set<string>();
  const layout = {} as ToolLayout;
  for (const g of groupIds) {
    const list = raw && typeof raw === "object" ? (raw as Record<string, unknown>)[g] : undefined;
    layout[g] = (Array.isArray(list) ? list : []).filter(
      (tool): tool is ToolId =>
        typeof tool === "string" && railTools.has(tool) && !seen.has(tool) && !!seen.add(tool),
    );
  }
  for (const [tool, g] of homeGroup) if (!seen.has(tool)) layout[g].push(tool);
  return layout;
}

/** Moves a tool to `index` within `group` (the same or another group). */
export function moveTool(
  layout: ToolLayout,
  tool: ToolId,
  group: ToolGroupId,
  index: number,
): ToolLayout {
  const from = groupIds.find((g) => layout[g].includes(tool));
  if (!from) return layout;
  const next = { ...layout } as ToolLayout;
  const fromIndex = layout[from].indexOf(tool);
  next[from] = layout[from].filter((t) => t !== tool);
  // Within one group the slot after the tool's own place shifts by one once it is taken out.
  const at = from === group && index > fromIndex ? index - 1 : index;
  const target = [...next[group]];
  target.splice(Math.max(0, Math.min(at, target.length)), 0, tool);
  next[group] = target;
  return next;
}

/** Keyboard moves in the customizer: up/down within the group, left/right to the next group. */
export function stepTool(
  layout: ToolLayout,
  tool: ToolId,
  step: "up" | "down" | "left" | "right",
): ToolLayout {
  const g = groupIds.find((id) => layout[id].includes(tool));
  if (!g) return layout;
  const index = layout[g].indexOf(tool);
  if (step === "up") return index > 0 ? moveTool(layout, tool, g, index - 1) : layout;
  if (step === "down")
    return index < layout[g].length - 1 ? moveTool(layout, tool, g, index + 2) : layout;
  const other = groupIds[groupIds.indexOf(g) + (step === "left" ? -1 : 1)];
  return other ? moveTool(layout, tool, other, layout[other].length) : layout;
}
