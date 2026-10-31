import { dimensionValues, formatDimension } from "../../domain/elements/dimension/model.ts";
import { stairGeometry } from "../../domain/elements/stair/model.ts";
import { storeyOf } from "../../domain/storeys/access.ts";
import { wallLength } from "../../domain/project/schema.ts";
import type { Point, Project } from "../../domain/project/schema.ts";
import { lineLength } from "../../lib/bim/lines.ts";
import type { Selection } from "./bim-view.ts";
import { doorDinHand } from "../../domain/elements/door/model.ts";
import { slabArea } from "../../domain/elements/slab/model.ts";
import { roomArea, type Room } from "../../domain/elements/room/model.ts";
import {
  workingRoomClearHeights,
  workingRoomHeightLines,
} from "../../application/rooms/actions.ts";
import { heightLineText } from "../../application/rooms/height-lines.ts";

/** Clear height range and, per height line, the area reaching it for the menu (R3b); open parts are named, not hidden. */
function roomHeightText(project: Project, room: Room) {
  const clear = workingRoomClearHeights(project, room);
  const n = (v: number) =>
    v.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const parts: string[] = [];
  if (clear.min !== null) {
    parts.push(`lichte Höhe ${n(clear.min)}–${n(clear.max!)} m`);
    for (const r of workingRoomHeightLines(project, room))
      parts.push(
        `ab ${heightLineText(r.line)}: ${n(r.areaAbove)} m² (${(r.share * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %)`,
      );
  }
  if (clear.openArea > 1e-6) parts.push(`Höhe offen: ${n(clear.openArea)} m²`);
  return parts.map((p) => ` · ${p}`).join("");
}

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
          title: window.mark ? `Fenster ${window.mark}` : "Fenster",
          details: `Breite ${metres(window.width)} · Höhe ${metres(window.height)} · Brüstung ${metres(window.sillHeight)}`,
        }
      : null;
  }
  if (selection.kind === "door") {
    const door = storeyOf(project).doors?.find((item) => item.id === selection.id);
    return door
      ? {
          title: door.mark ? `Tür ${door.mark}` : "Tür",
          details: `Breite ${metres(door.width)} · Höhe ${metres(door.height)} · Z-Versatz ${metres(door.zOffset)} · DIN ${doorDinHand(door)}`,
        }
      : null;
  }
  if (selection.kind === "slab") {
    const slab = storeyOf(project).slabs?.find((item) => item.id === selection.id);
    return slab
      ? {
          title: "Decke",
          details: `Stärke ${metres(slab.thickness)} · Fläche ${slabArea(slab).toLocaleString("de-DE", { maximumFractionDigits: 2 })} m²`,
        }
      : null;
  }
  if (selection.kind === "roof") {
    const roof = storeyOf(project).roofs?.find((item) => item.id === selection.id);
    return roof
      ? {
          title: "Dach",
          details: `Neigung ${roof.pitch.toLocaleString("de-DE", { maximumFractionDigits: 2 })}° · Stärke ${metres(roof.thickness)}`,
        }
      : null;
  }
  if (selection.kind === "room") {
    const room = storeyOf(project).rooms?.find((item) => item.id === selection.id);
    return room
      ? {
          title: room.name ? `Raum ${room.number} · ${room.name}` : `Raum ${room.number}`,
          details: `Grundfläche ${roomArea(room).toLocaleString("de-DE", { maximumFractionDigits: 2 })} m²${room.floorBuildUp === undefined ? "" : ` · Fußbodenaufbau ${metres(room.floorBuildUp)}`}${roomHeightText(project, room)}`,
        }
      : null;
  }
  if (selection.kind === "text") {
    const text = storeyOf(project).texts?.find((item) => item.id === selection.id);
    if (!text) return null;
    const first = text.content.split("\n")[0]!;
    return {
      title: "Text",
      details: `${first.length > 28 ? first.slice(0, 27) + "…" : first} · ${text.size.value.toLocaleString("de-DE")} ${text.size.unit === "paper" ? "mm Papier" : "m Modell"}`,
    };
  }
  if (selection.kind === "dimension") {
    const chain = storeyOf(project).dimensions?.find((item) => item.id === selection.id);
    if (!chain) return null;
    const values = dimensionValues(chain);
    return {
      title: "Maßkette",
      details: `${chain.orientation === "horizontal" ? "Waagerecht" : "Senkrecht"} · ${values.length} ${values.length === 1 ? "Maß" : "Maße"} · gesamt ${formatDimension(
        values.reduce((a, b) => a + b, 0),
        chain.units,
      )}`,
    };
  }
  if (selection.kind === "column") {
    const column = storeyOf(project).columns?.find((item) => item.id === selection.id);
    if (!column) return null;
    const section =
      column.shape.kind === "circle"
        ? `Rund Ø ${metres(column.shape.diameter)}`
        : `Rechteckig ${metres(column.shape.width)} × ${metres(column.shape.depth)}`;
    return {
      title: "Stütze",
      details: `${section} · ${column.topBinding ? "bis Geschoss darüber" : `Höhe ${metres(column.height!)}`}`,
    };
  }
  if (selection.kind === "stair") {
    const stair = storeyOf(project).stairs?.find((item) => item.id === selection.id);
    if (!stair) return null;
    const g = stairGeometry(stair, storeyOf(project).height ?? null);
    const shape = { straight: "Gerade", l: "L-Treppe", u: "U-Treppe" }[stair.shape];
    return {
      title: "Treppe",
      details: g
        ? `${shape} · ${g.flights.length > 1 ? `${g.flights.join(" + ")} = ` : ""}${g.riserCount} Steigungen à ${metres(g.riser)} · Lauflänge ${metres(g.run)}${g.issues.length ? " · DIN-Hinweis" : ""}`
        : `${shape} · Breite ${metres(stair.width)}`,
    };
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
