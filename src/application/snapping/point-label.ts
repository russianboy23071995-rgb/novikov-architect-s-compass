import { storeyOf } from "../../domain/storeys/access.ts";
import type { Project } from "../../domain/project/schema.ts";

/** Element names in snap labels (docs/POLYGON_REGELN.md, Regel 6). */
const ELEMENT_NAMES = [
  ["walls", "Wand"],
  ["slabs", "Decke"],
  ["roofs", "Dach"],
  ["rooms", "Raum"],
  ["columns", "Stütze"],
  ["hatches", "Schraffur"],
  ["lines", "Linie"],
  ["windows", "Fenster"],
  ["doors", "Tür"],
] as const;

/**
 * Readable name of a snapped element point, e.g. „Decke · Ecke 3“, „Linie · Punkt 4“,
 * „Wand · Anfang“. Numbers count from 1 like the corner grips. Null when the source is no
 * element of the working storey (guides, transient points); the caller keeps its own label.
 */
export function snapPointLabel(
  project: Project,
  entityId: string | null,
  feature: string,
): string | null {
  if (!entityId) return null;
  // Transient points of the running drawing (docs/POLYGON_REGELN.md, Regel 3).
  if (entityId === "@drawing-start") return "Startpunkt";
  if (entityId === "@drawing-origin") return "Letzter Punkt";
  const storey = storeyOf(project);
  const match = ELEMENT_NAMES.find(([key]) =>
    (storey[key] ?? []).some((item: { id: string }) => item.id === entityId),
  );
  if (!match) return null;
  const [key, name] = match;
  const vertex = /^vertex-(\d+)$/.exec(feature);
  if (vertex) {
    let index = Number(vertex[1]);
    if (key === "lines") {
      // A closed polyline repeats its start point at the end: one point, one number.
      const points = storey.lines!.find((l) => l.id === entityId)!.points;
      const last = points.length - 1;
      if (
        index === last &&
        last > 1 &&
        points[0]!.x === points[last]!.x &&
        points[0]!.y === points[last]!.y
      )
        index = 0;
      return `${name} · Punkt ${index + 1}`;
    }
    return `${name} · Ecke ${index + 1}`;
  }
  if (feature === "centre") return `${name} · Mitte`;
  if (feature.startsWith("quadrant-")) return `${name} · Rand`;
  if (feature === "axis-start") return `${name} · Anfang`;
  if (feature === "axis-end") return `${name} · Ende`;
  const corner = /^(?:join-)?corner-([01])-/.exec(feature);
  if (corner) return `${name} · Ecke ${corner[1] === "0" ? "Anfang" : "Ende"}`;
  if (feature.startsWith("jamb-")) return `${name} · Laibung`;
  return `${name} · Punkt`;
}
