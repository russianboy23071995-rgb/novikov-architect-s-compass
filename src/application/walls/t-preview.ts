import { validateProject, type Project } from "../../domain/project/schema.ts";
import type { CornerTarget } from "../../domain/elements/wall/corner-openings.ts";
import { deriveRightAngleTJunction } from "../../domain/elements/wall/t-junction.ts";
import { wallContourSolid } from "../../domain/elements/wall/contour-solid.ts";

/** Explicit isolated pair only; derived geometry never becomes an editable Project. */
export function deriveTPreview(project: Project, hostId: string, incoming: CornerTarget) {
  validateProject(project);
  const host = project.storey.walls.find((w) => w.id === hostId);
  const wall = project.storey.walls.find((w) => w.id === incoming.wallId);
  if (!host || !wall) throw new Error("Beide Wände müssen im aktuellen Modell vorhanden sein.");
  const ids = new Set([hostId, incoming.wallId]);
  if (project.storey.windows.some((w) => ids.has(w.wallId)))
    throw new Error("T-Vorschau unterstützt zunächst nur Wände ohne Fenster.");
  if (project.storey.wallJoins.some((j) => ids.has(j.first.wallId) || ids.has(j.second.wallId)))
    throw new Error("T-Vorschau unterstützt zunächst nur Wände ohne weitere Anschlüsse.");
  const geometry = deriveRightAngleTJunction(host, { wall, endpoint: incoming.endpoint });
  const walls = [
    wallContourSolid(host, geometry.host.points, []),
    wallContourSolid(wall, geometry.incoming.points, []),
  ];
  const volume = walls.reduce((sum, w) => sum + w.volume, 0);
  if (!Number.isFinite(volume)) throw new Error("Anschlussvolumen nicht darstellbar.");
  return { walls, volume };
}
