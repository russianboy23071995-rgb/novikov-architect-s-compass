import { wallLength } from "../../lib/bim/model.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { lineLength } from "../../lib/bim/lines.ts";
import type { Selection } from "./bim-view.ts";

export function clampMenuPosition(
  point: Point,
  bounds: { width: number; height: number; menuWidth: number; menuHeight: number },
): Point {
  return {
    x: Math.max(8, Math.min(point.x, bounds.width - bounds.menuWidth - 8)),
    y: Math.max(8, Math.min(point.y, bounds.height - bounds.menuHeight - 8)),
  };
}

/** Resolve by stable ID, never by list order or proximity. */
export function selectionSummary(project: Project, selection: Selection) {
  if (!selection) return null;
  const metres = (value: number) =>
    `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
  if (selection.kind === "wall") {
    const wall = project.storey.walls.find((item) => item.id === selection.id);
    return wall
      ? {
          title: "Wand",
          details: `Länge ${metres(wallLength(wall))} · Höhe ${metres(wall.height)} · Stärke ${metres(wall.thickness)}`,
        }
      : null;
  }
  if (selection.kind === "window") {
    const window = project.storey.windows.find((item) => item.id === selection.id);
    return window
      ? {
          title: "Fenster",
          details: `Breite ${metres(window.width)} · Höhe ${metres(window.height)} · Brüstung ${metres(window.sillHeight)}`,
        }
      : null;
  }
  if (selection.kind === "hatch") {
    const hatch = project.storey.hatches.find((h) => h.id === selection.id);
    return hatch
      ? { title: "Schraffur", details: `${hatch.points.length} Eckpunkte · 2D-Füllung` }
      : null;
  }
  const line = project.storey.lines?.find((item) => item.id === selection.id);
  return line
    ? {
        title: line.kind === "polyline" ? "Polylinie" : "Linie",
        details: `Länge ${metres(lineLength(line))} · ${line.points.length} Punkte`,
      }
    : null;
}
