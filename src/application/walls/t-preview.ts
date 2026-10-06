import { type Project } from "../../domain/project/schema.ts";
import type { CornerTarget } from "../../domain/elements/wall/corner-openings.ts";
import { inspectTOpenings } from "../../domain/elements/wall/t-openings.ts";
import { wallContourSolid } from "../../domain/elements/wall/contour-solid.ts";

/** Explicit isolated pair only; derived geometry never becomes an editable Project. */
export function deriveTPreview(project: Project, hostId: string, incoming: CornerTarget) {
  const { geometry, openings } = inspectTOpenings(project, hostId, incoming);
  const blocked = openings.find((o) => o.status === "overlapping");
  if (blocked) {
    const number = project.storey.windows.findIndex((w) => w.id === blocked.windowId) + 1;
    throw new Error(`Fenster ${number} überschneidet den T-Anschluss. Berührung ist erlaubt.`);
  }
  const host = project.storey.walls.find((w) => w.id === hostId)!;
  const wall = project.storey.walls.find((w) => w.id === incoming.wallId)!;
  const walls = [
    wallContourSolid(host, geometry.host.points, project.storey.windows),
    wallContourSolid(wall, geometry.incoming.points, project.storey.windows),
  ];
  const volume = walls.reduce((sum, w) => sum + w.volume, 0);
  if (!Number.isFinite(volume)) throw new Error("Anschlussvolumen nicht darstellbar.");
  return { walls, volume };
}
