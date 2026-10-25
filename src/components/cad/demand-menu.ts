import { storeyOf } from "../../domain/storeys/access.ts";
import { wallLength } from "../../lib/bim/model.ts";
import type { Point, Project } from "../../lib/bim/model.ts";
import { lineLength } from "../../lib/bim/lines.ts";
import type { Selection } from "./bim-view.ts";
import { doorDinHand } from "../../domain/elements/door/model.ts";

export type MenuObstacle = { left: number; top: number; right: number; bottom: number };

/** Keep the menu inside the viewport and off obstacles such as the command bar, so a click
 * meant for the bar can never hit a menu action. Avoids an obstacle above, else left, else
 * right of it; stays where it is only when none of these fit into the viewport.
 */
export function clampMenuPosition(
  point: Point,
  bounds: {
    width: number;
    height: number;
    menuWidth: number;
    menuHeight: number;
    obstacles?: readonly MenuObstacle[];
  },
): Point {
  const clamp = (p: Point): Point => ({
    x: Math.max(8, Math.min(p.x, bounds.width - bounds.menuWidth - 8)),
    y: Math.max(8, Math.min(p.y, bounds.height - bounds.menuHeight - 8)),
  });
  let next = clamp(point);
  for (const o of bounds.obstacles ?? []) {
    const overlaps =
      next.x < o.right &&
      next.x + bounds.menuWidth > o.left &&
      next.y < o.bottom &&
      next.y + bounds.menuHeight > o.top;
    if (!overlaps) continue;
    const candidates: Point[] = [
      { x: next.x, y: o.top - bounds.menuHeight - 8 },
      { x: o.left - bounds.menuWidth - 8, y: next.y },
      { x: o.right + 8, y: next.y },
    ];
    const fits = candidates.find(
      (c) =>
        c.x >= 8 &&
        c.y >= 8 &&
        c.x + bounds.menuWidth <= bounds.width - 8 &&
        c.y + bounds.menuHeight <= bounds.height - 8,
    );
    if (fits) next = fits;
  }
  return next;
}

/** Resolve by stable ID, never by list order or proximity. */
export function selectionSummary(project: Project, selection: Selection) {
  if (!selection) return null;
  const metres = (value: number) =>
    `${value.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m`;
  if (selection.kind === "reference")
    return storeyOf(project).references.some((r) => r.id === selection.id)
      ? { title: "Bildreferenz", details: "2D-Referenz" }
      : null;
  if (selection.kind === "wall") {
    const wall = storeyOf(project).walls.find((item) => item.id === selection.id);
    return wall
      ? {
          title: "Wand",
          details: `Länge ${metres(wallLength(wall))} · Höhe ${metres(wall.height)} · Stärke ${metres(wall.thickness)}`,
        }
      : null;
  }
  if (selection.kind === "window") {
    const window = storeyOf(project).windows.find((item) => item.id === selection.id);
    return window
      ? {
          title: "Fenster",
          details: `Breite ${metres(window.width)} · Höhe ${metres(window.height)} · Brüstung ${metres(window.sillHeight)}`,
        }
      : null;
  }
  if (selection.kind === "door") {
    const door = storeyOf(project).doors?.find((item) => item.id === selection.id);
    return door
      ? {
          title: "Tür",
          details: `Breite ${metres(door.width)} · Höhe ${metres(door.height)} · Z-Versatz ${metres(door.zOffset)} · DIN ${doorDinHand(door)}`,
        }
      : null;
  }
  if (selection.kind === "hatch") {
    const hatch = storeyOf(project).hatches.find((h) => h.id === selection.id);
    return hatch
      ? { title: "Schraffur", details: `${hatch.points.length} Eckpunkte · 2D-Füllung` }
      : null;
  }
  const line = storeyOf(project).lines?.find((item) => item.id === selection.id);
  return line
    ? {
        title: line.kind === "polyline" ? "Polylinie" : "Linie",
        details: `Länge ${metres(lineLength(line))} · ${line.points.length} Punkte`,
      }
    : null;
}
